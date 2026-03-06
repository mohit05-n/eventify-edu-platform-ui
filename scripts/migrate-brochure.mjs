import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_sOKhMbC8k6iz@ep-bitter-flower-adil1ff4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require");

try {
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS brochure_url VARCHAR(500)`;
    console.log("Migration successful: brochure_url column added to events table");
    process.exit(0);
} catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
}
