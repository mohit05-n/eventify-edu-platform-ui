import { query } from "./lib/db.js";
import fs from "fs";

async function checkSchema() {
    try {
        const tables = ['payments', 'events', 'registrations'];
        const result = {};
        for (const table of tables) {
            result[table] = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
        }
        fs.writeFileSync('schema_output.json', JSON.stringify(result, null, 2));
        console.log("Schema written to schema_output.json");
    } catch (error) {
        console.error("Error checking schema:", error);
    } finally {
        process.exit();
    }
}

checkSchema();
