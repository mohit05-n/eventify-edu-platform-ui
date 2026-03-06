import {  neon  } from "@neondatabase/serverless"

let sql = null

export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined")
    }
    
    // Check if using placeholder URL
    if (process.env.DATABASE_URL === "your-database-url-here") {
      throw new Error("Please update DATABASE_URL in .env.local with your Neon database connection string")
    }
    
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
}

export async function query(text, params) {
  try {
    const sql = getDb();
    
    if (params && params.length > 0) {
      // Execute query with parameters using Neon's query method
      return await sql.query(text, params);
    } else {
      // Execute query without parameters
      return await sql.query(text);
    }
  } catch (error) {
    console.error("[v0] Database query error:", error);
    throw error;
  }
}

