import { sql } from "@/lib/db";
import { createApiLogger } from "@/lib/logger/api-logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const log = createApiLogger(request, "/api/timeline");
  log.start();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const limit = searchParams.get("limit") || "10";

  try {
    let query = `SELECT * FROM timeline_events`;
    const params = [];

    if (leadId) {
      params.push(leadId);
      query += ` WHERE lead_id = $1`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const events = await sql.query(query, params);

    const mappedEvents = events.map((event: any) => ({
      id: event.id,
      leadId: event.lead_id,
      type: event.type,
      title: event.title,
      description: event.description,
      createdAt: event.created_at,
      createdBy: event.created_by,
      metadata: event.metadata
    }));

    log.success(200, { count: mappedEvents.length, leadId: leadId ?? "all" });
    return NextResponse.json(mappedEvents);
  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }
}
