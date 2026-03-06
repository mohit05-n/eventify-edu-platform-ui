import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TaskDB, NotificationDB } from "@/lib/db-utils";

// POST /api/tasks/[id]/proof - Upload proof for task (Student Coordinator)
export async function POST(request, { params }) {
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

        // Only the assigned student coordinator can upload proof
        if (session.role === "student_coordinator" && task.assigned_to !== session.userId) {
            return NextResponse.json({ error: "You can only upload proof for tasks assigned to you" }, { status: 403 });
        }

        // Check if task is in a state that allows proof upload
        if (!["pending", "in_progress", "rejected"].includes(task.status)) {
            return NextResponse.json({ error: "Cannot upload proof for this task status" }, { status: 400 });
        }

        const body = await request.json();
        const { proof_url } = body;

        if (!proof_url) {
            return NextResponse.json({ error: "Proof URL is required" }, { status: 400 });
        }

        const updated = await TaskDB.uploadProof(id, proof_url);

        // Notify the event coordinator
        if (task.assigned_by) {
            await NotificationDB.create({
                user_id: task.assigned_by,
                title: "Task Proof Submitted",
                message: `Proof has been submitted for task: ${task.title}`,
                type: "general",
                related_event_id: task.event_id,
                related_task_id: task.id
            });
        }

        return NextResponse.json({ success: true, task: updated });
    } catch (error) {
        console.error("[v0] Upload proof error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
