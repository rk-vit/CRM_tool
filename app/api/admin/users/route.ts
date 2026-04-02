import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await sql`
      SELECT 
        u.id, u.name, u.email, u.role, u.phone, u.avatar, u.created_at as "createdAt",
        COUNT(DISTINCT l.id) as "leadsAssigned",
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'won') as "leadsConverted",
        COUNT(DISTINCT c.id) as "totalCalls"
      FROM users u
      LEFT JOIN leads l ON u.id = l.assigned_to
      LEFT JOIN call_logs c ON u.id = c.assigned_to
      WHERE u.role = 'sales'
      GROUP BY u.id
    `;

    const mappedUsers = users.map((u: any) => ({
      ...u,
      leadsAssigned: Number(u.leadsAssigned),
      leadsConverted: Number(u.leadsConverted),
      totalCalls: Number(u.totalCalls),
      conversionRate: u.leadsAssigned > 0 
        ? Number(((u.leadsConverted / u.leadsAssigned) * 100).toFixed(1)) 
        : 0
    }));

    return NextResponse.json(mappedUsers);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
