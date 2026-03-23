import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create offline_registrations table
    await query(`
      CREATE TABLE IF NOT EXISTS offline_registrations (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        coordinator_id INTEGER NOT NULL REFERENCES users(id),
        participant_name VARCHAR(255) NOT NULL,
        participant_email VARCHAR(255),
        participant_phone VARCHAR(20),
        college_org VARCHAR(255),
        registration_type VARCHAR(20) DEFAULT 'offline',
        payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
        amount_paid DECIMAL(10,2) DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create task_proofs table
    await query(`
      CREATE TABLE IF NOT EXISTS task_proofs (
        id SERIAL PRIMARY KEY,
        coordinator_id INTEGER NOT NULL REFERENCES users(id),
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        offline_registration_id INTEGER REFERENCES offline_registrations(id) ON DELETE SET NULL,
        task_title VARCHAR(255) NOT NULL,
        task_description TEXT,
        file_url VARCHAR(500),
        file_type VARCHAR(50),
        status VARCHAR(30) NOT NULL DEFAULT 'submitted',
        reviewer_notes TEXT,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    return NextResponse.json({
      success: true,
      message: "Tables created: offline_registrations, task_proofs"
    })
  } catch (error) {
    console.error("[migration] add-offline-tables error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
