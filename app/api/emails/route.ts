import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Email logs don't strictly have an assigned_to, but we can filter by the lead's assigned_to
  const assignedTo = searchParams.get("assignedTo");

  try {
    let query = `
      SELECT 
        e.*, 
        l.name as "leadName"
      FROM email_logs e
      LEFT JOIN leads l ON e.lead_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (assignedTo) {
      params.push(assignedTo);
      query += ` AND l.assigned_to = $${params.length}`;
    }

    query += ` ORDER BY e.created_at DESC`;

    const emails = await sql.query(query, params);

    const mappedEmails = emails.map((e: any) => ({
      id: e.id,
      leadId: e.lead_id,
      leadName: e.leadName,
      subject: e.subject,
      body: e.body,
      from: e.from,
      to: e.to,
      status: e.status,
      createdAt: e.created_at
    }));

    return NextResponse.json(mappedEmails);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
