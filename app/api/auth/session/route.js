import {  getSession  } from "@/lib/session"
import {  NextResponse  } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ session: null }, { status: 200 })
    }
    return NextResponse.json({ session })
  } catch (error) {
    console.error("[v0] Session error:", error)
    return NextResponse.json({ session: null }, { status: 200 })
  }
}

