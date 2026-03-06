import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { BudgetDB, NotificationDB, EventDB } from "@/lib/db-utils";

// POST /api/budgets/[id]/approve - Approve or reject budget item (Admin only)
export async function POST(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can approve/reject budgets
        if (session.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!["approved", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 });
        }

        const budget = await BudgetDB.getById(id);
        if (!budget) {
            return NextResponse.json({ error: "Budget item not found" }, { status: 404 });
        }

        const updated = await BudgetDB.updateStatus(id, status, session.userId);

        // Get event details to notify the organizer
        const event = await EventDB.getById(budget.event_id);
        if (event) {
            await NotificationDB.create({
                user_id: event.organiser_id,
                title: `Budget ${status === "approved" ? "Approved" : "Rejected"}`,
                message: `Your budget item "${budget.category}" has been ${status}`,
                type: status === "approved" ? "event_approved" : "event_rejected",
                related_event_id: budget.event_id
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[v0] Approve budget error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
