import { query } from "../lib/db.js";

async function migrate() {
    console.log("Starting multi-participant booking migration...");

    try {
        // Add columns to registrations table
        console.log("Updating registrations table...");
        await query(`
      ALTER TABLE registrations 
      ADD COLUMN IF NOT EXISTS participant_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS participant_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS participant_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS booking_id VARCHAR(100);
    `);

        // Remove UNIQUE constraint on (event_id, user_id) to allow multiple participants from same user
        console.log("Updating constraints on registrations table...");
        try {
            await query(`ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_event_id_user_id_key;`);
        } catch (e) {
            console.log("Note: Could not drop constraint, it might already be gone or have a different name.");
        }

        // Add column to payments table
        console.log("Updating payments table...");
        await query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS booking_id VARCHAR(100);
    `);

        // Create index for booking_id
        console.log("Creating indexes...");
        await query(`CREATE INDEX IF NOT EXISTS idx_registrations_booking ON registrations(booking_id);`);
        await query(`CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);`);

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
