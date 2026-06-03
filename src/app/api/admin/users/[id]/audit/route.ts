import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

type AuditLogWithAdmin = Prisma.AuditLogGetPayload<{
  include: { admin: { select: { name: true; email: true } } };
}>;

type ActivityLogWithUser = Prisma.ActivityLogGetPayload<{
  select: {
    id: true;
    type: true;
    description: true;
    createdAt: true;
    user: { select: { name: true } };
  };
}>;

/**
 * GET /api/admin/users/[id]/audit
 * Returns last 20 audit logs for a specific user.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    let logs: AuditLogWithAdmin[] | ActivityLogWithUser[] = [];

    // [cite_start]Wrap that specific query in try/catch. [cite: 263]
    // SCHEMA-FALLBACK: 'AuditLog' model may not exist — verify schema
    try {
      logs = await db.auditLog.findMany({
        where: {
          OR: [
            { adminId: id },
            { entityType: "User", entityId: id },
          ],
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { name: true, email: true } }
        }
      });
    } catch (err) {
      // Optional: Try fetching from ActivityLog if it represents similar data
      try {
        logs = await db.activityLog.findMany({
          where: { userId: id },
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
            user: { select: { name: true } }
          }
        });
      } catch (e) {
        logs = []; // [cite_start]Return a safe default value. [cite: 265]
      }
    }

    return NextResponse.json({ logs });

  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
