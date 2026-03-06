import { neon } from "@neondatabase/serverless"

const sql = neon("postgresql://neondb_owner:npg_sOKhMbC8k6iz@ep-bitter-flower-adil1ff4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500)`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255)`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`
    console.log("✅ Migration complete: profile fields added to users table")
    process.exit(0)
} catch (e) {
    console.error("❌ Migration failed:", e.message)
    process.exit(1)
}
