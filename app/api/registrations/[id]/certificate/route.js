import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { generateCertificatePDF } from "@/lib/certificate-generator"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
    try {
        const { id: regId } = await params
        const session = await getSession()

        if (!session) {
            return new Response("Unauthorized", { status: 401 })
        }

        // 1. Fetch registration details including event and organizer names
        const regRes = await query(
            `SELECT r.*, u.name as user_name, u.email as user_email,
                    e.title as event_title, e.start_date as event_date, e.end_date as event_end_date,
                    org.name as organizer_name
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             JOIN events e ON r.event_id = e.id
             JOIN users org ON e.organiser_id = org.id
             WHERE r.id = $1`,
            [regId]
        )

        if (regRes.length === 0) {
            return new Response("Registration not found", { status: 404 })
        }

        const reg = regRes[0]

        // 2. Security Check: Only the attendee or the organizer or admin can download
        const isAttendee = reg.user_id === session.userId
        const isOrganizer = reg.organiser_id === session.userId // Note: registrations doesn't have organiser_id directly but event has it. We joined on e.organiser_id in the query? No, we joined org as users.

        // Re-check organizer condition correctly based on joined data
        const eventOrganizerCheck = await query(
            "SELECT organiser_id FROM events WHERE id = $1",
            [reg.event_id]
        );
        const actualOrganizerId = eventOrganizerCheck[0]?.organiser_id;
        const isActualOrganiser = actualOrganizerId === session.userId;

        if (!isAttendee && !isActualOrganiser && session.role !== 'admin') {
            return new Response("Forbidden", { status: 403 })
        }

        // 3. Ensure certificate has been issued
        if (!reg.certificate_issued) {
            return new Response("Certificate has not been issued yet", { status: 400 })
        }

        // 4. Generate PDF
        const attendeeName = reg.participant_name || reg.user_name
        const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })

        const pdfBuffer = await generateCertificatePDF({
            participantName: attendeeName,
            eventTitle: reg.event_title,
            eventDate: formatDate(reg.event_date),
            organizerName: reg.organizer_name,
            certificateId: reg.certificate_id
        })

        // 5. Return PDF stream
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="certificate-${reg.certificate_id}.pdf"`,
                'Cache-Control': 'no-cache'
            }
        })

    } catch (error) {
        console.error("[v0] Certificate download error:", error)
        return new Response("Internal Server Error", { status: 500 })
    }
}
