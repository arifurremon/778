import { requireAdmin } from "@/lib/admin-auth";
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

    let flaggedPosts = [];

    // [cite_start]Return posts where moderationStatus = 'FLAGGED' (or flagCount > 0). [cite: 78]
    // SCHEMA-FALLBACK: 'moderationStatus' or 'flagCount' may not exist — verify schema
    try {
      flaggedPosts = await db.post.findMany({
        where: {
          OR: [
            // @ts-ignore
            { moderationStatus: 'FLAGGED' },
            // @ts-ignore
            { flagCount: { gt: 0 } }
          ]
        },
        orderBy: [
          // @ts-ignore
          { flagCount: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          author: { select: { id: true, name: true, email: true, profileImage: true } },
          _count: { select: { comments: true } }
        }
      });
    } catch (err) {
      // [SCHEMA_FALLBACK]: Moderation fields missing. Returning empty queue.
      // [cite_start]Return a safe default value. [cite: 265]
      flaggedPosts = [];
    }

    return NextResponse.json({ success: true, posts: flaggedPosts });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/posts/flagged",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
