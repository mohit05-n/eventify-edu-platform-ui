import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request, { params }) {
  try {
    const { id: eventIdStr } = await params;
    const eventId = parseInt(eventIdStr);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const session = await getSession();

    // Updated query to JOIN with users table for organizer info
    let eventQuery;
    let queryParams;

    if (session?.role === 'organiser') {
      // Organizers can see their own events regardless of status
      eventQuery = `
        SELECT e.*, 
               u.name as organiser_name, 
               u.email as organiser_email,
               u.college as organiser_college,
               (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as current_capacity
        FROM events e
        LEFT JOIN users u ON e.organiser_id = u.id
        WHERE e.id = $1 AND e.organiser_id = $2
      `;
      queryParams = [eventId, session.userId];
    } else {
      // Public users can only see approved events
      eventQuery = `
        SELECT e.*, 
               u.name as organiser_name, 
               u.email as organiser_email,
               u.college as organiser_college,
               (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as current_capacity
        FROM events e
        LEFT JOIN users u ON e.organiser_id = u.id
        WHERE e.id = $1 AND e.status = 'approved'
      `;
      queryParams = [eventId];
    }

    const result = await query(eventQuery, queryParams);

    if (result.length === 0) {
      // Also check if event exists but isn't accessible due to permissions
      const generalCheck = await query(
        "SELECT id, status FROM events WHERE id = $1",
        [eventId]
      );

      if (generalCheck.length === 0) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      } else {
        // For organizers viewing their own pending events
        if (session?.role === 'organiser' || session?.role === 'admin') {
          const fullEventQuery = `
            SELECT e.*, 
                   u.name as organiser_name, 
                   u.email as organiser_email,
                   u.college as organiser_college,
                   (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as current_capacity
            FROM events e
            LEFT JOIN users u ON e.organiser_id = u.id
            WHERE e.id = $1
          `;
          const fullResult = await query(fullEventQuery, [eventId]);
          if (fullResult.length > 0) {
            return NextResponse.json(fullResult[0], { status: 200 });
          }
        }
        return NextResponse.json({ error: "Event not accessible" }, { status: 403 });
      }
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error("[v0] Get event error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}