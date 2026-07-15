import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { createApiLogger } from "@/lib/logger/api-logger";
import { auth } from "@/lib/auth";  

export async function POST(
  req: Request,
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const log = createApiLogger(req, "/api/leads/[id]/quickaction");
  log.start();
  try {
    const { id, status, subStatus, comment, followUpDate, createdBy } = await req.json();

    await sql`
      UPDATE leads 
      SET 
        status = ${status}, 
        sub_status = ${subStatus}, 
        follow_up_date = ${followUpDate || null},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await sql`
      INSERT INTO timeline_events (
        lead_id, 
        type,
        title, 
        description, 
        created_by, 
        created_at
      ) 
      VALUES (
        ${id}, 
        'status_change',
        'Quick Action Update', 
        ${`Status updated to ${status} and sub-status to ${subStatus}.`}, 
        ${createdBy}, 
        NOW()
      )
    `;

    if (comment && comment.trim() !== "") {
      await sql`
        INSERT INTO comments (
          lead_id, 
          text, 
          created_by,
          created_at
        ) 
        VALUES (
          ${id}, 
          ${comment}, 
          ${createdBy},
          NOW()
        )
      `;

      await sql`
        INSERT INTO timeline_events (
          lead_id, 
          type,
          title, 
          description, 
          created_by, 
          created_at
        ) 
        VALUES (
          ${id}, 
          'comment',
          'New Note Added', 
          ${comment}, 
          ${createdBy}, 
          NOW()
        )
      `;
    }

    log.success(200, { id, status, subStatus, hasComment: !!comment?.trim() });
    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
