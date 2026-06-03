import { mapEmergencyContact } from "@/lib/emergency-utils";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { getClientIp } from "@/lib/request-ip";
import { NextRequest, NextResponse } from "next/server";

// GET /api/emergency — public emergency contacts list
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.publicRead, getClientIp(req)),
      "EmergencyRead"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const category = req.nextUrl.searchParams.get("category");
    const search = req.nextUrl.searchParams.get("search")?.trim().toLowerCase() ?? "";

    const contacts = await db.emergencyContact.findMany({
      where: category && category !== "All" ? { category } : undefined,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const mapped = contacts
      .map(mapEmergencyContact)
      .filter((contact) => {
        if (!search) return true;
        return (
          contact.name.toLowerCase().includes(search) ||
          contact.phone.includes(search) ||
          (contact.address?.toLowerCase().includes(search) ?? false)
        );
      });

    return NextResponse.json({ contacts: mapped });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/emergency]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
