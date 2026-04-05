import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, phone, project, source } = await req.json();
    const lastLeads = await sql.query(`
      SELECT id FROM leads 
      WHERE id LIKE 'AX%' 
      ORDER BY id DESC LIMIT 1
    `);

    let nextId;
    if (lastLeads.length > 0) {
      const lastNum = parseInt(lastLeads[0].id.replace("AX", ""), 10);
      const nextNum = lastNum + 1;
      nextId = `AX${nextNum.toString().padStart(4, "0")}`;
    } else {
      nextId = "AX0001";
    }
    await sql.query(`
      INSERT INTO leads (id, name, email, phone, project, status, source, medium, assigned_to, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'new', $6, 'Manual', 'user-1', NOW(), NOW())
    `, [nextId, name, email, phone, project, source]);

    await sql.query(`
      INSERT INTO timeline_events (lead_id, type, title, description, created_by, created_at)
      VALUES ($1, 'workflow', 'Lead Created', 'Manual entry for walk-in client', 'system', NOW())
    `, [nextId]);

    return NextResponse.json({ success: true, id: nextId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}