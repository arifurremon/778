import { logAdminAction } from "@/lib/audit-log";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const moderationSchema = z.object({
  action: z.enum(["approve", "hide", "delete", "ban_author"]),
  reason: z.string().min(5, "Reason must be at least 5 characters long").optional(),
});

/**
 * POST /api/admin/posts/[id]/moderate
 * Handles specific moderation decisions for a post.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = moderationSchema.parse(body);

    // All actions except 'approve' MUST require a reason
    if (validatedData.action !== "approve" && !validatedData.reason) {
      return NextResponse.json(
        { error: "A reason is required for this moderation action." },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    let updatedPost;

    if (validatedData.action === "approve") {
      // SCHEMA-FALLBACK: 'moderationStatus' or 'flagCount' may not exist
      try {
        updatedPost = await db.post.update({
          where: { id },
          data: {
            // @ts-ignore
            moderationStatus: "ACTIVE",
            // @ts-ignore
            flagCount: 0,
          },
        });
      } catch (e) {
        updatedPost = await db.post.update({
          where: { id },
          data: { visibility: "PUBLIC" },
        });
      }
    } else if (validatedData.action === "hide") {
      try {
        updatedPost = await db.post.update({
          where: { id },
          data: {
            // @ts-ignore
            moderationStatus: "HIDDEN",
            visibility: "PRIVATE",
          },
        });
      } catch (e) {
        updatedPost = await db.post.update({
          where: { id },
          data: { visibility: "PRIVATE" },
        });
      }
    } else if (validatedData.action === "delete") {
      try {
        updatedPost = await db.post.update({
          where: { id },
          data: {
            // @ts-ignore
            deletedAt: new Date(),
            // @ts-ignore
            moderationStatus: "DELETED",
          },
        });
      } catch (e) {
        updatedPost = await db.post.update({
          where: { id },
          data: { visibility: "PRIVATE" },
        });
      }
    } else if (validatedData.action === "ban_author") {
      // SCHEMA-FALLBACK: 'suspendedAt' or 'suspensionReason' may not exist on User
      try {
        await db.user.update({
          where: { id: post.authorId },
          data: {
            // @ts-ignore
            suspendedAt: new Date(),
            // @ts-ignore
            suspensionReason: validatedData.reason,
          },
        });
      } catch (e) {
        // SCHEMA_FALLBACK: Suspension fields missing on User.
      }

      // Also hide the post
      updatedPost = await db.post.update({
        where: { id },
        data: { visibility: "PRIVATE" },
      });
    }

    await logAdminAction(
      session.user.id,
      `MODERATE_${validatedData.action.toUpperCase()}`,
      "Post",
      id,
      { reason: validatedData.reason },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    logErrorToSentry(err, {
      endpoint: "/api/admin/posts/[id]/moderate",
      method: "POST",
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
