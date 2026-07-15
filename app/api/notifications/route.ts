import { sql } from "@/lib/db";
import { createApiLogger } from "@/lib/logger/api-logger";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = createApiLogger(request, "/api/notifications");
  log.start();
  try {
    const newLeads = await sql`
      SELECT id, name, created_at 
      FROM leads 
      WHERE status = 'new' 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    log.success(200, { count: newLeads.length });
    return NextResponse.json(newLeads);
  } catch (error) {
    log.error(error);
    return NextResponse.json([], { status: 500 });
  }
}
