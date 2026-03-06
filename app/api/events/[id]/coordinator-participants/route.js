import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { EventAssignmentDB } from "@/lib/db-utils";
import { NextResponse } from "next/server";

// Auto-migration: add attendance columns to registrations
async function ensureColumns() {
    await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(20) DEFAULT 'absent'`);
    await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP`);
    await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_eligible BOOLEAN DEFAULT FALSE`);
}

// GET /api/events/[id]/coordinator-participants
export async function GET(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Allow both coordinator types and admin
        if (!["event_coordinator", "student_coordinator", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id: eventId } = await params;

        // Verify coordinator is assigned to this event
        const isAssigned = await EventAssignmentDB.isUserAssigned(eventId, session.userId);
        if (!isAssigned && session.role !== "admin") {
            return NextResponse.json({ error: "You are not assigned to this event" }, { status: 403 });
        }

        await ensureColumns();

        const participants = await query(
            `SELECT r.id, r.status, r.created_at,
              r.participant_name, r.participant_email, r.participant_phone,
              r.booking_id,
              r.attendance_status, r.checkin_time, r.certificate_eligible,
              r.certificate_issued,
              u.name as user_name, u.email as user_email
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.created_at DESC`,
            [eventId]
        );

        const total = participants.length;
        const checkedIn = participants.filter(p => p.attendance_status === 'present').length;
        const remaining = total - checkedIn;
        const attendancePercent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

        return NextResponse.json({
            participants,
            stats: {
                total,
                checkedIn,
                remaining,
                attendancePercent
            }
        });
    } catch (error) {
        console.error("[v0] Get coordinator participants error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/events/[id]/coordinator-participants
export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Allow both coordinator types and admin
        if (!["event_coordinator", "student_coordinator", "admin"].includes(session.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id: eventId } = await params;

        // Verify coordinator is assigned to this event
        const isAssigned = await EventAssignmentDB.isUserAssigned(eventId, session.userId);
        if (!isAssigned && session.role !== "admin") {
            return NextResponse.json({ error: "You are not assigned to this event" }, { status: 403 });
        }

        await ensureColumns();

        const { action, registrationId } = await request.json();

        if (!action || !registrationId) {
            return NextResponse.json({ error: "action and registrationId are required" }, { status: 400 });
        }

        if (action === "checkin") {
            await query(
                `UPDATE registrations SET attendance_status = 'present', checkin_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND event_id = $2`,
                [registrationId, eventId]
            );
            return NextResponse.json({ success: true, message: "Participant checked in" });
        }

        if (action === "certificate_eligible") {
            // Only event_coordinator and admin can mark certificate eligibility
            if (session.role === "student_coordinator") {
                return NextResponse.json({ error: "Student coordinators cannot mark certificate eligibility" }, { status: 403 });
            }
            await query(
                `UPDATE registrations SET certificate_eligible = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND event_id = $2`,
                [registrationId, eventId]
            );
            return NextResponse.json({ success: true, message: "Marked as certificate eligible" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("[v0] Update coordinator participant error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
