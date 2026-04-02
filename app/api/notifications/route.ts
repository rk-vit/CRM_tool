import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const newLeads = await sql`
      SELECT id, name, created_at 
      FROM leads 
      WHERE status = 'new' 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    return NextResponse.json(newLeads);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}