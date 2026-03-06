import {  deleteSession  } from "@/lib/session"
import {  NextResponse  } from "next/server"

export async function POST() {
  try {
    await deleteSession()
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status })
  }
}

