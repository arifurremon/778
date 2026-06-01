import { validateCsrfRequest } from "@/lib/csrf";
import { logAdminAction } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bulkSchema = z.object({
  action: z.enum(["hide", "delete"]),
  ids: z.array(z.string().uuid()).min(1, "At least one post id is required"),
});

/**
 * POST /api/admin/posts/bulk — hide or soft-delete multiple posts.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const body = await req.json();
    const { action, ids } = bulkSchema.parse(body);

    if (action === "hide") {
      await db.post.updateMany({
        where: { id: { in: ids } },
        data: { visibility: "PRIVATE" },
      });
    } else {
      await db.post.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date(), visibility: "PRIVATE" },
      });
    }

    await logAdminAction(
      session.user.id,
      action === "hide" ? "HIDE_POST" : "DELETE_POST",
      "Post",
      ids.join(","),
      { count: ids.length, action },
      req.headers.get("x-forwarded-for")
    );

    return NextResponse.json({ success: true, count: ids.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    }
    logErrorToSentry(err, { route: "POST /api/admin/posts/bulk" });
    return NextResponse.json(formatAPIError(err), { status: 500 });
  }
}
