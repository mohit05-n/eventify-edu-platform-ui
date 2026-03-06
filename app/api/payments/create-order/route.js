import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { createRazorpayOrder } from "@/lib/razorpay"
import { validateId } from "@/lib/validation"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let { eventId, registrationId, bookingId } = await request.json()

    // Convert to numbers
    eventId = typeof eventId === 'string' ? parseInt(eventId, 10) : eventId

    // Validate inputs
    if (!validateId(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    // Get event details
    const eventResult = await query("SELECT price FROM events WHERE id = $1", [eventId])
    if (!eventResult[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = eventResult[0]
    const basePrice = parseFloat(event.price) || 0

    if (basePrice <= 0) {
      return NextResponse.json({ error: "This is a free event" }, { status: 400 })
    }

    let amount = basePrice;
    let targetRegistrationId = registrationId;

    // Handle multiple tickets (bookingId)
    if (bookingId) {
      const registrations = await query("SELECT id FROM registrations WHERE booking_id = $1", [bookingId]);
      if (registrations.length === 0) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      amount = basePrice * registrations.length;
      targetRegistrationId = registrations[0].id; // Use primary registration ID for reference
    } else if (!registrationId) {
      return NextResponse.json({ error: "registrationId or bookingId is required" }, { status: 400 });
    }

    // Create Razorpay order
    // Note: createRazorpayOrder might need to handle bookingId in metadata
    const order = await createRazorpayOrder(amount, eventId, targetRegistrationId, bookingId)

    // Update existing payment record with Razorpay order ID
    // We update by bookingId if present, otherwise by registrationId
    let updateResult;
    if (bookingId) {
      updateResult = await query(
        "UPDATE payments SET razorpay_order_id = $1, updated_at = CURRENT_TIMESTAMP WHERE booking_id = $2 RETURNING id",
        [order.id, bookingId]
      )
    } else {
      updateResult = await query(
        "UPDATE payments SET razorpay_order_id = $1, updated_at = CURRENT_TIMESTAMP WHERE registration_id = $2 RETURNING id",
        [order.id, registrationId]
      )
    }

    // If no existing record, create one
    if (updateResult.length === 0) {
      await query(
        "INSERT INTO payments (registration_id, booking_id, amount, razorpay_order_id, status) VALUES ($1, $2, $3, $4, $5)",
        [targetRegistrationId, bookingId || null, amount, order.id, "pending"]
      )
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("[v0] Create order error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}


