import { query } from "@/lib/db"
import { NextResponse } from "next/server"

// One-time migration: adds 4 new participant fields to the registrations table
// Visit GET /api/temp-migrate/add-participant-fields to run
export async function GET() {
  try {
    await query(`
      ALTER TABLE registrations
        ADD COLUMN IF NOT EXISTS participant_semester VARCHAR(50),
        ADD COLUMN IF NOT EXISTS participant_enrollment_id VARCHAR(100),
        ADD COLUMN IF NOT EXISTS participant_gender VARCHAR(30),
        ADD COLUMN IF NOT EXISTS participant_branch VARCHAR(100)
    `)

    return NextResponse.json({
      success: true,
      message: "Columns added successfully: participant_semester, participant_enrollment_id, participant_gender, participant_branch"
    })
  } catch (error) {
    console.error("[migration] add-participant-fields error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
