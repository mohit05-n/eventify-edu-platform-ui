import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paymentId } = await params;

    // Get payment details with registration and event info
    const result = await query(
      `SELECT p.*, r.event_id, r.user_id, e.title as event_title
       FROM payments p
       JOIN registrations r ON p.registration_id = r.id
       JOIN events e ON r.event_id = e.id
       WHERE p.id = $1 AND (r.user_id = $2 OR $3 = 'admin')`,
      [paymentId, session.userId, session.role]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error("[v0] Get payment error:", error);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}