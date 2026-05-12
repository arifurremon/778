import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ postId: string }> };

// ---------------------------------------------------------------------------
// GET /api/admin/posts/[postId]  — post detail
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { postId } = await params;

    const post = await db.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        content: true,
        images: true,
        checkInLocation: true,
        visibility: true,
        helpfulCount: true,
        notHelpfulCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            isVerified: true,
            isSeller: true,
            isServiceProvider: true,
            location: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            text: true,
            likes: true,
            unlikes: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                isVerified: true,
              },
            },
          },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/posts/[postId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/posts/[postId]  — delete single post
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { postId } = await params;

    await db.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/admin/posts/[postId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
