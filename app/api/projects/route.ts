import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = await sql`SELECT name FROM projects ORDER BY name ASC`;
    return NextResponse.json(projects.map((p: any) => p.name));
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
