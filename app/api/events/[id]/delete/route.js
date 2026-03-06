import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Check if user owns the event or is admin
    const eventResult = await query(
      "SELECT organiser_id, status FROM events WHERE id = $1",
      [eventId]
    );

    if (eventResult.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only allow deletion if user is the organiser or admin
    if (session.userId !== eventResult[0].organiser_id && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete event (this will cascade delete related registrations and payments due to foreign key constraints)
    const result = await query(
      "DELETE FROM events WHERE id = $1 AND (organiser_id = $2 OR $3 = 'admin')",
      [eventId, session.userId, session.role]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully"
    }, { status: 200 });
  } catch (error) {
    console.error("[v0] Delete event error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}