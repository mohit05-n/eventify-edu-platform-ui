import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { verifyRazorpayPayment } from "@/lib/razorpay"
import { sendEmail } from "@/lib/email"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, registrationId, bookingId } = await request.json()

        // Validate required fields
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || (!registrationId && !bookingId)) {
            return NextResponse.json({ error: "Missing required payment details" }, { status: 400 })
        }

        // Verify the payment signature with Razorpay
        const isVerified = await verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)

        if (!isVerified) {
            // Update payment status to failed
            if (bookingId) {
                await query(
                    `UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
                     WHERE booking_id = $1 AND razorpay_order_id = $2`,
                    [bookingId, razorpayOrderId]
                )
            } else {
                await query(
                    `UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
                     WHERE registration_id = $1 AND razorpay_order_id = $2`,
                    [registrationId, razorpayOrderId]
                )
            }

            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
        }

        // Payment verified — update payment record
        if (bookingId) {
            await query(
                `UPDATE payments 
                 SET status = 'completed', 
                     razorpay_payment_id = $1, 
                     razorpay_signature = $2,
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE booking_id = $3 AND razorpay_order_id = $4`,
                [razorpayPaymentId, razorpaySignature, bookingId, razorpayOrderId]
            )

            // Update ALL registrations for this booking to confirmed
            await query(
                `UPDATE registrations SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE booking_id = $1`,
                [bookingId]
            )
        } else {
            await query(
                `UPDATE payments 
                 SET status = 'completed', 
                     razorpay_payment_id = $1, 
                     razorpay_signature = $2,
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE registration_id = $3 AND razorpay_order_id = $4`,
                [razorpayPaymentId, razorpaySignature, registrationId, razorpayOrderId]
            )

            // Update registration status to confirmed
            await query(
                `UPDATE registrations SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [registrationId]
            )
        }

        // Get details for emails
        try {
            let regDetails = [];
            if (bookingId) {
                regDetails = await query(
                    `SELECT r.id, r.event_id, r.participant_name, r.participant_email, e.title as event_title, e.start_date, e.location, e.price,
                            e.organiser_id, u.name as user_name, u.email as user_email,
                            org.name as organizer_name, org.email as organizer_email,
                            p.amount as payment_amount
                     FROM registrations r
                     JOIN events e ON r.event_id = e.id
                     JOIN users u ON r.user_id = u.id
                     JOIN users org ON e.organiser_id = org.id
                     JOIN payments p ON p.booking_id = r.booking_id OR p.registration_id = r.id
                     WHERE r.booking_id = $1 AND p.razorpay_order_id = $2`,
                    [bookingId, razorpayOrderId]
                )
            } else {
                regDetails = await query(
                    `SELECT r.id, r.event_id, r.participant_name, r.participant_email, e.title as event_title, e.start_date, e.location, e.price,
                            e.organiser_id, u.name as user_name, u.email as user_email,
                            org.name as organizer_name, org.email as organizer_email,
                            p.amount as payment_amount
                     FROM registrations r
                     JOIN events e ON r.event_id = e.id
                     JOIN users u ON r.user_id = u.id
                     JOIN users org ON e.organiser_id = org.id
                     JOIN payments p ON p.registration_id = r.id
                     WHERE r.id = $1 AND p.razorpay_order_id = $2`,
                    [registrationId, razorpayOrderId]
                )
            }

            if (regDetails.length > 0) {
                const mainReg = regDetails[0]

                // 1) Send payment success receipt to all participants
                for (const reg of regDetails) {
                    const ticketId = `EVT-${reg.event_id}-${reg.id}-${Date.now().toString(36).toUpperCase()}`

                    // Store ticketId in database
                    await query(
                        "UPDATE registrations SET ticket_id = $1 WHERE id = $2",
                        [ticketId, reg.id]
                    )

                    const recipientEmail = reg.participant_email || reg.user_email;
                    const recipientName = reg.participant_name || reg.user_name;

                    await sendEmail(recipientEmail, "paymentSuccess", {
                        attendeeName: recipientName,
                        eventTitle: reg.event_title,
                        eventDate: reg.start_date,
                        eventLocation: reg.location,
                        amount: bookingId ? "Part of bulk booking" : reg.price,
                        paymentId: razorpayPaymentId,
                        orderId: razorpayOrderId,
                        ticketId: ticketId
                    })
                }

                // 2) Send payment received notification to organizer (one for the whole booking)
                await sendEmail(mainReg.organizer_email, "paymentReceivedOrganizer", {
                    organizerName: mainReg.organizer_name,
                    attendeeName: mainReg.user_name,
                    attendeeEmail: mainReg.user_email,
                    eventTitle: mainReg.event_title,
                    amount: mainReg.payment_amount,
                    paymentId: razorpayPaymentId
                })

                // 3) Create notification for the user who made the booking
                await query(
                    `INSERT INTO notifications (user_id, title, message, type, related_event_id) 
           VALUES ($1, $2, $3, $4, $5)`,
                    [
                        session.userId,
                        "Payment Successful",
                        `Your payment for ${regDetails.length} ticket(s) to "${mainReg.event_title}" is confirmed!`,
                        "general",
                        mainReg.event_id
                    ]
                )
            }
        } catch (emailErr) {
            console.error("[v0] Post-payment processing error:", emailErr)
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified and registrations confirmed"
        }, { status: 200 })

    } catch (error) {
        console.error("[v0] Payment verification error:", error)
        return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
    }
}

