import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { validateName, validatePhone, validateCollege, sanitizeString } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;
    let { name, phone, college } = await request.json();

    // Sanitize inputs
    name = sanitizeString(name);
    phone = sanitizeString(phone);
    college = sanitizeString(college);

    // Validate inputs
    const errors = [];
    if (name && !validateName(name)) {
      errors.push('Invalid name format');
    }
    if (phone && !validatePhone(phone)) {
      errors.push('Invalid phone number format');
    }
    if (college && !validateCollege(college)) {
      errors.push('Invalid college name');
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed: " + errors.join(', ') }, { status: 400 });
    }

    // Only allow updating own profile or if admin
    if (session.userId !== parseInt(userId) && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update user
    const result = await query(
      `UPDATE users 
       SET name = $1, phone = $2, college = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, email, name, role, phone, college`,
      [name, phone, college, userId]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: result[0]
    }, { status: 200 });
  } catch (error) {
    console.error("[v0] Update user error:", error);
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
  }
}