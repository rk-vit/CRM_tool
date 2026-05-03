import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
) {
  try {
    console.log("Received quick action request");
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

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}