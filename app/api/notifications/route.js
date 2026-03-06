import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { NotificationDB } from "@/lib/db-utils";

// GET /api/notifications - Get notifications for current user
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const limit = parseInt(searchParams.get("limit") || "50");

        const notifications = await NotificationDB.getByUserId(session.userId, limit, unreadOnly);
        const unreadCount = await NotificationDB.countUnread(session.userId);

        return NextResponse.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error("[v0] Get notifications error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/notifications - Mark all as read
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await NotificationDB.markAllAsRead(session.userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[v0] Mark all notifications as read error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
