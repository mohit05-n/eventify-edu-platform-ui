import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Read DATABASE_URL from .env file
const envContent = readFileSync(".env", "utf-8");
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
const dbUrl = match ? match[1].trim() : null;

if (!dbUrl) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
}

const sql = neon(dbUrl);

try {
    await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_url VARCHAR(500)`;
    console.log("✅ certificate_url column added");

    await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_id VARCHAR(100)`;
    console.log("✅ certificate_id column added");

    console.log("Migration completed successfully!");
    process.exit(0);
} catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
}
