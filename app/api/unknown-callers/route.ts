import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createApiLogger } from "@/lib/logger/api-logger";

function maskPhone(phone: string): string {
  if (phone.length < 6) return "****";
  return phone.slice(0, -5) + "****" + phone.slice(-1);
}

export async function GET(request: Request) {
  const log = createApiLogger(request, "/api/unknown-callers");
  log.start();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn(401, { reason: "missing_session" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";

    const callers = await sql`
      SELECT * FROM unknown_callers
      WHERE reviewed = false
      ORDER BY created_at DESC
    `;

    const mapped = callers.map((c: any) => ({
      id: c.id,
      phone: isAdmin ? c.phone : c.phone,
      exotelCallSid: c.exotel_call_sid,
      callDuration: c.call_duration,
      callStatus: c.call_status,
      callCount: c.call_count || 1,
      recordingUrl: c.recording_url,
      reviewed: c.reviewed,
      discarded: c.discarded,
      convertedLeadId: c.converted_lead_id,
      createdAt: c.created_at,
    }));

    return NextResponse.json({
      callers: mapped,
      count: mapped.length,
    });
  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
