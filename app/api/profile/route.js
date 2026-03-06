import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const users = await query(
            `SELECT id, name, email, role, phone, college, department,
              profile_picture, bio, organization_name, last_login_at, created_at
       FROM users WHERE id = $1`,
            [session.userId]
        )
        if (!users[0]) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const user = users[0]
        let stats = {}

        // Wrap stats in try-catch so a schema issue never blocks the user's profile from loading
        try {
            if (session.role === "attendee") {
                const [regRows, feedbackRows, certRows] = await Promise.all([
                    query(
                        `SELECT r.id, r.status, r.certificate_issued, r.created_at,
                    e.title as event_title, e.start_date, e.end_date, e.location, e.image_url
             FROM registrations r
             JOIN events e ON r.event_id = e.id
             WHERE r.user_id = $1 AND r.status = 'confirmed'
             ORDER BY e.start_date DESC`,
                        [session.userId]
                    ),
                    query(
                        `SELECT f.rating, f.comment, f.created_at, e.title as event_title
             FROM feedback f
             JOIN events e ON f.event_id = e.id
             WHERE f.user_id = $1
             ORDER BY f.created_at DESC`,
                        [session.userId]
                    ).catch(() => []),
                    // certificate_url / certificate_id may or may not exist — catch gracefully
                    query(
                        `SELECT r.certificate_url, r.certificate_id, e.title as event_title, e.start_date
             FROM registrations r
             JOIN events e ON r.event_id = e.id
             WHERE r.user_id = $1 AND r.certificate_issued = true`,
                        [session.userId]
                    ).catch(() => []),
                ])
                const now = new Date()
                const upcoming = regRows.filter((r) => new Date(r.end_date) > now)
                const past = regRows.filter((r) => new Date(r.end_date) <= now)
                stats = { registrations: regRows, upcoming, past, feedback: feedbackRows, certificates: certRows }
            }

            if (session.role === "organiser") {
                const [eventRows, feedbackRows] = await Promise.all([
                    query(
                        `SELECT e.id, e.title, e.status, e.start_date, e.end_date, e.current_capacity, e.max_capacity
             FROM events e WHERE e.organiser_id = $1 ORDER BY e.created_at DESC`,
                        [session.userId]
                    ),
                    query(
                        `SELECT f.rating FROM feedback f
             JOIN events e ON f.event_id = e.id
             WHERE e.organiser_id = $1`,
                        [session.userId]
                    ).catch(() => []),
                ])
                const totalParticipants = eventRows.reduce((sum, e) => sum + (e.current_capacity || 0), 0)
                const avgRating = feedbackRows.length
                    ? (feedbackRows.reduce((sum, f) => sum + f.rating, 0) / feedbackRows.length).toFixed(1)
                    : null
                const active = eventRows.filter((e) => e.status === "approved" && new Date(e.end_date) > new Date()).length
                const completed = eventRows.filter((e) => new Date(e.end_date) < new Date()).length
                stats = { events: eventRows, totalEvents: eventRows.length, active, completed, totalParticipants, avgRating }
            }

            if (session.role === "admin") {
                const [userCount, eventCount, orgCount, regCount] = await Promise.all([
                    query(`SELECT COUNT(*) as count FROM users`),
                    query(`SELECT COUNT(*) as count FROM events`),
                    query(`SELECT COUNT(*) as count FROM users WHERE role = 'organiser'`),
                    query(`SELECT COUNT(*) as count FROM registrations WHERE status = 'confirmed'`),
                ])
                stats = {
                    totalUsers: parseInt(userCount[0]?.count || 0),
                    totalEvents: parseInt(eventCount[0]?.count || 0),
                    totalOrganisers: parseInt(orgCount[0]?.count || 0),
                    totalRegistrations: parseInt(regCount[0]?.count || 0),
                }
            }
        } catch (statsError) {
            console.error("[v0] Stats query error (non-fatal):", statsError.message)
            // stats stays {} — profile data still returns successfully
        }

        return NextResponse.json({ user, stats }, { status: 200 })
    } catch (error) {
        console.error("[v0] GET /api/profile error:", error)
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await request.json()
        const { name, phone, bio, organization_name, college, department } = body

        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 })
        }

        await query(
            `UPDATE users
       SET name = $1, phone = $2, bio = $3, organization_name = $4,
           college = $5, department = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
            [name.trim(), phone || null, bio || null, organization_name || null, college || null, department || null, session.userId]
        )

        return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 })
    } catch (error) {
        console.error("[v0] PUT /api/profile error:", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
}
