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

// POST - Create new coordinator and assign to one or more events
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || !["organiser", "admin", "event_coordinator"].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, password, role, event_id, event_ids, college } = body;

        // Normalize event IDs to an array
        let targetEventIds = [];
        if (Array.isArray(event_ids)) {
            targetEventIds = event_ids;
        } else if (event_id) {
            targetEventIds = [event_id];
        }

        // Validate required fields
        if (!name || !email || !password || !role || targetEventIds.length === 0) {
            return NextResponse.json({
                error: "Name, email, password, role, and at least one event are required"
            }, { status: 400 });
        }

        // Validate role
        if (!["event_coordinator", "student_coordinator"].includes(role)) {
            return NextResponse.json({
                error: "Invalid role. Must be event_coordinator or student_coordinator"
            }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);

        if (existingUser.length > 0) {
            return NextResponse.json({
                error: "This email is already registered. Please use a different email or manage existing coordinator."
            }, { status: 400 });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await query(
            `INSERT INTO users (email, password, name, role, phone, college) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [email, hashedPassword, name, role, phone || null, college || null]
        );

        const userId = newUser[0].id;
        const isNewUser = true;
        const plainPassword = password;

        const assignmentsCreated = [];
        const errors = [];
        const eventTitles = [];

        // Process assignments for each event
        for (const eid of targetEventIds) {
            try {
                // Check permission for this specific event
                let eventCheck;
                if (session.role === "admin") {
                    eventCheck = await query("SELECT id, title FROM events WHERE id = $1", [eid]);
                } else if (session.role === "organiser") {
                    eventCheck = await query(
                        "SELECT id, title FROM events WHERE id = $1 AND organiser_id = $2",
                        [eid, session.userId]
                    );
                } else if (session.role === "event_coordinator") {
                    eventCheck = await query(
                        `SELECT e.id, e.title 
                         FROM events e
                         JOIN event_assignments ea ON e.id = ea.event_id
                         WHERE e.id = $1 AND ea.user_id = $2 AND ea.role = 'event_coordinator'`,
                        [eid, session.userId]
                    );
                }

                if (!eventCheck || eventCheck.length === 0) {
                    errors.push(`Event ${eid}: Not found or access denied`);
                    continue;
                }

                const eventTitle = eventCheck[0].title;
                eventTitles.push(eventTitle);

                // Check if already assigned to this event
                const existingAssignment = await query(
                    "SELECT id FROM event_assignments WHERE event_id = $1 AND user_id = $2",
                    [eid, userId]
                );

                if (existingAssignment.length > 0) {
                    errors.push(`Event "${eventTitle}": User already assigned`);
                    continue;
                }

                // Create assignment
                await query(
                    `INSERT INTO event_assignments (event_id, user_id, role, assigned_by) 
           VALUES ($1, $2, $3, $4)`,
                    [eid, userId, role, session.userId]
                );

                // Create notification for the coordinator
                await query(
                    `INSERT INTO notifications (user_id, title, message, type, related_event_id) 
           VALUES ($1, $2, $3, $4, $5)`,
                    [
                        userId,
                        "You've been assigned as coordinator",
                        `You have been assigned as ${role === 'event_coordinator' ? 'Faculty Coordinator' : 'Student Coordinator'} for "${eventTitle}"`,
                        "general",
                        eid
                    ]
                );

                assignmentsCreated.push(eventTitle);
            } catch (err) {
                console.error(`Error processing event ${eid}:`, err);
                errors.push(`Event ${eid}: Internal error`);
            }
        }

        if (assignmentsCreated.length === 0) {
            return NextResponse.json({
                error: "Failed to create any assignments",
                details: errors
            }, { status: 400 });
        }

        // Send welcome email to new coordinators
        if (isNewUser) {
            await sendEmail(email, "coordinatorWelcome", {
                name,
                email,
                password: plainPassword,
                role,
                eventTitle: assignmentsCreated.join(", "),
                organizerName: session.name
            });
        }

        return NextResponse.json({
            success: true,
            message: isNewUser
                ? `Coordinator created and assigned to ${assignmentsCreated.length} event(s). Welcome email sent.`
                : `User assigned to ${assignmentsCreated.length} new event(s).`,
            assignments: assignmentsCreated,
            skipped: errors,
            userId,
            isNewUser
        }, { status: 201 });
    } catch (error) {
        console.error("[v0] Create coordinator error:", error);
        return NextResponse.json({ error: "Failed to create coordinator" }, { status: 500 });
    }
}
