import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { generateCertificatePDF } from "@/lib/certificate-generator";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request, { params }) {
    try {
        const { id: eventId } = await params;

        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch event details
        const events = await query(
            `SELECT e.*, u.name as organiser_name 
       FROM events e 
       LEFT JOIN users u ON e.organiser_id = u.id 
       WHERE e.id = $1`,
            [eventId]
        );

        if (events.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const event = events[0];

        // Verify that the requester is the organiser of this event or an admin
        if (session.role !== "admin" && event.organiser_id !== session.userId) {
            return NextResponse.json({ error: "Forbidden. Only the event organiser can issue certificates." }, { status: 403 });
        }

        // Verify that the event has ended
        if (new Date(event.end_date) > new Date()) {
            return NextResponse.json(
                { error: "Certificates can only be issued after the event has ended." },
                { status: 400 }
            );
        }

        // Fetch all confirmed participants who haven't received certificates yet
        const participants = await query(
            `SELECT r.id as registration_id, r.user_id, u.name, u.email
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1 AND r.status = 'confirmed' AND r.certificate_issued = false`,
            [eventId]
        );

        if (participants.length === 0) {
            return NextResponse.json(
                { message: "No pending certificates to issue. All confirmed participants have already received certificates.", issued: 0 },
                { status: 200 }
            );
        }

        // Ensure certificates upload directory exists
        const certDir = join(process.cwd(), "public", "uploads", "certificates");
        try {
            await mkdir(certDir, { recursive: true });
        } catch (e) {
            // Directory might already exist
        }

        let issuedCount = 0;

        for (const participant of participants) {
            const certificateId = `CERT-${eventId}-${participant.registration_id}-${Date.now().toString(36).toUpperCase()}`;
            const pdfFilename = `certificate-${certificateId}.pdf`;

            try {
                // Generate PDF certificate
                const pdfBuffer = await generateCertificatePDF({
                    participantName: participant.name,
                    eventTitle: event.title,
                    eventDate: event.start_date,
                    eventEndDate: event.end_date,
                    eventLocation: event.location,
                    organizerName: event.organiser_name,
                    certificateId: certificateId,
                });

                // Save PDF to filesystem
                const pdfPath = join(certDir, pdfFilename);
                await writeFile(pdfPath, pdfBuffer);
                const certificateUrl = `/uploads/certificates/${pdfFilename}`;

                // Send certificate email with PDF attachment
                await sendEmail(
                    participant.email,
                    "certificateIssued",
                    {
                        participantName: participant.name,
                        eventTitle: event.title,
                        eventDate: event.start_date,
                        eventEndDate: event.end_date,
                        eventLocation: event.location,
                        organizerName: event.organiser_name,
                        certificateId: certificateId,
                    },
                    [
                        {
                            filename: `Certificate-${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
                            content: pdfBuffer,
                            contentType: "application/pdf",
                        },
                    ]
                );

                // Mark certificate as issued and store URL + ID
                await query(
                    `UPDATE registrations 
           SET certificate_issued = true, certificate_url = $1, certificate_id = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
                    [certificateUrl, certificateId, participant.registration_id]
                );

                // Create notification for participant
                await query(
                    `INSERT INTO notifications (user_id, title, message, type, related_event_id)
           VALUES ($1, $2, $3, $4, $5)`,
                    [
                        participant.user_id,
                        "🏆 Certificate Ready!",
                        `Your participation certificate for "${event.title}" has been sent to your email and is now available for download. Thank you for attending!`,
                        "general",
                        parseInt(eventId),
                    ]
                );

                issuedCount++;
            } catch (err) {
                console.error(`[v0] Failed to issue certificate to ${participant.email}:`, err.message);
                // Continue with next participant even if one fails
            }
        }

        return NextResponse.json(
            {
                message: `Successfully issued ${issuedCount} certificate(s) out of ${participants.length} participants.`,
                issued: issuedCount,
                total: participants.length,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[v0] Issue certificates error:", error);
        return NextResponse.json(
            { error: "Failed to issue certificates" },
            { status: 500 }
        );
    }
}
