import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 50;

    const adminId = searchParams.get("adminId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.AuditLogWhereInput = {};

    if (adminId && adminId !== "all") where.adminId = adminId;
    if (action && action !== "all") where.action = action;
    if (entityType && entityType !== "all") where.entityType = entityType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: { id: true, name: true, email: true, profileImage: true }
          }
        }
      }),
      db.auditLog.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/settings/audit-log",
      method: "GET"
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
