import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// GET - Fetch coordinators for organizer's events
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "organiser") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const eventId = searchParams.get("event_id");

        let coordinatorsQuery;
        let queryParams;

        if (eventId) {
            // Get coordinators for specific event
            coordinatorsQuery = `
        SELECT u.id, u.name, u.email, u.phone, u.role, ea.created_at, ea.event_id,
               e.title as event_title
        FROM event_assignments ea
        JOIN users u ON ea.user_id = u.id
        JOIN events e ON ea.event_id = e.id
        WHERE e.organiser_id = $1 AND ea.event_id = $2
        ORDER BY ea.created_at DESC
      `;
            queryParams = [session.userId, eventId];
        } else {
            // Get all coordinators for all organizer's events
            coordinatorsQuery = `
        SELECT u.id, u.name, u.email, u.phone, u.role, ea.created_at, ea.event_id,
               e.title as event_title
        FROM event_assignments ea
        JOIN users u ON ea.user_id = u.id
        JOIN events e ON ea.event_id = e.id
        WHERE e.organiser_id = $1
        ORDER BY ea.created_at DESC
      `;
            queryParams = [session.userId];
        }

        const coordinators = await query(coordinatorsQuery, queryParams);

        return NextResponse.json({ coordinators }, { status: 200 });
    } catch (error) {
        console.error("[v0] Get coordinators error:", error);
        return NextResponse.json({ error: "Failed to fetch coordinators" }, { status: 500 });
    }
}

// POST - Create new coordinator and assign to event
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "organiser") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, email, phone, password, role, event_id, college } = await request.json();

        // Validate required fields
        if (!name || !email || !password || !role || !event_id) {
            return NextResponse.json({
                error: "Name, email, password, role, and event are required"
            }, { status: 400 });
        }

        // Validate role
        if (!["event_coordinator", "student_coordinator"].includes(role)) {
            return NextResponse.json({
                error: "Invalid role. Must be event_coordinator or student_coordinator"
            }, { status: 400 });
        }

        // Check if organizer owns the event
        const eventCheck = await query(
            "SELECT id, title FROM events WHERE id = $1 AND organiser_id = $2",
            [event_id, session.userId]
        );

        if (eventCheck.length === 0) {
            return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
        }

        const eventTitle = eventCheck[0].title;

        // Check if email already exists
        const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);

        let userId;
        let isNewUser = false;
        const plainPassword = password; // Store plain password for email before hashing

        if (existingUser.length > 0) {
            // User exists, just assign to event
            userId = existingUser[0].id;
        } else {
            // Create new user
            isNewUser = true;
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await query(
                `INSERT INTO users (email, password, name, role, phone, college) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [email, hashedPassword, name, role, phone || null, college || null]
            );

            userId = newUser[0].id;
        }

        // Check if already assigned to this event
        const existingAssignment = await query(
            "SELECT id FROM event_assignments WHERE event_id = $1 AND user_id = $2",
            [event_id, userId]
        );

        if (existingAssignment.length > 0) {
            return NextResponse.json({
                error: "This coordinator is already assigned to this event"
            }, { status: 400 });
        }

        // Create assignment
        await query(
            `INSERT INTO event_assignments (event_id, user_id, role, assigned_by) 
       VALUES ($1, $2, $3, $4)`,
            [event_id, userId, role, session.userId]
        );

        // Send welcome email to new coordinators
        if (isNewUser) {
            await sendEmail(email, "coordinatorWelcome", {
                name,
                email,
                password: plainPassword,
                role,
                eventTitle,
                organizerName: session.name
            });
        }

        // Create notification for the coordinator
        await query(
            `INSERT INTO notifications (user_id, title, message, type, related_event_id) 
       VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                "You've been assigned as coordinator",
                `You have been assigned as ${role === 'event_coordinator' ? 'Faculty Coordinator' : 'Student Coordinator'} for "${eventTitle}"`,
                "general",
                event_id
            ]
        );

        return NextResponse.json({
            success: true,
            message: isNewUser
                ? "Coordinator created and assigned successfully. Welcome email sent."
                : "Existing user assigned to event successfully.",
            userId,
            isNewUser
        }, { status: 201 });
    } catch (error) {
        console.error("[v0] Create coordinator error:", error);
        return NextResponse.json({ error: "Failed to create coordinator" }, { status: 500 });
    }
}
