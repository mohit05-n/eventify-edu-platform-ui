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
    const userId = searchParams.get("user_id")
    const bookingId = searchParams.get("bookingId")

    // Use session userId if not provided (for security)
    const targetUserId = userId || session.userId

    let queryStr = `
      SELECT DISTINCT ON (r.id)
        r.id, 
        r.event_id,
        r.status, 
        r.participant_name,
        r.participant_email,
        r.participant_phone,
        r.booking_id,
        r.certificate_issued, 
        r.certificate_url,
        r.certificate_id,
        r.issue_date,
        r.created_at,
        e.title as event_title,
        e.description as event_description,
        e.start_date as event_start_date,
        e.end_date as event_end_date,
        e.location as event_location,
        e.image_url as event_image,
        e.price as event_price,
        e.category as event_category,
        p.status as payment_status,
        p.amount as payment_amount,
        p.razorpay_payment_id
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       LEFT JOIN payments p ON (r.id = p.registration_id OR r.booking_id = p.booking_id)
       WHERE r.user_id = $1
    `
    const params = [targetUserId]

    if (bookingId) {
      queryStr += ` AND r.booking_id = $2`
      params.push(bookingId)
    }

    // Wrap with outer select to ensure correct final ordering
    const finalQuery = `
      SELECT * FROM (${queryStr}) AS sub
      ORDER BY created_at DESC
    `

    const result = await query(finalQuery, params)

    return NextResponse.json(result || [], { status: 200 })
  } catch (error) {
    console.error("[v0] Get registrations error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
