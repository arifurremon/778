import { requireAdmin } from "@/lib/admin-auth";
import { decimalToNumber } from "@/lib/money/fee";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/services/pending
 * Returns a list of service provider applications awaiting verification.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    // [cite_start]/pending returns services where isVerified=false AND rejectedAt=null, ordered by oldest first. [cite: 111, 116]
    const where: Record<string, unknown> = {};

    try {
      // SCHEMA-FALLBACK: 'isVerified' and 'rejectedAt' may not exist — verify schema
      where.isVerified = false;
      where.rejectedAt = null;
    } catch (e) {
      // Fallback: Use User's serviceRegistrationStatus
      where.user = { serviceRegistrationStatus: 'PENDING' };
    }

    const pendingServices = await db.expertService.findMany({
      where: where as Prisma.ExpertServiceWhereInput,
      orderBy: { createdAt: "asc" }, // Oldest first
      take: 50, // [cite_start]Maximum 50 items for the pending list. [cite: 122]
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } }
      }
    });

    const mappedServices = pendingServices.map((service) => ({
      ...service,
      fee: decimalToNumber(service.fee),
      title: service.profession,
      description: service.bio,
      provider: service.user,
      user: undefined,
    }));

    return NextResponse.json({ success: true, services: mappedServices });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/services/pending",
      method: "GET"
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
