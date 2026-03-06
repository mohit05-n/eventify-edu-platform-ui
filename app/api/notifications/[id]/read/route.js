import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { NotificationDB } from "@/lib/db-utils";

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const result = await NotificationDB.markAsRead(id);

        if (!result) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[v0] Mark notification as read error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
