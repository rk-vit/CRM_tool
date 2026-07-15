import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createApiLogger } from "@/lib/logger/api-logger";

export async function GET(request: Request) {
  const log = createApiLogger(request, "/api/calls/recording");
  log.start();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn(401, { reason: "missing_session" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recordingUrl = searchParams.get("url");

    if (!recordingUrl) {
      log.warn(400, { reason: "missing_url" });
      return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
    }

    // Exotel credentials
    const apiKey = process.env.EXOTEL_API_KEY;
    const apiToken = process.env.EXOTEL_API_TOKEN;

    if (!apiKey || !apiToken) {
      log.error(new Error("Exotel credentials not configured"), 500, { reason: "missing_exotel_credentials" });
      return NextResponse.json({ error: "Exotel credentials not configured" }, { status: 500 });
    }

    // Fetch the recording from Exotel with authentication
    const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiToken}`).toString("base64");

    const response = await fetch(recordingUrl, {
      headers: {
        "Authorization": authHeader,
      },
    });

    if (!response.ok) {
      log.warn(response.status, { reason: "recording_fetch_failed", recordingUrl });
      return NextResponse.json({ error: "Failed to fetch recording" }, { status: response.status });
    }

    // Stream the audio back to the browser
    const audioData = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "audio/mpeg";

    log.success(200, { recordingUrl, contentType });
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioData.byteLength.toString(),
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    log.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
