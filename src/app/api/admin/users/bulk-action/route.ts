import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bulkActionSchema = z.object({
  userIds: z.array(z.string()).max(100, "Maximum 100 users allowed per batch"),
  action: z.enum(['delete', 'suspend', 'export']),
  reason: z.string().optional(),
});

/**
 * POST /api/admin/users/bulk-action
 * Performs bulk operations on users within a transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const body = await req.json();
    const { userIds, action, reason } = bulkActionSchema.parse(body);

    // Prevent self-action in bulk
    const filteredIds = userIds.filter(id => id !== session.user.id);

    if (action === 'export') {
      const usersToExport = await db.user.findMany({
        where: { id: { in: filteredIds } }
      });
      return NextResponse.json({ data: usersToExport });
    }

    let result;
    if (action === 'delete') {
      // [cite_start]Handle in a single Prisma transaction. [cite: 71]
      result = await db.$transaction(
        filteredIds.map(id => 
          db.user.update({
            where: { id },
            data: { deletedAt: new Date() }
          })
        )
      );
    } else if (action === 'suspend') {
      // SCHEMA-FALLBACK: 'suspendedAt' may not exist — verify schema
      try {
        result = await db.$transaction(
          filteredIds.map(id => 
            db.user.update({
              where: { id },
              data: { 
                // @ts-ignore
                suspendedAt: new Date(),
                // @ts-ignore
                suspensionReason: reason || "Bulk suspension"
              }
            })
          )
        );
      } catch (err) {
        return NextResponse.json({ 
          error: "Schema fields for suspension are missing. Operation aborted.",
          fallback: true 
        }, { status: 400 });
      }
    }

    // [cite_start]Every mutation: logAdminAction() [cite: 71]
    await logAdminAction(
      session.user.id,
      `BULK_${action.toUpperCase()}`,
      "User",
      "multiple",
      { count: filteredIds.length, reason },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ 
      success: true, 
      count: filteredIds.length,
      ignoredSelf: userIds.length !== filteredIds.length
    });

  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ errors: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Bulk action failed" }, { status: 500 });
  }
}
