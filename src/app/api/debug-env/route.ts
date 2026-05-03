import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "MISSING";
  // Only show first 60 chars for safety
  return NextResponse.json({ url: url.slice(0, 80) });
}
