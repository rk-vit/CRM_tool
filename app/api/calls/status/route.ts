import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createApiLogger } from "@/lib/logger/api-logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const log = createApiLogger(request, "/api/calls/status");
  log.start();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn(401, { reason: "missing_session" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callSid = searchParams.get("callSid");

    if (!callSid) {
      log.warn(400, { reason: "missing_callSid" });
      return NextResponse.json({ error: "callSid is required" }, { status: 400 });
    }

    const result = await sql`
      SELECT status, duration, recording_url
      FROM call_logs
      WHERE exotel_call_sid = ${callSid}
      LIMIT 1
    `;

    if (result.length === 0) {
      log.warn(404, { reason: "call_not_found", callSid });
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const call = result[0];

    // "no_answer" is the initial status we set — means webhook hasn't fired yet
    const isCallEnded = call.status !== "no_answer";

    const response = {
      status: call.status,
      duration: call.duration,
      recordingUrl: call.recording_url,
      ended: isCallEnded,
    };
    log.success(200, { callSid, ended: isCallEnded });
    return NextResponse.json(response);
  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
