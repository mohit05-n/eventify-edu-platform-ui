import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { BudgetDB, NotificationDB, EventDB } from "@/lib/db-utils";

// GET /api/budgets - Get budget items
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("event_id");

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        const budgets = await BudgetDB.getByEventId(eventId);
        const summary = await BudgetDB.getSummaryByEventId(eventId);

        return NextResponse.json({ budgets, summary });
    } catch (error) {
        console.error("[v0] Get budgets error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/budgets - Create a budget item
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers can create budget items
        if (!["organiser", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { event_id, category, description, estimated_amount } = body;

        if (!event_id || !category || !estimated_amount) {
            return NextResponse.json({ error: "Event ID, category, and estimated amount are required" }, { status: 400 });
        }

        const budget = await BudgetDB.create({
            event_id,
            category,
            description,
            estimated_amount,
            created_by: session.userId
        });

        return NextResponse.json(budget, { status: 201 });
    } catch (error) {
        console.error("[v0] Create budget error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
