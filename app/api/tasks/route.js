import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { TaskDB, NotificationDB, UserDB, EventDB } from "@/lib/db-utils";

// GET /api/tasks - Get tasks (filtered by user role)
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("event_id");

        let tasks;

        // Student coordinators can only see their assigned tasks
        if (session.role === "student_coordinator") {
            tasks = await TaskDB.getByAssignedTo(session.userId);
        }
        // Event coordinators can see tasks for events they're assigned to
        else if (session.role === "event_coordinator") {
            if (eventId) {
                tasks = await TaskDB.getByEventId(eventId);
            } else {
                // Get all tasks for events this coordinator is assigned to
                tasks = await TaskDB.getByAssignedTo(session.userId);
            }
        }
        // Organizers and admins can see all tasks for an event
        else if (session.role === "organiser" || session.role === "admin") {
            if (eventId) {
                tasks = await TaskDB.getByEventId(eventId);
            } else {
                // Return empty for now - should specify event_id
                tasks = [];
            }
        } else {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("[v0] Get tasks error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/tasks - Create a new task
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers and event coordinators can create tasks
        if (!["organiser", "event_coordinator", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { event_id, title, description, assigned_to, deadline, priority } = body;

        if (!event_id || !title) {
            return NextResponse.json({ error: "Event ID and title are required" }, { status: 400 });
        }

        const task = await TaskDB.create({
            event_id,
            title,
            description,
            assigned_to,
            assigned_by: session.userId,
            deadline,
            priority
        });

        // Create notification and send email for assigned user
        if (assigned_to) {
            await NotificationDB.create({
                user_id: assigned_to,
                title: "New Task Assigned",
                message: `You have been assigned a new task: ${title}`,
                type: "task_assigned",
                related_event_id: event_id,
                related_task_id: task.id
            });

            // Send task assignment email
            try {
                const [assignedUser, event] = await Promise.all([
                    UserDB.getById(assigned_to),
                    EventDB.getById(event_id)
                ]);
                if (assignedUser?.email) {
                    await sendEmail(assignedUser.email, "taskAssigned", {
                        coordinatorName: assignedUser.name,
                        taskTitle: title,
                        taskDescription: description,
                        eventTitle: event?.title || "Unknown Event",
                        deadline,
                        priority,
                        assignedBy: session.name
                    });
                }
            } catch (emailErr) {
                console.error("[v0] Task email error:", emailErr);
            }
        }

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("[v0] Create task error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
