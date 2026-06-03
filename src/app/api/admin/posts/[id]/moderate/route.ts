import { requireAdminMutation } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { sendNotification, NotificationType } from "@/lib/notification-service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const moderationSchema = z.object({
  action: z.enum(["approve", "hide", "delete", "ban_author"]),
  reason: z.string().min(5, "Reason must be at least 5 characters long").optional(),
});

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const admin = await requireAdminMutation(req);
    if (admin.error) return admin.error;
    const { session } = admin;

    const { id } = await params;
    const body = await req.json();
    const validatedData = moderationSchema.parse(body);

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
      updatedPost = await db.post.update({
        where: { id },
        data: {
          moderationStatus: "ACTIVE",
          flagCount: 0,
        },
      });
    } else if (validatedData.action === "hide") {
      updatedPost = await db.post.update({
        where: { id },
        data: {
          moderationStatus: "HIDDEN",
          visibility: "PRIVATE",
        },
      });
    } else if (validatedData.action === "delete") {
      updatedPost = await db.post.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          moderationStatus: "DELETED",
        },
      });
    } else if (validatedData.action === "ban_author") {
      await db.user.update({
        where: { id: post.authorId },
        data: {
          suspendedAt: new Date(),
          suspensionReason: validatedData.reason,
        },
      });

      updatedPost = await db.post.update({
        where: { id },
        data: { visibility: "PRIVATE" },
      });
    }

    if (validatedData.action !== "approve") {
      const messageByAction: Record<string, string> = {
        hide: `Your post was hidden by a moderator. Reason: ${validatedData.reason}`,
        delete: `Your post was removed by a moderator. Reason: ${validatedData.reason}`,
        ban_author: `Your account was suspended. Reason: ${validatedData.reason}`,
      };

      await sendNotification({
        userId: post.authorId,
        actorId: session.user.id,
        type:
          validatedData.action === "ban_author"
            ? NotificationType.MODERATION_ACTION
            : NotificationType.POST_FLAGGED,
        entityType: "Post",
        entityId: id,
        metadata: {
          message: messageByAction[validatedData.action] ?? "Your post was moderated.",
          severity: validatedData.action === "ban_author" ? "HIGH" : "LOW",
          action: validatedData.action,
          reason: validatedData.reason ?? null,
        },
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
    return NextResponse.json(formatAPIError(err), { status: 500 });
  }
}
