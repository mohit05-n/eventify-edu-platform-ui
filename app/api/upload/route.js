import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getSession } from "@/lib/session";

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF"
            }, { status: 400 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({
                error: "File too large. Maximum size is 10MB"
            }, { status: 400 });
        }

        // Create unique filename
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `event-${timestamp}-${session.userId}.${extension}`;

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), "public", "uploads", "events");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory might already exist
        }

        // Save file
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Return public URL
        const imageUrl = `/uploads/events/${filename}`;

        return NextResponse.json({
            success: true,
            url: imageUrl,
            filename: filename
        }, { status: 200 });
    } catch (error) {
        console.error("[v0] Image upload error:", error);
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
}
