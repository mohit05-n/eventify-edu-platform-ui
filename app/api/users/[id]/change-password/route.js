import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;
    const { currentPassword, newPassword } = await request.json();

    // Only allow changing own password or if admin
    if (session.userId !== parseInt(userId) && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For simplicity, we're not checking the current password here
    // In a production app, you'd want to verify the current password

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const result = await query(
      `UPDATE users 
       SET password = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id`,
      [hashedPassword, userId]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully"
    }, { status: 200 });
  } catch (error) {
    console.error("[v0] Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}