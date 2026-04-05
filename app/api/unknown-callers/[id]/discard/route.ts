import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Get the unknown caller record
    const callerResult = await sql`
      SELECT * FROM unknown_callers WHERE id = ${id} AND reviewed = false
    `;

    if (callerResult.length === 0) {
      return NextResponse.json(
        { error: "Unknown caller not found or already reviewed." },
        { status: 404 }
      );
    }

    const caller = callerResult[0];

    // 2. Mark as reviewed + discarded
    await sql`
      UPDATE unknown_callers
      SET reviewed = true, discarded = true
      WHERE id = ${id}
    `;

    // 3. Add phone to blocked_numbers (permanent spam filter)
    await sql`
      INSERT INTO blocked_numbers (phone, reason)
      VALUES (${caller.phone}, 'spam')
      ON CONFLICT (phone) DO NOTHING
    `;

    return NextResponse.json({
      success: true,
      message: `Number ${caller.phone} has been blocked.`,
    });
  } catch (error) {
    console.error("Error discarding unknown caller:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
