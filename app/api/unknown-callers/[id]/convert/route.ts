import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, project, source, medium, notes } = body;

    if (!name || !email || !project) {
      return NextResponse.json(
        { error: "Name, email, and project are required." },
        { status: 400 }
      );
    }

    // 1. Get the unknown caller record
    const callerResult = await sql`
      SELECT * FROM unknown_callers WHERE id = ${id} AND reviewed = false
    `;

    if (callerResult.length === 0) {
      return NextResponse.json(
        { error: "Unknown caller not found or already reviewed." },
        { status: 404 }
      );
    }

    const caller = callerResult[0];

    // 2. Generate a lead ID
    const leadId = `LD${Date.now().toString().slice(-6)}`;

    // 3. Create the lead
    await sql`
      INSERT INTO leads (
        id, name, email, phone, project, status, sub_status, source, medium,
        assigned_to, notes
      ) VALUES (
        ${leadId}, ${name}, ${email}, ${caller.phone}, ${project},
        'new', 'warm', ${source || 'direct'}, ${medium || 'Phone Call'},
        ${session.user.id}, ${notes || null}
      )
    `;

    // 4. Create a call_log entry linked to the new lead
    await sql`
      INSERT INTO call_logs (
        lead_id, caller_number, caller_to, duration, direction, status,
        recording_url, assigned_to, exotel_call_sid
      ) VALUES (
        ${leadId}, ${caller.phone}, ${caller.exotel_call_sid ? '' : ''},
        ${caller.call_duration || 0}, 'inbound',
        ${caller.call_status === 'answered' ? 'answered' : 'no_answer'},
        ${caller.recording_url || null}, ${session.user.id},
        ${caller.exotel_call_sid || null}
      )
    `;

    // 5. Create timeline event
    await sql`
      INSERT INTO timeline_events (
        lead_id, type, title, description, created_by, metadata
      ) VALUES (
        ${leadId}, 'call', 'Lead Created from Inbound Call',
        ${`Lead created from an unknown inbound call. Phone: ${caller.phone}`},
        ${session.user.id},
        ${JSON.stringify({ source: 'unknown_caller', originalId: id })}
      )
    `;

    // 6. Mark unknown caller as reviewed + converted
    await sql`
      UPDATE unknown_callers
      SET reviewed = true, converted_lead_id = ${leadId}
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      leadId,
      message: `Lead ${name} created successfully.`,
    });
  } catch (error) {
    console.error("Error converting unknown caller:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
