const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
    console.log("Starting multi-participant booking migration...");

    try {
        // Add columns to registrations table
        console.log("Updating registrations table...");
        await sql(`
      ALTER TABLE registrations 
      ADD COLUMN IF NOT EXISTS participant_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS participant_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS participant_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS booking_id VARCHAR(100);
    `);

        // Remove UNIQUE constraint on (event_id, user_id)
        console.log("Updating constraints on registrations table...");
        try {
            const constraints = await sql(`
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'registrations'::regclass 
            AND contype = 'u';
        `);

            for (const c of constraints) {
                console.log(`Dropping constraint: ${c.conname}`);
                await sql(`ALTER TABLE registrations DROP CONSTRAINT IF EXISTS ${c.conname}`);
            }
        } catch (e) {
            console.log("Note: Could not drop constraint:", e.message);
        }

        // Add column to payments table
        console.log("Updating payments table...");
        await sql(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS booking_id VARCHAR(100);
    `);

        // Create index for booking_id
        console.log("Creating indexes...");
        await sql(`CREATE INDEX IF NOT EXISTS idx_registrations_booking ON registrations(booking_id);`);
        await sql(`CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);`);

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
