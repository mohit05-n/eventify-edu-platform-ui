import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function PUT(request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 })
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
        }

        // Verify current password
        const users = await query("SELECT password FROM users WHERE id = $1", [session.userId])
        if (!users[0]) return NextResponse.json({ error: "User not found" }, { status: 404 })

        const isValid = await verifyPassword(currentPassword, users[0].password)
        if (!isValid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })

        const hashed = await hashPassword(newPassword)
        await query("UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [hashed, session.userId])

        return NextResponse.json({ message: "Password changed successfully" }, { status: 200 })
    } catch (error) {
        console.error("[v0] PUT /api/profile/password error:", error)
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
    }
}
