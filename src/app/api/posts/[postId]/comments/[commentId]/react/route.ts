import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { requireActiveMutation } from "@/lib/session-guards";

type RouteContext = { params: Promise<{ postId: string; commentId: string }> };

// ---------------------------------------------------------------------------
// POST /api/posts/[postId]/comments/[commentId]/react — idempotent toggle
//
// Behaviour:
//  - Same type again → toggle OFF (remove reaction, decrement counter)
//  - Different type  → swap reaction (swap counters)
//  - No prior reaction → create and increment
// All DB writes run inside a single $transaction to prevent race conditions.
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.reactions, session.user.id),
      "Reactions"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { postId, commentId } = await params;
    const userId = session.user.id;

    const commentForPost = await db.comment.findFirst({
      where: { id: commentId, postId },
      select: { id: true },
    });
    if (!commentForPost) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const body = await req.json();
    const { type } = body as { type: "like" | "unlike" };

    if (!type || !["like", "unlike"].includes(type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // Check for existing reaction
      const existing = await tx.userCommentReaction.findUnique({
        where: { userId_commentId: { userId, commentId } },
      });

      let likesDelta = 0;
      let unlikesDelta = 0;
      let userReaction: "like" | "unlike" | null = null;

      if (existing) {
        if (existing.type === type) {
          // Same type → toggle OFF
          await tx.userCommentReaction.delete({
            where: { userId_commentId: { userId, commentId } },
          });
          if (type === "like") likesDelta = -1;
          else unlikesDelta = -1;
          userReaction = null;
        } else {
          // Different type → swap
          await tx.userCommentReaction.update({
            where: { userId_commentId: { userId, commentId } },
            data: { type },
          });
          if (type === "like") {
            likesDelta = 1;
            unlikesDelta = -1;
          } else {
            likesDelta = -1;
            unlikesDelta = 1;
          }
          userReaction = type;
        }
      } else {
        // No prior reaction → create
        await tx.userCommentReaction.create({
          data: { userId, commentId, type },
        });
        if (type === "like") likesDelta = 1;
        else unlikesDelta = 1;
        userReaction = type;
      }

      const comment = await tx.comment.update({
        where: { id: commentId },
        data: {
          ...(likesDelta !== 0 ? { likes: { increment: likesDelta } } : {}),
          ...(unlikesDelta !== 0 ? { unlikes: { increment: unlikesDelta } } : {}),
        },
        include: {
          post: { select: { id: true, authorId: true } },
          author: { select: { name: true, username: true } },
        },
      });

      // Activity log only when adding (not removing) a reaction to someone else's comment
      if (userReaction !== null && comment.authorId !== userId) {
        const sender = await tx.user.findUnique({ where: { id: userId }, select: { name: true } });
        const actionDesc = type === "like" ? "liked" : "disliked";

        await tx.activityLog.create({
          data: {
            userId: comment.authorId,
            type: type === "like" ? "COMMENT_LIKE" : "COMMENT_DISLIKE",
            description: `${sender?.name || "Someone"} ${actionDesc} your comment in a community post.`,
            contextUrl: `/community#post-${postId}`,
          },
        });
      }

      return { comment, userReaction };
    });

    return NextResponse.json({
      success: true,
      likes: result.comment.likes,
      unlikes: result.comment.unlikes,
      userReaction: result.userReaction,
    });
  } catch (error) {
    logErrorToSentry(error, { route: `[POST /api/posts/[postId]/comments/[commentId]/react]` });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
