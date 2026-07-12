import { sql } from "@/lib/db";
import { createApiLogger } from "@/lib/logger/api-logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
