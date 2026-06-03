import { requireAdmin, requireAdminMutation } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import type { ModerationStatus, PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updatePostSchema = z.object({
  visibility: z.enum(["PUBLIC", "NEIGHBOURS", "PRIVATE"]).optional(),
  moderationStatus: z.enum(["ACTIVE", "APPROVED", "FLAGGED", "HIDDEN", "DELETED"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const post = await db.post.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        images: true,
        checkInLocation: true,
        visibility: true,
        moderationStatus: true,
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
    logErrorToSentry(error, {
      endpoint: "/api/admin/posts/[id]",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(error),
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const admin = await requireAdminMutation(req);
    if (admin.error) return admin.error;
    const { session } = admin;

    const { id } = await params;
    const body = await req.json();
    const validatedData = updatePostSchema.parse(body);

    const updatedPost = await db.post.update({
      where: { id },
      data: {
        ...(validatedData.visibility
          ? { visibility: validatedData.visibility as PrivacyLevel }
          : {}),
        ...(validatedData.moderationStatus
          ? { moderationStatus: validatedData.moderationStatus as ModerationStatus }
          : {}),
      },
    });

    await logAdminAction(
      session.user.id,
      "UPDATE_POST",
      "Post",
      id,
      { changes: validatedData },
      req.headers.get("x-forwarded-for") || "unknown"
    );
    return NextResponse.json({ success: true, post: updatedPost });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ errors: err.errors }, { status: 400 });
    logErrorToSentry(err, {
      endpoint: "/api/admin/posts/[id]",
      method: "PATCH",
    });
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const admin = await requireAdminMutation(req);
    if (admin.error) return admin.error;
    const { session } = admin;

    const { id } = await params;

    await db.post.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        moderationStatus: "DELETED",
      },
    });

    await logAdminAction(
      session.user.id,
      "DELETE_POST",
      "Post",
      id,
      { method: "SOFT_DELETE" },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Post soft-deleted successfully" });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin/posts/[id]",
      method: "DELETE",
    });
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
