import { query } from "@/lib/db"
import { getSession } from "@/lib/session"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const formData = await request.formData()
        const file = formData.get("file")

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Only JPG, PNG, WebP, and GIF images are allowed" }, { status: 400 })
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "Image must be smaller than 5MB" }, { status: 400 })
        }

        const ext = file.type.split("/")[1].replace("jpeg", "jpg")
        const filename = `avatar-${session.userId}-${Date.now()}.${ext}`
        const avatarDir = join(process.cwd(), "public", "uploads", "avatars")

        await mkdir(avatarDir, { recursive: true })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(join(avatarDir, filename), buffer)

        const url = `/uploads/avatars/${filename}`
        await query("UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [url, session.userId])

        return NextResponse.json({ url, message: "Profile picture updated" }, { status: 200 })
    } catch (error) {
        console.error("[v0] POST /api/profile/upload-avatar error:", error)
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
    }
}
