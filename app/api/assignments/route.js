import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { EventAssignmentDB, NotificationDB, UserDB } from "@/lib/db-utils";

// GET /api/assignments - Get event assignments
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("event_id");

        let assignments;

        if (eventId) {
            // Get all coordinators for a specific event
            assignments = await EventAssignmentDB.getByEventId(eventId);
        } else {
            // Get all events assigned to current user
            assignments = await EventAssignmentDB.getByUserId(session.userId);
        }

        return NextResponse.json(assignments);
    } catch (error) {
        console.error("[v0] Get assignments error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/assignments - Create a new assignment
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers, admins, and event coordinators can assign coordinators
        if (!["organiser", "admin", "event_coordinator"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { event_id, user_id, role } = body;

        if (!event_id || !user_id || !role) {
            return NextResponse.json({ error: "Event ID, user ID, and role are required" }, { status: 400 });
        }

        // Validate role
        if (!["event_coordinator", "student_coordinator"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Event coordinators can only assign student coordinators
        if (session.role === "event_coordinator" && role !== "student_coordinator") {
            return NextResponse.json({ error: "Event coordinators can only assign student coordinators" }, { status: 403 });
        }

        // Check if user exists and has the correct role
        const user = await UserDB.getById(user_id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already assigned
        const isAssigned = await EventAssignmentDB.isUserAssigned(event_id, user_id);
        if (isAssigned) {
            return NextResponse.json({ error: "User is already assigned to this event" }, { status: 400 });
        }

        const assignment = await EventAssignmentDB.create({
            event_id,
            user_id,
            role,
            assigned_by: session.userId
        });

        // Notify the assigned user
        await NotificationDB.create({
            user_id: user_id,
            title: `You've been assigned as ${role === "event_coordinator" ? "Event Coordinator" : "Student Coordinator"}`,
            message: `You have been assigned to a new event. Check your dashboard for details.`,
            type: "general",
            related_event_id: event_id
        });

        return NextResponse.json(assignment, { status: 201 });
    } catch (error) {
        console.error("[v0] Create assignment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/assignments - Remove an assignment
export async function DELETE(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers and admins can remove assignments
        if (!["organiser", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("event_id");
        const userId = searchParams.get("user_id");

        if (!eventId || !userId) {
            return NextResponse.json({ error: "Event ID and user ID are required" }, { status: 400 });
        }

        const deleted = await EventAssignmentDB.delete(eventId, userId);

        if (!deleted) {
            return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[v0] Delete assignment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
