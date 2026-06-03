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

// POST /api/posts/[postId]/follow — follow a discussion thread
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

    await db.followedPost.upsert({
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

    return NextResponse.json({ isFollowing: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/posts/[postId]/follow]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/posts/[postId]/follow — unfollow a discussion thread
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

    await db.followedPost.deleteMany({
      where: {
        userId: session.user.id,
        postId,
      },
    });

    return NextResponse.json({ isFollowing: false });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/posts/[postId]/follow]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
