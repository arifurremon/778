import { generateOpenApiDocument } from "@/lib/openapi/generate";
import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const document = generateOpenApiDocument();
  return NextResponse.json(document, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
