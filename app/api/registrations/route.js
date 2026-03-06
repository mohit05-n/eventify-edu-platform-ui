import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { sendEmail } from "@/lib/email"
import { validateId } from "@/lib/validation"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let { eventId, participants } = await request.json()

    // Backward compatibility for single participant
    if (!participants || !Array.isArray(participants)) {
      participants = [{
        name: session.name,
        email: session.email,
        phone: session.phone
      }]
    }

    // Convert to number if it's a string, or keep as number
    eventId = typeof eventId === 'string' ? parseInt(eventId, 10) : eventId

    // Validate input
    if (!validateId(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    if (participants.length === 0) {
      return NextResponse.json({ error: "At least one participant is required" }, { status: 400 })
    }

    // Get event details including price and capacity
    const eventDetails = await query(
      "SELECT id, title, start_date, location, price, max_capacity, current_capacity FROM events WHERE id = $1",
      [eventId]
    )

    if (eventDetails.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = eventDetails[0]

    // Check capacity
    const availableSpots = event.max_capacity ? event.max_capacity - (event.current_capacity || 0) : Infinity;
    if (participants.length > availableSpots) {
      return NextResponse.json({
        error: `Only ${availableSpots} spots remaining. Cannot book ${participants.length} tickets.`
      }, { status: 400 })
    }

    const isPaidEvent = event.price && parseFloat(event.price) > 0
    const bookingId = `BOOK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    // Create registrations for each participant
    const createdRegistrations = []
    for (const p of participants) {
      const result = await query(
        `INSERT INTO registrations (event_id, user_id, status, participant_name, participant_email, participant_phone, booking_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [eventId, session.userId, isPaidEvent ? "pending" : "confirmed", p.name, p.email, p.phone, bookingId],
      )

      const registrationId = result[0].id
      const ticketId = `EVT-${eventId}-${registrationId}-${Date.now().toString(36).toUpperCase()}`

      createdRegistrations.push({ id: registrationId, ticketId, participantName: p.name, participantEmail: p.email })
    }

    const totalAmount = isPaidEvent ? parseFloat(event.price) * participants.length : 0

    // For paid events, create a pending payment record for the whole booking
    if (isPaidEvent) {
      await query(
        `INSERT INTO payments (registration_id, booking_id, amount, status) VALUES ($1, $2, $3, $4)`,
        [createdRegistrations[0].id, bookingId, totalAmount, "pending"]
      )
    }

    // Increment current_capacity immediately to reserve spots
    await query(
      "UPDATE events SET current_capacity = COALESCE(current_capacity, 0) + $1 WHERE id = $2",
      [participants.length, eventId]
    )

    // Only send confirmation email for free events
    // Paid events get confirmation after payment verification
    if (!isPaidEvent) {
      for (const reg of createdRegistrations) {
        await sendEmail(reg.participantEmail || session.email, "registrationConfirmation", {
          attendeeName: reg.participantName || session.name,
          eventTitle: event.title,
          eventDate: event.start_date,
          eventLocation: event.location,
          ticketId: reg.ticketId
        })
      }

      // Create notification for confirmed registration
      await query(
        `INSERT INTO notifications (user_id, title, message, type, related_event_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          session.userId,
          "Registration Confirmed",
          `You have successfully booked ${participants.length} ticket(s) for "${event.title}"`,
          "general",
          eventId
        ]
      )
    }

    return NextResponse.json({
      bookingId,
      registrations: createdRegistrations,
      isPaidEvent,
      totalAmount,
      message: isPaidEvent ? "Registration created. Please complete payment." : "Registration successful"
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}


export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get("event_id")

    if (!eventId) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 })
    }

    // Verify the user is the organiser of this event or an admin
    if (session.role !== "admin") {
      const eventCheck = await query(
        "SELECT organiser_id FROM events WHERE id = $1",
        [eventId]
      )
      if (eventCheck.length === 0 || (eventCheck[0].organiser_id !== session.userId && session.role !== "organiser")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (session.role === "organiser" && eventCheck[0].organiser_id !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const result = await query(
      `SELECT r.id, r.status, r.status as attendance_status, r.created_at,
              r.participant_name, r.participant_email, r.participant_phone,
              r.booking_id,
              u.name as user_name, u.email as user_email
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.created_at DESC`,
      [eventId]
    )

    return NextResponse.json(result || [], { status: 200 })
  } catch (error) {
    console.error("[v0] Get registrations by event error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
