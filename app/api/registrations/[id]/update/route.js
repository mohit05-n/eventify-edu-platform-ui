import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: registrationId } = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update registration status
    const result = await query(
      `UPDATE registrations 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, status`,
      [status, registrationId]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Send email notification to the attendee
    if (status === "cancelled" || status === "confirmed") {
      try {
        const regDetails = await query(
          `SELECT r.id, e.title as event_title, e.start_date, e.location,
                  u.name as user_name, u.email as user_email
           FROM registrations r
           JOIN events e ON r.event_id = e.id
           JOIN users u ON r.user_id = u.id
           WHERE r.id = $1`,
          [registrationId]
        );

        if (regDetails[0]) {
          const reg = regDetails[0];
          if (status === "cancelled") {
            await sendEmail(reg.user_email, "registrationCancelled", {
              attendeeName: reg.user_name,
              eventTitle: reg.event_title,
              eventDate: reg.start_date,
              eventLocation: reg.location
            });
          } else if (status === "confirmed") {
            const ticketId = `EVT-${reg.id}-${Date.now().toString(36).toUpperCase()}`;
            await sendEmail(reg.user_email, "registrationConfirmation", {
              attendeeName: reg.user_name,
              eventTitle: reg.event_title,
              eventDate: reg.start_date,
              eventLocation: reg.location,
              ticketId: ticketId
            });
          }
        }
      } catch (emailErr) {
        console.error("[v0] Registration status email error:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Registration status updated successfully",
      registration: result[0]
    }, { status: 200 });
  } catch (error) {
    console.error("[v0] Update registration error:", error);
    return NextResponse.json({ error: "Failed to update registration status" }, { status: 500 });
  }
}