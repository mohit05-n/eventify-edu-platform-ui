import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { DocumentDB } from "@/lib/db-utils";

// GET /api/documents - Get documents for an event
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("event_id");
        const documentType = searchParams.get("type");

        if (!eventId) {
            return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
        }

        const documents = await DocumentDB.getByEventId(eventId, documentType);

        return NextResponse.json(documents);
    } catch (error) {
        console.error("[v0] Get documents error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/documents - Upload a document
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only organizers, event coordinators, and admins can upload documents
        if (!["organiser", "event_coordinator", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { event_id, file_name, file_url, file_type, document_type } = body;

        if (!event_id || !file_name || !file_url) {
            return NextResponse.json({ error: "Event ID, file name, and file URL are required" }, { status: 400 });
        }

        const document = await DocumentDB.create({
            event_id,
            uploaded_by: session.userId,
            file_name,
            file_url,
            file_type,
            document_type
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error("[v0] Upload document error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
