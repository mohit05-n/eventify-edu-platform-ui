import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendEmail } from "@/lib/email"
import { saveCertificateToFile, generateCertificatePDF } from "@/lib/certificate-generator"
import { NextResponse } from "next/server"

export async function POST(request, { params }) {
    try {
        const { id: eventId } = await params
        const session = await getSession()

        if (!session || session.role !== "organiser") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 0. Auto-migrate: ensure certificate columns exist
        try {
            await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_id VARCHAR(100)`);
            await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_url TEXT`);
            await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS issue_date TIMESTAMP`);
        } catch (migrationErr) {
            console.warn("[v0] Certificate column migration warning (non-fatal):", migrationErr.message);
        }

        // 1. Fetch event and verify owner/status
        const eventRes = await query(
            "SELECT * FROM events WHERE id = $1 AND organiser_id = $2",
            [eventId, session.userId]
        )

        if (eventRes.length === 0) {
            return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 })
        }

        const event = eventRes[0]

        // 2. Validate Event Status Check: "Completed" OR "Expired"
        const isCompleted = event.status === 'completed';
        const isExpired = new Date(event.end_date) < new Date();

        if (!isCompleted && !isExpired) {
            return NextResponse.json({
                error: "Event is neither Completed nor Expired. Certificates can only be issued for ended events."
            }, { status: 400 })
        }

        // 3. Fetch all participants for this event
        const allParticipants = await query(
            `SELECT r.*, u.name as user_name, u.email as user_email,
                    org.name as organizer_name,
                    p.status as payment_status
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             JOIN events e ON r.event_id = e.id
             JOIN users org ON e.organiser_id = org.id
             LEFT JOIN payments p ON (r.id = p.registration_id OR r.booking_id = p.booking_id)
             WHERE r.event_id = $1`,
            [eventId]
        )

        // Log the fetched participants count before filtering
        console.log(`[v0] Fetched ${allParticipants.length} total participants for event ${eventId} before filtering.`);

        // 4. Fix Filtering Conditions:
        const eligibleParticipants = allParticipants.filter(p => {
            const isPaid = p.payment_status === 'completed';
            const isConfirmed = p.status === 'confirmed';
            const isCancelled = p.status === 'cancelled';
            return (isPaid || isConfirmed) && !isCancelled;
        });

        console.log(`[v0] Found ${eligibleParticipants.length} eligible participants after strict filtering.`);

        if (eligibleParticipants.length === 0) {
            return NextResponse.json({
                message: "No eligible participants found for this event."
            }, { status: 200 })
        }

        // 5. Issue certificates individually (Individual Error Handling)
        let issuedCount = 0;
        let failedCount = 0;
        const processedIds = new Set();
        for (const reg of eligibleParticipants) {
            try {
                // 6. Duplicate Check: Skip if already issued or already processed in this batch
                if (reg.certificate_issued || processedIds.has(reg.id)) {
                    console.log(`[v0] Skipping already issued/processed participant ${reg.id}`);
                    continue;
                }

                processedIds.add(reg.id);

                const certificateId = `CERT-${eventId}-${reg.id}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
                const formatDate = (date) => {
                    try {
                        return new Date(date).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric'
                        })
                    } catch (e) {
                        return "Date TBD";
                    }
                }

                // 7. PDF Generation (Save before DB insert)
                const filePath = await saveCertificateToFile({
                    participantName: reg.participant_name || reg.user_name,
                    eventTitle: event.title,
                    eventDate: formatDate(event.start_date),
                    organizerName: reg.organizer_name,
                    certificateId: certificateId
                })

                if (!filePath) {
                    throw new Error("PDF generation failed to return file path");
                }

                // 8. Database Insert/Update (Match schema exactly)
                await query(
                    `UPDATE registrations 
                     SET certificate_issued = true, 
                         certificate_id = $1, 
                         issue_date = CURRENT_TIMESTAMP,
                         certificate_url = $2,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $3`,
                    [certificateId, filePath, reg.id]
                )

                // 9. Email Notification with PDF attachment
                try {
                    const attendeeEmail = reg.participant_email || reg.user_email
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                    const downloadUrl = `${appUrl}${filePath}`
                    const hubUrl = `${appUrl}/attendee/certificates`

                    // Generate PDF buffer for email attachment
                    const pdfBuffer = await generateCertificatePDF({
                        participantName: reg.participant_name || reg.user_name,
                        eventTitle: event.title,
                        eventDate: formatDate(event.start_date),
                        organizerName: reg.organizer_name,
                        certificateId: certificateId
                    })

                    const attachments = [
                        {
                            filename: `Certificate-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}-${(reg.participant_name || reg.user_name).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf'
                        }
                    ]

                    await sendEmail(attendeeEmail, "certificateIssued", {
                        participantName: reg.participant_name || reg.user_name,
                        eventTitle: event.title,
                        eventDate: event.start_date,
                        eventEndDate: event.end_date,
                        eventLocation: event.location,
                        organizerName: reg.organizer_name,
                        certificateId: certificateId,
                        downloadUrl: downloadUrl,
                        hubUrl: hubUrl
                    }, attachments)
                } catch (emailErr) {
                    console.error("[v0] Email notification failed but cert issued:", emailErr);
                }

                issuedCount++;
            } catch (err) {
                console.error(`[v0] Failed to issue cert for reg ${reg.id}:`, err)
                failedCount++;
            }
        }

        // 10. Final Response Logic
        if (issuedCount > 0) {
            let msg = `Issued ${issuedCount} certificates successfully.`;
            if (failedCount > 0) {
                msg = `Issued ${issuedCount} certificates. ${failedCount} failed.`;
            }

            await query(
                `INSERT INTO notifications (user_id, title, message, type) 
                 VALUES ($1, $2, $3, $4)`,
                [session.userId, "Certificates Issued", msg, "general"]
            )

            return NextResponse.json({ success: true, message: msg, issuedCount, failedCount }, { status: 200 })
        } else {
            // "Eligible participants found but failed" only if all failed
            if (failedCount > 0) {
                return NextResponse.json({
                    error: "Eligible participants found but certificate generation failed for all."
                }, { status: 500 })
            }
            return NextResponse.json({
                message: "No new certificates were issued (already up to date)."
            }, { status: 200 })
        }

    } catch (error) {
        console.error("[v0] Bulk certificate issuance error:", error)
        return NextResponse.json({ error: "Failed to issue certificates" }, { status: 500 })
    }
}
