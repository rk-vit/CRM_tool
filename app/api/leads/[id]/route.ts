import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [leadRes, timelineRes, callsRes, emailsRes, commentsRes] = await Promise.all([
      sql`
        SELECT l.*, u.name as "assignedToName",
        (SELECT array_agg(name) FROM users WHERE id = ANY(l.assigned_users)) AS "assignedUserNames"
        FROM leads l
        LEFT JOIN users u ON l.assigned_to = u.id
        WHERE l.id = ${id}
      `,
      sql`SELECT * FROM timeline_events WHERE lead_id = ${id} ORDER BY created_at DESC`,
      sql`SELECT * FROM call_logs WHERE lead_id = ${id} ORDER BY created_at DESC`,
      sql`SELECT * FROM email_logs WHERE lead_id = ${id} ORDER BY created_at DESC`,
      sql`
        SELECT c.*, u.name as "createdByName"
        FROM comments c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.lead_id = ${id}
        ORDER BY c.created_at DESC
      `,
    ]);

    if (leadRes.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leadRes[0];
    const mappedLead = {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      alternatePhone: lead.alternate_phone,
      project: lead.project,
      status: lead.status,
      subStatus: lead.sub_status,
      source: lead.source,
      medium: lead.medium,
      assignedTo: lead.assigned_to,
      assignedToName: lead.assignedToName || lead.assignedtoname,
      assignedUsers: lead.assigned_users || lead.assignedusers || [],
      assignedUserNames: lead.assignedUserNames || lead.assignedusernames || [],
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      followUpDate: lead.follow_up_date,
      budget: lead.budget,
      requirements: lead.requirements,
      notes: lead.notes,
    };

    return NextResponse.json({
      lead: mappedLead,
      timeline: timelineRes.map((e: any) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        description: e.description,
        createdAt: e.created_at,
        createdBy: e.created_by,
      })),
      calls: callsRes.map((c: any) => ({
        id: c.id,
        callerNumber: c.caller_number,
        callerTo: c.caller_to,
        duration: c.duration,
        direction: c.direction,
        status: c.status,
        recordingUrl: c.recording_url,
        createdAt: c.created_at,
      })),
      emails: emailsRes.map((e: any) => ({
        id: e.id,
        subject: e.subject,
        body: e.body,
        from: e.from,
        to: e.to,
        status: e.status,
        createdAt: e.created_at,
      })),
      comments: commentsRes.map((c: any) => ({
        id: c.id,
        text: c.text,
        createdBy: c.created_by,
        createdByName: c.createdByName,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch lead details" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      alternatePhone, 
      project, 
      status, 
      subStatus, 
      source,
      medium,
      followUpDate, 
      budget,
      requirements,
      notes 
    } = body;

    const result = await sql`
      UPDATE leads
      SET 
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        alternate_phone = COALESCE(${alternatePhone}, alternate_phone),
        project = COALESCE(${project}, project),
        status = COALESCE(${status}, status),
        sub_status = COALESCE(${subStatus}, sub_status),
        source = COALESCE(${source}, source),
        medium = COALESCE(${medium}, medium),
        follow_up_date = COALESCE(${followUpDate}, follow_up_date),
        budget = COALESCE(${budget}, budget),
        requirements = COALESCE(${requirements}, requirements),
        notes = COALESCE(${notes}, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
