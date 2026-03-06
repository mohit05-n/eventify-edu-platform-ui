import {  query  } from "@/lib/db"
import {  NextResponse  } from "next/server"

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const organiserId = searchParams.get("organiser_id")

    let sql = "SELECT * FROM events WHERE 1=1"
    const params = []

    if (status) {
      sql += ` AND status = $${params.length + 1}`
      params.push(status)
    }

    if (organiserId) {
      sql += ` AND organiser_id = $${params.length + 1}`
      params.push(organiserId)
    }

    sql += " ORDER BY start_date ASC"

    const result = await query(sql, params)
    return NextResponse.json(result || [], { status: 200 })
  } catch (error) {
    console.error("[v0] Filter events error:", error)
    return NextResponse.json([], { status: 500 })
  }
}

