import { validateCsrfRequest } from "@/lib/csrf";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveUser } from "@/lib/session-guards";

// ---------------------------------------------------------------------------
// DELETE /api/posts/[postId]
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
): Promise<NextResponse> {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

  try {
    const active = await requireActiveUser();
    if (active.error) return active.error;
    const { session, dbUser } = active;

    const { postId } = await params;

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const isAuthor = post.authorId === session.user.id;
    const isAdmin = dbUser.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to delete this post." },
        { status: 403 }
      );
    }

    await db.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true, message: "Post deleted." });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/posts/[postId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
