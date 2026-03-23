import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const { id } = params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const results = await query("SELECT post_event_data, organiser_id FROM events WHERE id = $1", [id])
    if (results.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    return NextResponse.json(results[0].post_event_data || {})
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { post_event_data } = await request.json()

    // Verify ownership
    const event = await query("SELECT organiser_id FROM events WHERE id = $1", [id])
    if (event.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    if (event[0].organiser_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await query(
      "UPDATE events SET post_event_data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [JSON.stringify(post_event_data), id]
    )

    return NextResponse.json({ success: true, message: "Post-event details updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
