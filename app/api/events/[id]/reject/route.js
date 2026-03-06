import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    if (!eventId || isNaN(parseInt(eventId))) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    // Get rejection reason from body if provided
    let reason = "";
    try {
      const body = await request.json();
      reason = body.reason || "";
    } catch (e) {
      // No body provided, that's fine
    }

    // Get event and organizer details before updating
    const eventDetails = await query(
      `SELECT e.*, u.email as organiser_email, u.name as organiser_name 
       FROM events e 
       JOIN users u ON e.organiser_id = u.id 
       WHERE e.id = $1`,
      [eventId]
    );

    if (eventDetails.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const event = eventDetails[0];

    // Update event status to rejected
    const result = await query(
      "UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status",
      ["rejected", eventId]
    );

    // Send rejection email to organizer
    await sendEmail(event.organiser_email, "eventRejected", {
      organizerName: event.organiser_name,
      eventTitle: event.title,
      reason: reason
    });

    // Create notification for organizer
    await query(
      `INSERT INTO notifications (user_id, title, message, type, related_event_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        event.organiser_id,
        "Event Not Approved",
        `Your event "${event.title}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
        "general",
        eventId
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Event rejected",
      event: result[0]
    }, { status: 200 });
  } catch (error) {
    console.error("[v0] Reject event error:", error);
    return NextResponse.json({ error: "Failed to reject event" }, { status: 500 });
  }
}