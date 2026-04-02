import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const counts = await sql`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'won') as booked,
        COUNT(*) FILTER (WHERE status = 'contacted') as re_engaged,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as today_leads,
        COUNT(*) FILTER (WHERE follow_up_date::date = CURRENT_DATE) as today_follow_up,
        COUNT(*) FILTER (WHERE follow_up_date < CURRENT_DATE AND status NOT IN ('won', 'lost')) as missed_follow_up
      FROM leads
    `;

    const userStats = await sql`
      SELECT COUNT(*) as total_sales FROM users WHERE role = 'sales'
    `;

    const stats = counts[0];

    return NextResponse.json({
      newLeads: Number(stats.new_leads) || 0,
      reEngaged: Number(stats.re_engaged) || 0,
      todayFollowUp: Number(stats.today_follow_up) || 0,
      missedFollowUp: Number(stats.missed_follow_up) || 0,
      todayLeads: Number(stats.today_leads) || 0,
      siteVisitCompleted: 0, // Placeholder
      booked: Number(stats.booked) || 0,
      allLeads: Number(stats.total_leads) || 0,
      totalSales: Number(userStats[0].total_sales) || 0
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
