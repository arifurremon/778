import { NextRequest, NextResponse } from "next/server";

const SENTRY_HOST = "o4511376317743104.ingest.us.sentry.io";
const SENTRY_PROJECT_ID = "4511376352870400";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const envelope = await req.text();
    const piece = envelope.split("\n")[0] || "";
    const header = JSON.parse(piece) as { dsn?: string };

    if (typeof header.dsn !== "string") {
      return NextResponse.json({ error: "Missing or invalid DSN" }, { status: 400 });
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

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: envelope,
    });

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Tunnel error" }, { status: 500 });
  }
}
