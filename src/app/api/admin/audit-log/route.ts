import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// GET /api/admin/audit-log — paginated system activity log
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const type = searchParams.get("type") ?? "";

    const where: Prisma.ActivityLogWhereInput = {};
    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }
    if (type && type !== "all") {
      where.type = type as Prisma.EnumActivityTypeFilter;
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          description: true,
          contextUrl: true,
          isRead: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
        },
      }),
      db.activityLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/audit-log]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
