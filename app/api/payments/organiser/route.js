import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

// GET - Fetch payment/revenue data for organizer's events
export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "organiser") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const eventId = searchParams.get("event_id");
        const limit = parseInt(searchParams.get("limit")) || 50;
        const offset = parseInt(searchParams.get("offset")) || 0;

        let paymentsQuery;
        let queryParams;

        if (eventId) {
            // Get payments for specific event
            paymentsQuery = `
        SELECT 
          p.id,
          p.registration_id,
          p.amount,
          p.razorpay_order_id,
          p.razorpay_payment_id,
          p.status,
          p.created_at,
          e.id as event_id,
          e.title as event_title,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          r.status as registration_status
        FROM payments p
        JOIN registrations r ON p.registration_id = r.id
        JOIN events e ON r.event_id = e.id
        JOIN users u ON r.user_id = u.id
        WHERE e.organiser_id = $1 AND e.id = $2
        ORDER BY p.created_at DESC
        LIMIT $3 OFFSET $4
      `;
            queryParams = [session.userId, eventId, limit, offset];
        } else {
            // Get all payments for all organizer's events
            paymentsQuery = `
        SELECT 
          p.id,
          p.registration_id,
          p.amount,
          p.razorpay_order_id,
          p.razorpay_payment_id,
          p.status,
          p.created_at,
          e.id as event_id,
          e.title as event_title,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          r.status as registration_status
        FROM payments p
        JOIN registrations r ON p.registration_id = r.id
        JOIN events e ON r.event_id = e.id
        JOIN users u ON r.user_id = u.id
        WHERE e.organiser_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `;
            queryParams = [session.userId, limit, offset];
        }

        const payments = await query(paymentsQuery, queryParams);

        // Get revenue breakdown by event
        const revenueByEvent = await query(
            `SELECT 
        e.id as event_id,
        e.title as event_title,
        COUNT(p.id) as total_payments,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      LEFT JOIN payments p ON r.id = p.registration_id
      WHERE e.organiser_id = $1
      GROUP BY e.id, e.title
      ORDER BY total_revenue DESC`,
            [session.userId]
        );

        // Get overall summary
        const summaryResult = await query(
            `SELECT 
        COUNT(p.id) as total_payments,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_payments
      FROM payments p
      JOIN registrations r ON p.registration_id = r.id
      JOIN events e ON r.event_id = e.id
      WHERE e.organiser_id = $1`,
            [session.userId]
        );

        return NextResponse.json({
            payments,
            revenueByEvent: revenueByEvent.map(r => ({
                ...r,
                total_revenue: parseFloat(r.total_revenue || 0),
                total_payments: parseInt(r.total_payments || 0),
                successful_payments: parseInt(r.successful_payments || 0),
                pending_payments: parseInt(r.pending_payments || 0)
            })),
            summary: {
                totalPayments: parseInt(summaryResult[0]?.total_payments || 0),
                totalRevenue: parseFloat(summaryResult[0]?.total_revenue || 0),
                successfulPayments: parseInt(summaryResult[0]?.successful_payments || 0),
                pendingPayments: parseInt(summaryResult[0]?.pending_payments || 0),
                failedPayments: parseInt(summaryResult[0]?.failed_payments || 0)
            }
        }, { status: 200 });

    } catch (error) {
        console.error("[v0] Get organiser payments error:", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}
