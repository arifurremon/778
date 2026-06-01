import { requireAdmin } from "@/lib/admin-auth";
import { flaggedPostWhere } from "@/lib/admin/dashboard-metrics";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/posts/flagged
 * Returns posts marked for moderation review.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const flaggedPosts = await db.post.findMany({
      where: flaggedPostWhere,
      orderBy: [{ flagCount: "desc" }, { createdAt: "desc" }],
      include: {
        author: { select: { id: true, name: true, email: true, profileImage: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json(
      { success: true, posts: flaggedPosts },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/posts/flagged",
      method: "GET",
    });
    return NextResponse.json(formatAPIError(err), { status: 500 });
  }
}
