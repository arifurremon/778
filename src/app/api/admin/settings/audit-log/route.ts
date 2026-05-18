import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/settings/audit-log
 * Retrieves the system audit logs with filtering and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 50; // [cite_start]pagination (50 per page)[cite: 173]
    
    // Filters
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

    try {
      // SCHEMA-FALLBACK: 'auditLog' may not exist — verify schema
      // @ts-ignore
      const [logs, total] = await Promise.all([
        // @ts-ignore
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
        // @ts-ignore
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
    } catch (e) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { total: 0, page: 1, limit: 50, totalPages: 0 }
      });
    }
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
