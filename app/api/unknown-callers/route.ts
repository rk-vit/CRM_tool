import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callers = await sql`
      SELECT * FROM unknown_callers
      WHERE reviewed = false
      ORDER BY created_at DESC
    `;

    const mapped = callers.map((c: any) => ({
      id: c.id,
      phone: c.phone,
      exotelCallSid: c.exotel_call_sid,
      callDuration: c.call_duration,
      callStatus: c.call_status,
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
    console.error("Error fetching unknown callers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
