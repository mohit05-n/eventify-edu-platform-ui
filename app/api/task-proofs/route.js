import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { query } from "@/lib/db"

// GET /api/task-proofs?event_id=X
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("event_id")

    let rows
    const coordinatorRoles = ["event_coordinator", "student_coordinator"]

    if (coordinatorRoles.includes(session.role)) {
      // Coordinators see only their own proofs
      if (eventId) {
        rows = await query(
          `SELECT tp.*, e.title as event_title,
                  o.participant_name, o.participant_email,
                  u.name as coordinator_name
           FROM task_proofs tp
           JOIN events e ON tp.event_id = e.id
           LEFT JOIN offline_registrations o ON tp.offline_registration_id = o.id
           JOIN users u ON tp.coordinator_id = u.id
           WHERE tp.coordinator_id = $1 AND tp.event_id = $2
           ORDER BY tp.uploaded_at DESC`,
          [session.userId, eventId]
        )
      } else {
        rows = await query(
          `SELECT tp.*, e.title as event_title,
                  o.participant_name, o.participant_email,
                  u.name as coordinator_name
           FROM task_proofs tp
           JOIN events e ON tp.event_id = e.id
           LEFT JOIN offline_registrations o ON tp.offline_registration_id = o.id
           JOIN users u ON tp.coordinator_id = u.id
           WHERE tp.coordinator_id = $1
           ORDER BY tp.uploaded_at DESC`,
          [session.userId]
        )
      }
    } else if (session.role === "organiser" || session.role === "admin") {
      // Organisers see all proofs for events they own
      if (eventId) {
        rows = await query(
          `SELECT tp.*, e.title as event_title,
                  o.participant_name, o.participant_email,
                  u.name as coordinator_name
           FROM task_proofs tp
           JOIN events e ON tp.event_id = e.id
           LEFT JOIN offline_registrations o ON tp.offline_registration_id = o.id
           JOIN users u ON tp.coordinator_id = u.id
           WHERE tp.event_id = $1
           ORDER BY tp.uploaded_at DESC`,
          [eventId]
        )
      } else {
        rows = await query(
          `SELECT tp.*, e.title as event_title,
                  o.participant_name, o.participant_email,
                  u.name as coordinator_name
           FROM task_proofs tp
           JOIN events e ON tp.event_id = e.id
           LEFT JOIN offline_registrations o ON tp.offline_registration_id = o.id
           JOIN users u ON tp.coordinator_id = u.id
           WHERE e.organiser_id = $1
           ORDER BY tp.uploaded_at DESC`,
          [session.userId]
        )
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error("[task-proofs] GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/task-proofs — Coordinator submits a proof
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const coordinatorRoles = ["event_coordinator", "student_coordinator"]
    if (!coordinatorRoles.includes(session.role)) {
      return NextResponse.json({ error: "Only coordinators can submit task proofs" }, { status: 403 })
    }

    const body = await request.json()
    const {
      event_id,
      offline_registration_id,
      task_title,
      task_description,
      file_url,
      file_type
    } = body

    if (!event_id || !task_title) {
      return NextResponse.json({ error: "Event and task title are required" }, { status: 400 })
    }
    if (!file_url) {
      return NextResponse.json({ error: "Proof file is required" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO task_proofs
         (coordinator_id, event_id, offline_registration_id, task_title, task_description, file_url, file_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted')
       RETURNING *`,
      [
        session.userId,
        event_id,
        offline_registration_id || null,
        task_title,
        task_description || null,
        file_url,
        file_type || null
      ]
    )

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[task-proofs] POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/task-proofs — Organiser/Admin reviews a proof
export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!["organiser", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Only organisers/admins can review proofs" }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, reviewer_notes } = body

    const validStatuses = ["verified", "rejected", "needs_resubmission"]
    if (!id || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Valid proof ID and status required" }, { status: 400 })
    }

    const result = await query(
      `UPDATE task_proofs
       SET status = $1, reviewer_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, reviewer_notes || null, id]
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[task-proofs] PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
