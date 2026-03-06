import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organiserId = searchParams.get("organiser_id");
    const statusFilter = searchParams.get("status");

    // Only allow organizer to view their own events or admin to view any events
    if (session.user.id !== parseInt(organiserId) && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let sql = "SELECT * FROM events WHERE organiser_id = $1";
    const paramsArray = [organiserId];

    if (statusFilter) {
      sql += " AND status = $" + (paramsArray.length + 1);
      paramsArray.push(statusFilter);
    }

    sql += " ORDER BY created_at DESC";

    const results = await query(sql, paramsArray);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("[v0] Get organiser events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}