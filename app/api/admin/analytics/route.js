import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Total registrations over the last 30 days
        const registrationTrend = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM registrations 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

        // 2. Total revenue over the last 30 days
        const revenueTrend = await query(`
      SELECT DATE(created_at) as date, SUM(amount) as revenue 
      FROM payments 
      WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

        // 3. Registration status distribution
        const statusDistribution = await query(`
      SELECT status, COUNT(*) as count 
      FROM registrations 
      GROUP BY status
    `);

        // 4. Top 5 events by registration count
        const topEventsByRegistration = await query(`
      SELECT e.title, COUNT(r.id) as count
      FROM events e
      JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id, e.title
      ORDER BY count DESC
      LIMIT 5
    `);

        // 5. Top 5 events by revenue
        const topEventsByRevenue = await query(`
      SELECT e.title, SUM(p.amount) as revenue
      FROM events e
      JOIN payments p ON (p.event_id = e.id OR p.booking_id IN (SELECT booking_id FROM registrations WHERE event_id = e.id))
      WHERE p.status = 'completed'
      GROUP BY e.id, e.title
      ORDER BY revenue DESC
      LIMIT 5
    `);

        // 6. User role distribution
        const roleDistribution = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

        // 7. General stats (Total Events, Users, etc.)
        const totalEvents = await query("SELECT COUNT(*) FROM events");
        const totalUsers = await query("SELECT COUNT(*) FROM users");
        const totalRevenue = await query("SELECT SUM(amount) FROM payments WHERE status = 'completed'");
        const totalRegistrations = await query("SELECT COUNT(*) FROM registrations");

        return NextResponse.json({
            registrationTrend: registrationTrend || [],
            revenueTrend: revenueTrend || [],
            statusDistribution: statusDistribution || [],
            topEventsByRegistration: topEventsByRegistration || [],
            topEventsByRevenue: topEventsByRevenue || [],
            roleDistribution: roleDistribution || [],
            summary: {
                totalEvents: parseInt(totalEvents[0]?.count || 0),
                totalUsers: parseInt(totalUsers[0]?.count || 0),
                totalRevenue: parseFloat(totalRevenue[0]?.sum || 0),
                totalRegistrations: parseInt(totalRegistrations[0]?.count || 0),
            }
        });
    } catch (error) {
        console.error("[v0] Admin analytics API error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
