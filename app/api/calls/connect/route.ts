import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Get the authenticated session (agent's info including phone)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const agentId = session.user.id;

    // Fetch agent phone from DB (not session, which may be stale)
    const agentResult = await sql`
      SELECT phone FROM users WHERE id = ${agentId}
    `;
    const agentPhone = agentResult[0]?.phone;

    if (!agentPhone) {
      return NextResponse.json(
        { error: "Agent phone number not found in profile." },
        { status: 400 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId is required." },
        { status: 400 }
      );
    }

    // 3. Look up lead phone from DB
    const leadResult = await sql`
      SELECT phone, name FROM leads WHERE id = ${leadId}
    `;

    if (leadResult.length === 0) {
      return NextResponse.json(
        { error: "Lead not found." },
        { status: 404 }
      );
    }

    const leadPhone = leadResult[0].phone;
    const leadName = leadResult[0].name;

    // 4. Exotel credentials from env
    const apiKey = process.env.EXOTEL_API_KEY;
    const apiToken = process.env.EXOTEL_API_TOKEN;
    const accountSid = process.env.EXOTEL_ACCOUNT_SID;
    const callerId = process.env.EXOTEL_CALLER_ID;
    const apiBase = process.env.EXOTEL_API_BASE || "api.exotel.com";

    if (!apiKey || !apiToken || !accountSid || !callerId) {
      console.error("Missing Exotel environment variables");
      return NextResponse.json(
        { error: "Exotel configuration is incomplete. Check server env." },
        { status: 500 }
      );
    }

    // 5. Format phone numbers — ensure +91 E.164 format (Exotel expects this)
    const formatPhone = (phone: string): string => {
      // Remove all spaces, dashes, parentheses
      let cleaned = phone.replace(/[\s\-()]/g, "");
      // If starts with 0, replace with +91
      if (cleaned.startsWith("0") && !cleaned.startsWith("+")) {
        cleaned = "+91" + cleaned.slice(1);
      }
      // If no country code, add +91
      if (!cleaned.startsWith("+")) {
        cleaned = "+91" + cleaned;
      }
      return cleaned;
    };

    const fromNumber = formatPhone(agentPhone);
    const toNumber = formatPhone(leadPhone);
    // Clean CallerID — strip dashes/spaces
    const cleanCallerId = callerId.replace(/[\s\-()]/g, "");

    // 6. Call Exotel v1 Calls/connect API
    const exotelUrl = `https://${apiBase}/v1/Accounts/${accountSid}/Calls/connect.json`;

    // Prepare multipart form data (Exotel expects --form style)
    const formData = new FormData();
    formData.append("From", fromNumber);
    formData.append("To", toNumber);
    formData.append("CallerId", cleanCallerId);
    formData.append("CallType", "trans");
    formData.append("Record", "true");
    formData.append("StatusCallback", "https://crm-web-hooks.vercel.app/api/webhooks/exotel");
    formData.append("StatusCallbackContentType", "application/json");
    formData.append("StatusCallbackEvents[0]", "terminal");

    // HTTP Basic Auth header
    const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiToken}`).toString("base64");

    console.log(`[Exotel] Initiating call: From=${fromNumber}, To=${toNumber}, CallerId=${cleanCallerId}`);

    const exotelResponse = await fetch(exotelUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: formData,
    });

    const exotelData = await exotelResponse.text();

    let callSid = "";
    let callStatus = "initiated";

    if (exotelResponse.ok) {
      // Try to parse as JSON (if .json endpoint was used)
      try {
        const jsonData = JSON.parse(exotelData);
        callSid = jsonData?.Call?.Sid || jsonData?.Sid || "";
        callStatus = jsonData?.Call?.Status || "initiated";
      } catch {
        // Response might be XML; extract Sid if possible
        const sidMatch = exotelData.match(/<Sid>(.*?)<\/Sid>/);
        if (sidMatch) callSid = sidMatch[1];
      }
      console.log(`[Exotel] Call initiated successfully. SID: ${callSid}`);
    } else {
      console.error(`[Exotel] API error (${exotelResponse.status}):`, exotelData);
      return NextResponse.json(
        { error: "Failed to initiate call via Exotel.", details: exotelData },
        { status: exotelResponse.status }
      );
    }

    // 7. Insert into call_logs (with exotel_call_sid for webhook matching)
    await sql`
      INSERT INTO call_logs (lead_id, caller_number, caller_to, duration, direction, status, recording_url, assigned_to, exotel_call_sid)
      VALUES (${leadId}, ${agentPhone}, ${leadPhone}, 0, 'outbound', 'no_answer', ${null}, ${agentId}, ${callSid})
    `;

    // 8. Insert timeline event
    await sql`
      INSERT INTO timeline_events (lead_id, type, title, description, created_by, metadata)
      VALUES (
        ${leadId},
        'call',
        'Outbound Call Initiated',
        ${`Call placed to ${leadName} (${leadPhone}) via Exotel`},
        ${agentId},
        ${JSON.stringify({ callSid, callerId, from: agentPhone, to: leadPhone })}
      )
    `;

    return NextResponse.json({
      success: true,
      callSid,
      status: callStatus,
      message: `Call initiated to ${leadName}`,
    });
  } catch (error) {
    console.error("[Exotel] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error while initiating call." },
      { status: 500 }
    );
  }
}
