import { sql } from "@/lib/db";
import { createApiLogger } from "@/lib/logger/api-logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const log = createApiLogger(request, "/api/admin/stats");
  log.start();
  try {
    const counts = await sql`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'won') as booked,
        COUNT(*) FILTER (WHERE status = 'reengaged') as re_engaged,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as today_leads,
        COUNT(*) FILTER (WHERE follow_up_date::date = CURRENT_DATE) as today_follow_up,
        COUNT(*) FILTER (WHERE follow_up_date < CURRENT_DATE AND status NOT IN ('won', 'lost')) as missed_follow_up
      FROM leads
    `;

    const userStats = await sql`
      SELECT COUNT(*) as total_sales FROM users WHERE role = 'sales'
    `;

    const stats = counts[0];

    const response = {
      newLeads: Number(stats.new_leads) || 0,
      reEngaged: Number(stats.re_engaged) || 0,
      todayFollowUp: Number(stats.today_follow_up) || 0,
      missedFollowUp: Number(stats.missed_follow_up) || 0,
      todayLeads: Number(stats.today_leads) || 0,
      siteVisitCompleted: 0, // Placeholder
      booked: Number(stats.booked) || 0,
      allLeads: Number(stats.total_leads) || 0,
      totalSales: Number(userStats[0].total_sales) || 0
    };
    log.success(200, { totalLeads: response.allLeads, totalSales: response.totalSales });
    return NextResponse.json(response);
  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
