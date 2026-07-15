import { sql } from "@/lib/db";
import { createApiLogger } from "@/lib/logger/api-logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const log = createApiLogger(request, "/api/projects");
  log.start();
  try {
    const projects = await sql`SELECT name FROM projects ORDER BY name ASC`;
    const names = projects.map((p: any) => p.name);
    log.success(200, { count: names.length });
    return NextResponse.json(names);
  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
