import { validateCsrfRequest } from "@/lib/csrf";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const suspendSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters long"),
  suspended: z.boolean()
});

/**
 * POST /api/admin/users/[id]/suspend
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;
    const body = await req.json();
    const validatedData = suspendSchema.parse(body);

    if (id === session.user.id && validatedData.suspended) {
      return NextResponse.json({ error: "You cannot suspend your own account." }, { status: 400 });
    }

    await db.user.update({
      where: { id },
      data: {
        suspendedAt: validatedData.suspended ? new Date() : null,
        suspensionReason: validatedData.suspended ? validatedData.reason : null,
      },
    });

    await db.session.deleteMany({ where: { userId: id } });

    await logAdminAction(
      session.user.id,
      validatedData.suspended ? "SUSPEND_USER" : "UNSUSPEND_USER",
      "User",
      id,
      { reason: validatedData.reason },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({
      success: true,
      message: "Status updated",
    });

  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ errors: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Failed to process suspension" }, { status: 500 });
  }
}
