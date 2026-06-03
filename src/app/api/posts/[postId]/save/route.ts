import { requireActiveMutation } from "@/lib/session-guards";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ postId: string }> };

async function assertPostExists(postId: string) {
  return db.post.findUnique({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });
}

// POST /api/posts/[postId]/save — save a post for the current user
export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.savedPosts, session.user.id),
      "SavedPosts"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { postId } = await params;

    const post = await assertPostExists(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.savedPost.upsert({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
        create: {
          userId: session.user.id,
          postId,
        },
        update: {},
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          type: "SAVED",
          description: "You saved a post.",
          contextUrl: `/community#post-${postId}`,
        },
      });
    });

    return NextResponse.json({ isSaved: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/posts/[postId]/save]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/posts/[postId]/save — remove a saved post
export async function DELETE(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.savedPosts, session.user.id),
      "SavedPosts"
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { postId } = await params;

    await db.savedPost.deleteMany({
      where: {
        userId: session.user.id,
        postId,
      },
    });

    return NextResponse.json({ isSaved: false });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/posts/[postId]/save]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
