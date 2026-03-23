import { query } from './lib/db.js';

async function listTables() {
    try {
        const res = await query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log(JSON.stringify(res, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listTables();
