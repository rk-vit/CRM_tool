import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "system";

    const { leadId, to, subject, body } = await request.json();

    if (!leadId || !to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      await sendEmail({ to, subject, body });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return NextResponse.json({ error: "Failed to send email via SMTP" }, { status: 500 });
    }

    // Log the email in the database only on success
    const emailQuery = `
      INSERT INTO email_logs (lead_id, "from", "to", subject, body, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const emailParams = [
      leadId,
      process.env.SMTP_FROM || process.env.SMTP_USER || "crm@example.com",
      to,
      subject,
      body,
      "sent"
    ];

    const emailResult = await sql.query(emailQuery, emailParams);

    // Also create a timeline event
    const timelineQuery = `
      INSERT INTO timeline_events (lead_id, type, title, description, created_at, created_by)
      VALUES ($1, $2, $3, $4, NOW(), $5)
    `;
    const timelineParams = [
      leadId,
      "email",
      "Email Sent",
      `Subject: ${subject}`,
      userId
    ];
    await sql.query(timelineQuery, timelineParams);

    return NextResponse.json({ 
      message: "Email sent successfully", 
      emailLog: emailResult[0] 
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
