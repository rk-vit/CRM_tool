import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignedTo = searchParams.get("assignedTo");

  try {
    // Build the call_logs query
    let callLogsQuery = `
      SELECT 
        c.id,
        c.lead_id,
        l.name as "leadName",
        c.caller_number,
        c.caller_to,
        c.duration,
        c.direction::text,
        c.status::text,
        c.recording_url,
        c.assigned_to,
        c.created_at,
        'known' as caller_type
      FROM call_logs c
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (assignedTo) {
      params.push(assignedTo);
      callLogsQuery += ` AND c.assigned_to = $${params.length}`;
    }

    // UNION with unknown_callers (unreviewed only)
    const unionQuery = `
      (${callLogsQuery})
      UNION ALL
      (
        SELECT
          u.id,
          NULL as lead_id,
          'Unknown Caller' as "leadName",
          u.phone as caller_number,
          NULL as caller_to,
          u.call_duration as duration,
          'inbound' as direction,
          u.call_status as status,
          u.recording_url,
          NULL as assigned_to,
          u.created_at,
          'unknown' as caller_type
        FROM unknown_callers u
        WHERE u.reviewed = false
      )
      ORDER BY created_at DESC
    `;

    const calls = await sql.query(unionQuery, params);

    const mappedCalls = calls.map((c: any) => ({
      id: c.id,
      leadId: c.lead_id,
      leadName: c.leadName,
      callerNumber: c.caller_number,
      callerTo: c.caller_to,
      duration: c.duration,
      direction: c.direction,
      status: c.status,
      recordingUrl: c.recording_url,
      assignedTo: c.assigned_to,
      createdAt: c.created_at,
      callerType: c.caller_type,
    }));

    return NextResponse.json(mappedCalls);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
  }
}
