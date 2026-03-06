import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: registrationId } = await params;

    // Get registration details with event info
    const result = await query(
      `SELECT r.*, e.title as event_title, e.location as event_location, e.start_date as event_start_date
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.id = $1 AND (r.user_id = $2 OR $3 = 'admin')`,
      [registrationId, session.userId, session.role]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error("[v0] Get registration error:", error);
    return NextResponse.json({ error: "Failed to fetch registration" }, { status: 500 });
  }
}