import {sql} from "@/lib/db";
import {NextResponse} from "next/server";
import { use } from "react";

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const {userId} = await params;

  const user = await sql`SELECT name FROM users WHERE id = ${userId}`;
    if (user.length === 0) {
        return NextResponse.json({error: "User not found"}, {status: 404});
    }

  return NextResponse.json({name: user[0].name});
}