import { query } from "@/lib/db"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    // Get current user session to check their registrations
    const session = await getSession()
    const userId = session?.userId

    // Build the query with registration count
    let sql = `
      SELECT 
        e.*,
        COALESCE(r.registration_count, 0) as current_capacity,
        CASE WHEN e.end_date < NOW() THEN true ELSE false END as is_expired
      FROM events e
      LEFT JOIN (
        SELECT event_id, COUNT(*) as registration_count
        FROM registrations
        WHERE status = 'confirmed'
        GROUP BY event_id
      ) r ON e.id = r.event_id
      WHERE e.status = 'approved'
    `;
    const params = [];

    if (category) {
      params.push(category);
      sql += ` AND e.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`;
    }

    sql += " ORDER BY e.start_date ASC";

    let results = await query(sql, params);

    // If user is logged in, check their registrations
    if (userId && results.length > 0) {
      const eventIds = results.map(e => e.id);
      const userRegs = await query(
        `SELECT event_id FROM registrations WHERE user_id = $1 AND event_id = ANY($2)`,
        [userId, eventIds]
      );

      const registeredEventIds = new Set(userRegs.map(r => r.event_id));

      results = results.map(event => ({
        ...event,
        is_registered: registeredEventIds.has(event.id)
      }));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[v0] Get events error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
