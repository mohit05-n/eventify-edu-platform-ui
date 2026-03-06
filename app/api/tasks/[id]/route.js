import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TaskDB, NotificationDB } from "@/lib/db-utils";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// GET /api/tasks/[id] - Get task by ID
export async function GET(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const task = await TaskDB.getById(id);

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Check access - student coordinators can only view their own tasks
        if (session.role === "student_coordinator" && task.assigned_to !== session.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error("[v0] Get task error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const task = await TaskDB.getById(id);

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const body = await request.json();
        const { title, description, assigned_to, deadline, priority, status, feedback } = body;

        // Student coordinators can only update their own tasks and only status/submission
        if (session.role === "student_coordinator") {
            if (task.assigned_to !== session.userId) {
                return NextResponse.json({ error: "You can only update your own tasks" }, { status: 403 });
            }
            // Student coordinators can only change status to in_progress or submitted
            if (status && !["in_progress", "submitted"].includes(status)) {
                return NextResponse.json({ error: "You can only mark tasks as in progress or submitted" }, { status: 403 });
            }
            // Only allow status update for student coordinators
            const updateData = {};
            if (status) updateData.status = status;

            const updated = await TaskDB.update(id, updateData);
            return NextResponse.json(updated);
        }

        // Only organizers and event coordinators can do full updates
        if (!["organiser", "event_coordinator", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
        if (deadline !== undefined) updateData.deadline = deadline;
        if (priority !== undefined) updateData.priority = priority;
        if (status !== undefined) updateData.status = status;
        if (feedback !== undefined) updateData.feedback = feedback;

        const updated = await TaskDB.update(id, updateData);

        // Notify if status changed to approved/rejected
        if (status === "approved" || status === "rejected") {
            await NotificationDB.create({
                user_id: task.assigned_to,
                title: `Task ${status === "approved" ? "Approved" : "Rejected"}`,
                message: `Your task "${task.title}" has been ${status}${feedback ? `: ${feedback}` : ""}`,
                type: status === "approved" ? "task_approved" : "task_rejected",
                related_event_id: task.event_id,
                related_task_id: task.id
            });

            // Send email to the coordinator about the task status update
            try {
                const coordinator = await query(
                    `SELECT u.name, u.email FROM users u WHERE u.id = $1`,
                    [task.assigned_to]
                );
                const eventDetails = await query(
                    `SELECT title FROM events WHERE id = $1`,
                    [task.event_id]
                );
                if (coordinator[0]) {
                    await sendEmail(coordinator[0].email, "taskStatusUpdate", {
                        coordinatorName: coordinator[0].name,
                        taskTitle: task.title,
                        eventTitle: eventDetails[0]?.title || "Event",
                        status: status,
                        feedback: feedback || ""
                    });
                }
            } catch (emailErr) {
                console.error("[v0] Task status email error:", emailErr);
            }
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[v0] Update task error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers and event coordinators can delete tasks
        if (!["organiser", "event_coordinator", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const deleted = await TaskDB.delete(id);

        if (!deleted) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[v0] Delete task error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
