import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = encodeURIComponent("Hi, Please Give me more details about the project- The Peak");

    return NextResponse.redirect(
        `https://wa.me/+919500940094?text=${msg}`
    );
}