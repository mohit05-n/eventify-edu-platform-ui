import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

// GET - Fetch payment history for current user
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit")) || 50;
        const offset = parseInt(searchParams.get("offset")) || 0;

        // Fetch all payments for the user with event details
        const payments = await query(
            `SELECT 
        p.id,
        p.registration_id,
        p.amount,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.status,
        p.created_at,
        p.updated_at,
        e.id as event_id,
        e.title as event_title,
        e.image_url as event_image,
        e.start_date as event_date,
        e.location as event_location,
        r.status as registration_status
      FROM payments p
      JOIN registrations r ON p.registration_id = r.id
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
            [session.userId, limit, offset]
        );

        // Get total count for pagination
        const countResult = await query(
            `SELECT COUNT(*) as count
       FROM payments p
       JOIN registrations r ON p.registration_id = r.id
       WHERE r.user_id = $1`,
            [session.userId]
        );

        const totalCount = parseInt(countResult[0]?.count || 0);

        // Calculate summary stats
        const summaryResult = await query(
            `SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_spent,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_payments
       FROM payments p
       JOIN registrations r ON p.registration_id = r.id
       WHERE r.user_id = $1`,
            [session.userId]
        );

        return NextResponse.json({
            payments,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + payments.length < totalCount
            },
            summary: {
                totalPayments: parseInt(summaryResult[0]?.total_payments || 0),
                totalSpent: parseFloat(summaryResult[0]?.total_spent || 0),
                successfulPayments: parseInt(summaryResult[0]?.successful_payments || 0),
                pendingPayments: parseInt(summaryResult[0]?.pending_payments || 0),
                failedPayments: parseInt(summaryResult[0]?.failed_payments || 0)
            }
        }, { status: 200 });

    } catch (error) {
        console.error("[v0] Get user payments error:", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}
