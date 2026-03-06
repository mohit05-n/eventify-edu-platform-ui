import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { BudgetDB, NotificationDB, EventDB } from "@/lib/db-utils";

// GET /api/budgets/[id] - Get budget item by ID
export async function GET(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const budget = await BudgetDB.getById(id);

        if (!budget) {
            return NextResponse.json({ error: "Budget item not found" }, { status: 404 });
        }

        return NextResponse.json(budget);
    } catch (error) {
        console.error("[v0] Get budget error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/budgets/[id] - Update budget item
export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers and admins can update budgets
        if (!["organiser", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();

        const { category, description, estimated_amount, actual_amount, status } = body;

        const updateData = {};
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description;
        if (estimated_amount !== undefined) updateData.estimated_amount = estimated_amount;
        if (actual_amount !== undefined) updateData.actual_amount = actual_amount;

        // Status can only be changed by admin
        if (status !== undefined && session.role === "admin") {
            updateData.status = status;
        }

        const updated = await BudgetDB.update(id, updateData);

        if (!updated) {
            return NextResponse.json({ error: "Budget item not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[v0] Update budget error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/budgets/[id] - Delete budget item
export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers and admins can delete budgets
        if (!["organiser", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const deleted = await BudgetDB.delete(id);

        if (!deleted) {
            return NextResponse.json({ error: "Budget item not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[v0] Delete budget error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
