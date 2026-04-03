import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callSid = searchParams.get("callSid");

    if (!callSid) {
      return NextResponse.json({ error: "callSid is required" }, { status: 400 });
    }

    const result = await sql`
      SELECT status, duration, recording_url
      FROM call_logs
      WHERE exotel_call_sid = ${callSid}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const call = result[0];

    // "no_answer" is the initial status we set — means webhook hasn't fired yet
    const isCallEnded = call.status !== "no_answer";

    return NextResponse.json({
      status: call.status,
      duration: call.duration,
      recordingUrl: call.recording_url,
      ended: isCallEnded,
    });
  } catch (error) {
    console.error("[CallStatus] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
