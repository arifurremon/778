import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Shared author select for comments
// ---------------------------------------------------------------------------
const commentAuthorSelect = {
  id: true,
  name: true,
  preferredName: true,
  profileImage: true,
  isVerified: true,
  username: true,
} as const;

// ---------------------------------------------------------------------------
// GET /api/posts/[postId]/comments  — all comments with author info
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
): Promise<NextResponse> {
  try {
    const { postId } = await params;

    const postExists = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!postExists) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const comments = await db.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        text: true,
        likes: true,
        unlikes: true,
        createdAt: true,
        author: { select: commentAuthorSelect },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/posts/[postId]/comments]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/posts/[postId]/comments  — add a comment (auth required)
// ---------------------------------------------------------------------------
const addCommentSchema = z.object({
  text: z
    .string()
    .min(1, "Comment cannot be empty.")
    .max(500, "Comment cannot exceed 500 characters."),
});

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

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const body: unknown = await req.json();
    const parsed = addCommentSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { text } = parsed.data;
    const commenterId = session.user.id;

    // Create comment sequentially (HTTP adapter doesn't support transactions)
    const comment = await db.comment.create({
      data: {
        postId,
        authorId: commenterId,
        text,
      },
      select: {
        id: true,
        text: true,
        likes: true,
        unlikes: true,
        createdAt: true,
        author: { select: commentAuthorSelect },
      },
    });

    if (post.authorId !== commenterId) {
      await db.activityLog.create({
        data: {
          userId: post.authorId,
          type: "COMMENT",
          description: `Someone commented on your post.`,
          contextUrl: `/community`,
        },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/posts/[postId]/comments]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
