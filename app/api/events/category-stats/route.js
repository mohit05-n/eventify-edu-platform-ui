import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get event counts by category
        const categoryStats = await query(`
      SELECT category, COUNT(*) as count 
      FROM events 
      GROUP BY category 
      ORDER BY count DESC
    `);

        // Get event counts by status
        const statusStats = await query(`
      SELECT status, COUNT(*) as count 
      FROM events 
      GROUP BY status
    `);

        // Get user counts by role
        const roleStats = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

        // Define colors for categories
        const categoryColors = {
            "Workshops": "oklch(0.42 0.19 281)",
            "Workshop": "oklch(0.42 0.19 281)",
            "Hackathons": "oklch(0.62 0.12 150)",
            "Hackathon": "oklch(0.62 0.12 150)",
            "Conferences": "oklch(0.68 0.18 55)",
            "Conference": "oklch(0.68 0.18 55)",
            "Competitions": "oklch(0.55 0.1 200)",
            "Competition": "oklch(0.55 0.1 200)",
            "Seminar": "oklch(0.55 0.15 250)",
            "Technical": "oklch(0.50 0.18 150)",
            "Cultural": "oklch(0.55 0.20 350)",
            "Sports": "oklch(0.60 0.15 80)",
            "Other": "oklch(0.50 0.10 200)"
        };

        // Format category data for pie chart
        const formattedCategoryData = categoryStats.map(item => ({
            name: item.category || "Other",
            value: parseInt(item.count),
            fill: categoryColors[item.category] || categoryColors["Other"]
        }));

        return NextResponse.json({
            categories: formattedCategoryData,
            statuses: statusStats,
            roles: roleStats
        });
    } catch (error) {
        console.error("[v0] Get category stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
