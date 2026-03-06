import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

// GET /api/feedback?event_id=X — Fetch feedback for an event
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("event_id");

        if (!eventId) {
            return NextResponse.json({ error: "event_id is required" }, { status: 400 });
        }

        const feedback = await query(
            `SELECT f.id, f.rating, f.comment, f.created_at, u.name as user_name
       FROM feedback f
       JOIN users u ON f.user_id = u.id
       WHERE f.event_id = $1
       ORDER BY f.created_at DESC`,
            [eventId]
        );

        // Calculate average rating
        const avgResult = await query(
            `SELECT AVG(rating)::numeric(2,1) as avg_rating, COUNT(*) as total
       FROM feedback WHERE event_id = $1`,
            [eventId]
        );

        return NextResponse.json({
            feedback,
            stats: {
                averageRating: parseFloat(avgResult[0]?.avg_rating || 0),
                totalReviews: parseInt(avgResult[0]?.total || 0),
            },
        });
    } catch (error) {
        console.error("[v0] Get feedback error:", error);
        return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
    }
}

// POST /api/feedback — Submit feedback for an event
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { event_id, rating, comment } = await request.json();

        if (!event_id || !rating) {
            return NextResponse.json({ error: "event_id and rating are required" }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        // Check if user is registered for this event
        const registration = await query(
            "SELECT id FROM registrations WHERE event_id = $1 AND user_id = $2",
            [event_id, session.userId]
        );

        if (registration.length === 0) {
            return NextResponse.json(
                { error: "You must be registered for this event to leave feedback" },
                { status: 403 }
            );
        }

        // Check for existing feedback
        const existingFeedback = await query(
            "SELECT id FROM feedback WHERE event_id = $1 AND user_id = $2",
            [event_id, session.userId]
        );

        if (existingFeedback.length > 0) {
            // Update existing feedback
            await query(
                "UPDATE feedback SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE event_id = $3 AND user_id = $4",
                [rating, comment || null, event_id, session.userId]
            );
            return NextResponse.json({ success: true, message: "Feedback updated" });
        }

        // Create new feedback
        const result = await query(
            "INSERT INTO feedback (event_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING id",
            [event_id, session.userId, rating, comment || null]
        );

        // Send feedback notification email to the event organizer
        try {
            const eventDetails = await query(
                `SELECT e.title, u.name as organizer_name, u.email as organizer_email
                 FROM events e JOIN users u ON e.organiser_id = u.id WHERE e.id = $1`,
                [event_id]
            );
            if (eventDetails[0]) {
                await sendEmail(eventDetails[0].organizer_email, "feedbackReceived", {
                    organizerName: eventDetails[0].organizer_name,
                    attendeeName: session.name || "An attendee",
                    eventTitle: eventDetails[0].title,
                    rating: rating,
                    comment: comment || ""
                });
            }
        } catch (emailErr) {
            console.error("[v0] Feedback email error:", emailErr);
        }

        return NextResponse.json(
            { success: true, id: result[0].id, message: "Feedback submitted" },
            { status: 201 }
        );
    } catch (error) {
        console.error("[v0] Submit feedback error:", error);
        return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
    }
}
