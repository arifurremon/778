import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// DELETE /api/posts/[postId]
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const isAuthor = post.authorId === session.user.id;
    const isAdmin = session.user.isAdmin === true;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to delete this post." },
        { status: 403 }
      );
    }

    await db.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true, message: "Post deleted." });
  } catch (error) {
    console.error("[DELETE /api/posts/[postId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
