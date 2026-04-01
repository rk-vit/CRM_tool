import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignedTo = searchParams.get("assignedTo");

  try {
    let query = `
      SELECT 
        c.*, 
        l.name as "leadName"
      FROM call_logs c
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (assignedTo) {
      params.push(assignedTo);
      query += ` AND c.assigned_to = $${params.length}`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const calls = await sql.query(query, params);

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
      createdAt: c.created_at
    }));

    return NextResponse.json(mappedCalls);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
  }
}
