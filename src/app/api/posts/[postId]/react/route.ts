import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const reactSchema = z.object({
  type: z.enum(["helpful", "notHelpful"], {
    errorMap: () => ({ message: "type must be 'helpful' or 'notHelpful'." }),
  }),
});

// ---------------------------------------------------------------------------
// POST /api/posts/[postId]/react  — idempotent reaction toggle (auth required)
//
// Behaviour:
//  - Same type again → toggle OFF (remove reaction, decrement counter)
//  - Different type  → swap reaction (swap counters)
//  - No prior reaction → create and increment
// All DB writes run inside a single $transaction to prevent race conditions.
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const userId = session.user.id;

    const postExists = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!postExists) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const body: unknown = await req.json();
    const parsed = reactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { type } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      // Check for existing reaction
      const existing = await tx.userPostReaction.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      let helpfulDelta = 0;
      let notHelpfulDelta = 0;
      let userReaction: "helpful" | "notHelpful" | null = null;

      if (existing) {
        if (existing.type === type) {
          // Same type → toggle OFF
          await tx.userPostReaction.delete({
            where: { userId_postId: { userId, postId } },
          });
          if (type === "helpful") helpfulDelta = -1;
          else notHelpfulDelta = -1;
          userReaction = null;
        } else {
          // Different type → swap
          await tx.userPostReaction.update({
            where: { userId_postId: { userId, postId } },
            data: { type },
          });
          if (type === "helpful") {
            helpfulDelta = 1;
            notHelpfulDelta = -1;
          } else {
            helpfulDelta = -1;
            notHelpfulDelta = 1;
          }
          userReaction = type;
        }
      } else {
        // No prior reaction → create
        await tx.userPostReaction.create({
          data: { userId, postId, type },
        });
        if (type === "helpful") helpfulDelta = 1;
        else notHelpfulDelta = 1;
        userReaction = type;
      }

      const updated = await tx.post.update({
        where: { id: postId },
        data: {
          ...(helpfulDelta !== 0 ? { helpfulCount: { increment: helpfulDelta } } : {}),
          ...(notHelpfulDelta !== 0 ? { notHelpfulCount: { increment: notHelpfulDelta } } : {}),
        },
        select: { id: true, helpfulCount: true, notHelpfulCount: true, authorId: true },
      });

      // Activity log only when adding a new reaction (not toggling off)
      if (userReaction !== null && updated.authorId !== userId) {
        const sender = await tx.user.findUnique({ where: { id: userId }, select: { name: true } });
        const actionDesc = type === "helpful" ? "found your post helpful" : "did not find your post helpful";
        await tx.activityLog.create({
          data: {
            userId: updated.authorId,
            type: type === "helpful" ? "LIKE" : "POST_DISLIKE",
            description: `${sender?.name || "Someone"} ${actionDesc}.`,
            contextUrl: `/community#post-${postId}`,
          },
        });
      }

      return { updated, userReaction };
    });

    return NextResponse.json({
      id: result.updated.id,
      helpfulCount: result.updated.helpfulCount,
      notHelpfulCount: result.updated.notHelpfulCount,
      userReaction: result.userReaction,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/posts/[postId]/react]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
