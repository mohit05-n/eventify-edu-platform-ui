import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const organiserId = searchParams.get("organiser_id")

    // Use session userId if not provided (for security)
    const targetOrganiserId = organiserId || session.userId

    // Get events with registration count and certificate count
    const results = await query(
      `SELECT 
        e.*,
        COALESCE(r.registration_count, 0) as current_capacity,
        COALESCE(r.certificates_issued_count, 0) as certificates_issued_count
       FROM events e
       LEFT JOIN (
         SELECT event_id, 
                COUNT(*) as registration_count,
                SUM(CASE WHEN certificate_issued = true THEN 1 ELSE 0 END) as certificates_issued_count
         FROM registrations
         WHERE status = 'confirmed'
         GROUP BY event_id
       ) r ON e.id = r.event_id
       WHERE e.organiser_id = $1
       ORDER BY e.created_at DESC`,
      [targetOrganiserId]
    )

    return NextResponse.json(results || [], { status: 200 })
  } catch (error) {
    console.error("[v0] Get organiser events error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
