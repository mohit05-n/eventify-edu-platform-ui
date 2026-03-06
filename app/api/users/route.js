import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { UserDB } from "@/lib/db-utils";

// GET /api/users - Get all users (Admin only)
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can fetch all users
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let users = await UserDB.getAll(limit, offset);

    // Filter by role if provided
    if (role) {
      users = users.filter(u => u.role === role);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("[v0] Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
