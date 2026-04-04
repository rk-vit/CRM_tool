import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignedTo = searchParams.get("assignedTo");

  try {
    let whereClause = "";
    const params = [];

    if (assignedTo) {
      params.push(assignedTo);
      whereClause = `WHERE assigned_to = $1`;
    }

    const counts = await sql.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'won') as booked,
        COUNT(*) FILTER (WHERE status = 'reengaged') as reengaged,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as today_leads,
        COUNT(*) FILTER (WHERE follow_up_date::date = CURRENT_DATE) as today_follow_up,
        COUNT(*) FILTER (WHERE follow_up_date < CURRENT_DATE AND status NOT IN ('won', 'lost')) as missed_follow_up
      FROM leads
      ${whereClause}
    `, params);

    const stats = counts[0];

    return NextResponse.json({
      newLeads: Number(stats.new_leads) || 0,
      reEngaged: Number(stats.reengaged),
      todayFollowUp: Number(stats.today_follow_up) || 0,
      missedFollowUp: Number(stats.missed_follow_up) || 0,
      todayLeads: Number(stats.today_leads) || 0,
      siteVisitCompleted: 0, // Placeholder
      booked: Number(stats.booked) || 0,
      allLeads: Number(stats.total) || 0
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
