import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Add post_event_data column to events table
    // Using JSON type to store flexible post-event data
    await query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS post_event_data JSONB DEFAULT '{}'::jsonb
    `)

    return NextResponse.json({ 
      success: true, 
      message: "Column 'post_event_data' added to events table" 
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
