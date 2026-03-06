import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { DocumentDB } from "@/lib/db-utils";

// GET /api/documents/[id] - Get document by ID
export async function GET(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const document = await DocumentDB.getById(id);

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (error) {
        console.error("[v0] Get document error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers, event coordinators, and admins can delete documents
        if (!["organiser", "event_coordinator", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const deleted = await DocumentDB.delete(id);

        if (!deleted) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[v0] Delete document error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
