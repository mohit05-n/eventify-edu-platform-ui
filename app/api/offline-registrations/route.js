import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { query } from "@/lib/db"

// GET /api/offline-registrations?event_id=X
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const allowedRoles = ["event_coordinator", "student_coordinator", "organiser", "admin"]
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("event_id")

    let rows
    if (session.role === "organiser" || session.role === "admin") {
      // Organisers see all offline registrations for their events
      if (eventId) {
        rows = await query(
          `SELECT o.*, e.title as event_title, u.name as coordinator_name
           FROM offline_registrations o
           JOIN events e ON o.event_id = e.id
           JOIN users u ON o.coordinator_id = u.id
           WHERE o.event_id = $1
           ORDER BY o.created_at DESC`,
          [eventId]
        )
      } else {
        rows = await query(
          `SELECT o.*, e.title as event_title, u.name as coordinator_name
           FROM offline_registrations o
           JOIN events e ON o.event_id = e.id
           JOIN users u ON o.coordinator_id = u.id
           WHERE e.organiser_id = $1
           ORDER BY o.created_at DESC`,
          [session.userId]
        )
      }
    } else {
      // Coordinators see their own entries
      if (eventId) {
        rows = await query(
          `SELECT o.*, e.title as event_title
           FROM offline_registrations o
           JOIN events e ON o.event_id = e.id
           WHERE o.coordinator_id = $1 AND o.event_id = $2
           ORDER BY o.created_at DESC`,
          [session.userId, eventId]
        )
      } else {
        rows = await query(
          `SELECT o.*, e.title as event_title
           FROM offline_registrations o
           JOIN events e ON o.event_id = e.id
           WHERE o.coordinator_id = $1
           ORDER BY o.created_at DESC`,
          [session.userId]
        )
      }
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error("[offline-registrations] GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/offline-registrations
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const coordinatorRoles = ["event_coordinator", "student_coordinator"]
    if (!coordinatorRoles.includes(session.role)) {
      return NextResponse.json({ error: "Only coordinators can add offline registrations" }, { status: 403 })
    }

    const body = await request.json()
    const {
      event_id,
      participant_name,
      participant_email,
      participant_phone,
      college_org,
      payment_status = "unpaid",
      amount_paid = 0,
      remarks
    } = body

    // Validation
    if (!event_id || !participant_name) {
      return NextResponse.json({ error: "Event and participant name are required" }, { status: 400 })
    }
    if (!["paid", "unpaid", "free"].includes(payment_status)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO offline_registrations
         (event_id, coordinator_id, participant_name, participant_email, participant_phone, college_org,
          registration_type, payment_status, amount_paid, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, 'offline', $7, $8, $9)
       RETURNING *`,
      [event_id, session.userId, participant_name, participant_email || null,
       participant_phone || null, college_org || null,
       payment_status, amount_paid || 0, remarks || null]
    )

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[offline-registrations] POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/offline-registrations?id=X
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Only the coordinator who created it (or admin) can delete
    if (session.role === "admin") {
      await query(`DELETE FROM offline_registrations WHERE id = $1`, [id])
    } else {
      await query(`DELETE FROM offline_registrations WHERE id = $1 AND coordinator_id = $2`, [id, session.userId])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[offline-registrations] DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
