import { auth } from "@/lib/auth";
import { validateCsrfRequest } from "@/lib/csrf";
import { logErrorToSentry } from "@/lib/error-handler";
import { sendNotificationEmailIfAllowed } from "@/lib/notification-email";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import { canUserViewPost } from "@/lib/post-visibility";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { sanitizeUserInput } from "@/lib/sanitize";
import { requireActiveSession } from "@/lib/session-guards";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
    const session = await auth();
    const viewerUserId = session?.user?.id ?? null;

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, visibility: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const allowed = await canUserViewPost(post, viewerUserId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden. You do not have access to this post." },
        { status: 403 }
      );
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
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

  try {
    const active = await requireActiveSession();
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.comments, session.user.id),
      "Comments",
      { quotaExceededMessage: "Comment limit reached (30/15 min)." }
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { postId } = await params;

    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, content: true },
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

    const sanitizedText = sanitizeUserInput(parsed.data.text);
    const commenterId = session.user.id;

    // Create comment sequentially (HTTP adapter doesn't support transactions)
    const comment = await db.comment.create({
      data: {
        postId,
        authorId: commenterId,
        text: sanitizedText,
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
      const postAuthor = await db.user.findUnique({
        where: { id: post.authorId },
        select: { email: true, privacySettings: true },
      });
      const commenterName = comment.author.preferredName || comment.author.name || "A user";

      await sendNotification({
        userId: post.authorId,
        actorId: commenterId,
        type: NotificationType.NEW_COMMENT,
        entityType: "Post",
        entityId: postId,
        metadata: {
          commentPreview: sanitizedText.slice(0, 80),
          commenterName,
        },
      });

      if (postAuthor) {
        await sendNotificationEmailIfAllowed(
          postAuthor,
          "New Comment on Your Post",
          "Someone left a comment!",
          `${commenterName} commented: "${sanitizedText.substring(0, 50)}${sanitizedText.length > 50 ? "..." : ""}"`,
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/community#post-${postId}`,
          "View Comment"
        );
      }
    }

    await db.activityLog.create({
      data: {
        userId: commenterId,
        type: "COMMENT",
        description: "You commented on a post.",
        contextUrl: `/community#post-${postId}`,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/posts/[postId]/comments]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
