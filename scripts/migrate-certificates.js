import { query } from '../lib/db.js';

async function migrate() {
    try {
        console.log('Starting migration to add certificate columns...');

        // Add certificate_id
        await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_id VARCHAR(100)`);
        console.log('Added certificate_id column');

        // Add certificate_url
        await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS certificate_url TEXT`);
        console.log('Added certificate_url column');

        // Add issue_date
        await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS issue_date TIMESTAMP`);
        console.log('Added issue_date column');

        // Add updated_at
        await query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        console.log('Added updated_at column');

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
