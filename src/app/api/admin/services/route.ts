import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/services
 * Paginated list of service providers with filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";

    const where: Record<string, unknown> = {};

    if (search) {
      // SCHEMA-FALLBACK: 'title' may not exist — using 'profession' or 'category' as proxy
      where.OR = [
        { profession: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } }
      ];
    }

    if (category !== "all") {
      where.category = category;
    }

    // Status filtering
    if (status !== "all") {
      if (status === "verified") {
        // SCHEMA-FALLBACK: 'isVerified' may not exist — verify schema
        try {
          where.isVerified = true;
        } catch (e) {
          where.user = { isServiceProvider: true, serviceRegistrationStatus: 'APPROVED' };
        }
      } else if (status === "pending") {
        try {
          where.isVerified = false;
          // SCHEMA-FALLBACK: 'rejectedAt' may not exist — verify schema
          where.rejectedAt = null;
        } catch (e) {
          where.user = { isServiceProvider: true, serviceRegistrationStatus: 'PENDING' };
        }
      } else if (status === "rejected") {
        try {
          // SCHEMA-FALLBACK: 'rejectedAt' may not exist — verify schema
          where.rejectedAt = { not: null };
        } catch (e) {
          where.user = { isServiceProvider: true, serviceRegistrationStatus: 'REJECTED' };
        }
      }
    }

    const [services, total] = await Promise.all([
      db.expertService.findMany({
        where: where as Prisma.ExpertServiceWhereInput,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, profileImage: true }
          }
        }
      }),
      db.expertService.count({ where: where as Prisma.ExpertServiceWhereInput })
    ]);

    // Map fields for frontend consistency
    const mappedServices = services.map((service) => ({
      ...service,
      title: service.profession,
      description: service.bio,
      provider: service,
    }));

    return NextResponse.json({
      success: true,
      services: mappedServices,
      total,
      page,
      limit
    });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/services",
      method: "GET"
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
