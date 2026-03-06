import { createUser, getUserByEmail } from "@/lib/auth"
import { createSession } from "@/lib/session"
import { sendEmail } from "@/lib/email"
import { validateUser, sanitizeString } from "@/lib/validation"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    let { name, email, password, phone, college, role } = await request.json()

    // Sanitize inputs
    name = sanitizeString(name);
    email = sanitizeString(email);
    phone = sanitizeString(phone);
    college = sanitizeString(college);
    role = sanitizeString(role);

    // Validate input
    const validation = validateUser({ name, email, password, phone, college, role });
    if (!validation.isValid) {
      return NextResponse.json({ error: "Validation failed: " + validation.errors.join(', ') }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Create user
    const user = await createUser(email, password, name, role, phone, college)

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    // Send welcome email
    await sendEmail(email, "welcomeUser", {
      name: user.name,
      role: user.role,
    })

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    console.error("[v0] Register error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}

