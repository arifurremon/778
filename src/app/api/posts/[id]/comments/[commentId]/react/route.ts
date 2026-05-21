import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";

type RouteContext = { params: Promise<{ id: string; commentId: string }> };

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId, commentId } = await params;
    const body = await req.json();
    const { type } = body as { type: 'like' | 'unlike' };

    if (!type || !['like', 'unlike'].includes(type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Update the comment
    const comment = await db.comment.update({
      where: { id: commentId },
      data: {
        ...(type === 'like' ? { likes: { increment: 1 } } : { unlikes: { increment: 1 } })
      },
      include: {
        post: { select: { id: true, authorId: true } },
        author: { select: { name: true, username: true } }
      }
    });

    // Create Notification (ActivityLog) for the comment author
    if (comment.authorId !== session.user.id) {
      const sender = await db.user.findUnique({ where: { id: session.user.id } });
      const actionDesc = type === 'like' ? 'liked' : 'disliked';
      
      await db.activityLog.create({
        data: {
          userId: comment.authorId,
          type: type === 'like' ? 'COMMENT_LIKE' : 'COMMENT_DISLIKE',
          description: `${sender?.name || 'Someone'} ${actionDesc} your comment in a community post.`,
          contextUrl: `/community#post-${postId}`,
        }
      });
    }

    return NextResponse.json({ success: true, likes: comment.likes, unlikes: comment.unlikes });
  } catch (error) {
    logErrorToSentry(error, { route: `[POST /api/posts/[id]/comments/[commentId]/react]` });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
