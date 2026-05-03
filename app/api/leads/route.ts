import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignedTo = searchParams.get("assignedTo");
  const status = searchParams.get("status");
  const project = searchParams.get("project");

  try {
    let query = `
      SELECT 
        l.*,
        u.name as "assignedToName",
        (SELECT array_agg(name) FROM users WHERE id = ANY(l.assigned_users)) AS "assignedUserNames"
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (assignedTo) {
      params.push(assignedTo);
      query += ` AND ($${params.length} = ANY(l.assigned_users) OR (l.assigned_users IS NULL AND l.assigned_to = $${params.length}))`;
    }

    if (status && status !== "all") {
      params.push(status);
      query += ` AND l.status = $${params.length}`;
    }

    if (project && project !== "all") {
      params.push(project);
      query += ` AND l.project = $${params.length}`;
    }

    query += ` ORDER BY l.created_at DESC`;

    const leads = await sql.query(query, params);

    // Map database fields back to camelCase for the frontend if necessary    // Neon returns results as objects with keys matching column names
    const mappedLeads = leads.map((lead: any) => ({
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
      assignedToName: lead.assignedToName,
      assignedUsers: lead.assigned_users || [],
      assignedUserNames: lead.assignedUserNames || [],
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      followUpDate: lead.follow_up_date,
      budget: lead.budget,
      requirements: lead.requirements,
      notes: lead.notes,
    }));

    return NextResponse.json(mappedLeads);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id, name, email, phone, alternatePhone, project, status,
      subStatus, source, medium, assignedTo, assignedUsers, followUpDate,
      budget, requirements, notes
    } = body;

    const result = await sql`
      INSERT INTO leads (
        id, name, email, phone, alternate_phone, project, status, 
        sub_status, source, medium, assigned_to, assigned_users, follow_up_date, 
        budget, requirements, notes
      ) VALUES (
        ${id}, ${name}, ${email}, ${phone}, ${alternatePhone || null}, ${project}, ${status || 'new'}, 
        ${subStatus || 'warm'}, ${source || 'direct'}, ${medium}, ${assignedTo || null}, ${assignedUsers || []},
        ${followUpDate || null}, ${budget || null}, ${requirements || null}, ${notes || null}
      ) RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
