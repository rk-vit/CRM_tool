import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { createApiLogger } from "@/lib/logger/api-logger";

export async function POST(request: Request) {
  const log = createApiLogger(request, "/api/auth/change-password");
  log.start();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn(401, { reason: "missing_session" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      log.warn(400, { reason: "missing_fields" });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      log.warn(400, { reason: "password_too_short" });
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Fetch user
    const users = await sql`
      SELECT id, password FROM users WHERE id = ${userId} LIMIT 1
    `;

    if (users.length === 0) {
      log.warn(404, { reason: "user_not_found" });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      log.warn(401, { reason: "incorrect_current_password" });
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    await sql`
      UPDATE users SET password = ${hashedNewPassword}, updated_at = CURRENT_TIMESTAMP WHERE id = ${userId}
    `;

    log.success(200, { userId });
    return NextResponse.json({ success: true });

  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
