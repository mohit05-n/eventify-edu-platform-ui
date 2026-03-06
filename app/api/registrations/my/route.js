import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

// GET /api/registrations/my - Get current user's registration for an event
export async function GET(request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get("eventId")

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
        }

        const result = await query(
            `SELECT r.id, r.event_id, r.status, r.created_at, p.status as payment_status, p.amount
       FROM registrations r
       LEFT JOIN payments p ON r.id = p.registration_id
       WHERE r.event_id = $1 AND r.user_id = $2`,
            [eventId, session.userId]
        )

        if (result.length === 0) {
            return NextResponse.json({ registration: null }, { status: 200 })
        }

        return NextResponse.json({ registration: result[0] }, { status: 200 })
    } catch (error) {
        console.error("[v0] Get my registration error:", error)
        return NextResponse.json({ error: "Failed to fetch registration" }, { status: 500 })
    }
}
