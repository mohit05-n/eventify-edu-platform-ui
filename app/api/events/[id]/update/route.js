import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { validateEvent, sanitizeString } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    let { title, description, category, start_date, end_date, location, max_capacity, price, image_url, speakers, schedule } = await request.json();

    // Sanitize inputs
    title = sanitizeString(title);
    description = sanitizeString(description);
    category = sanitizeString(category);
    location = sanitizeString(location);
    if (image_url) image_url = sanitizeString(image_url);
    if (speakers) speakers = sanitizeString(speakers);
    if (schedule) schedule = sanitizeString(schedule);

    // Validate input
    const validation = validateEvent({
      title,
      description,
      category,
      start_date,
      end_date,
      location,
      max_capacity,
      price
    });
    if (!validation.isValid) {
      return NextResponse.json({ error: "Validation failed: " + validation.errors.join(', ') }, { status: 400 });
    }

    // Check if user owns the event or is admin
    const eventResult = await query(
      "SELECT organiser_id, status FROM events WHERE id = $1",
      [eventId]
    );

    if (eventResult.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only allow updating if user is the organiser or admin, and if the event hasn't been approved yet
    if (session.userId !== eventResult[0].organiser_id && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update event
    const result = await query(
      `UPDATE events 
       SET title = $1, description = $2, category = $3, start_date = $4, 
           end_date = $5, location = $6, max_capacity = $7, price = $8,
           image_url = $9, speakers = $10, schedule = $11, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $12 AND (organiser_id = $13 OR $14 = 'admin') 
       RETURNING id`,
      [title, description, category, start_date, end_date, location, max_capacity, price, image_url || null, speakers || null, schedule || null, eventId, session.userId, session.role]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      eventId: result[0].id
    }, { status: 200 });
  } catch (error) {
    console.error("[v0] Update event error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}