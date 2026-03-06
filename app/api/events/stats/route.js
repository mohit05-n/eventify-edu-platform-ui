import {  query  } from "@/lib/db"
import {  getSession  } from "@/lib/session"
import {  NextResponse  } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const totalEvents = await query("SELECT COUNT(*)  FROM events")
    const totalRegistrations = await query("SELECT COUNT(*)  FROM registrations")
    const totalRevenue = await query("SELECT SUM(amount)  FROM payments WHERE status = 'completed'")
    const totalUsers = await query("SELECT COUNT(*)  FROM users")

    return NextResponse.json({
      totalEvents: totalEvents[0]?.count || 0,
      totalRegistrations: totalRegistrations[0]?.count || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers: totalUsers[0]?.count || 0,
    })
  } catch (error) {
    console.error("[v0] Get stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

