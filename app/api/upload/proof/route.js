import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getSession } from "@/lib/session"

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const coordinatorRoles = ["event_coordinator", "student_coordinator"]
    if (!coordinatorRoles.includes(session.role)) {
      return NextResponse.json({ error: "Only coordinators can upload proofs" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Allowed file types: images, PDF, Word docs
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, DOC, DOCX"
      }, { status: 400 })
    }

    // Max 10MB
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = `proof-${timestamp}-${session.userId}-${safeName}`

    const uploadDir = join(process.cwd(), "public", "uploads", "proofs")
    await mkdir(uploadDir, { recursive: true })

    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    return NextResponse.json({
      success: true,
      url: `/uploads/proofs/${filename}`,
      filename,
      fileType: file.type
    })
  } catch (error) {
    console.error("[upload/proof] error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
