import { NextRequest, NextResponse } from "next/server";

const SENTRY_HOST = "o4511376317743104.ingest.us.sentry.io";
const SENTRY_PROJECT_ID = "4511376352870400";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const envelope = await req.text();
    const piece = envelope.split("\n")[0] || "";
    const header = JSON.parse(piece) as { dsn?: string };

    if (typeof header.dsn !== "string") {
      return NextResponse.json({ error: "Invalid DSN" }, { status: 400 });
    }

    const dsn = new URL(header.dsn);
    if (dsn.hostname !== SENTRY_HOST) {
      return NextResponse.json({ error: "Invalid host" }, { status: 403 });
    }

    const projectId = dsn.pathname.replace("/", "");
    if (projectId !== SENTRY_PROJECT_ID) {
      return NextResponse.json({ error: "Invalid project" }, { status: 403 });
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${SENTRY_PROJECT_ID}/envelope/`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
      await fetch(upstreamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-sentry-envelope" },
        body: envelope,
        signal: controller.signal,
      });
    } catch (e) {
      // Ignore fetch errors (including aborts) to always return 200 OK
    } finally {
      clearTimeout(timeoutId);
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
