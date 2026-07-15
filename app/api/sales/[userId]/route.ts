import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createApiLogger } from "@/lib/logger/api-logger";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = await params;
  const log = createApiLogger(request, `/api/sales/${userId}`);
  log.start();

  const user = await sql`SELECT name FROM users WHERE id = ${userId}`;
    if (user.length === 0) {
        log.warn(404, { reason: "user_not_found", userId });
        return NextResponse.json({error: "User not found"}, {status: 404});
    }

  log.success(200, { userId });
  return NextResponse.json({name: user[0].name});
}
