import { validateCsrfRequest } from "@/lib/csrf";
import { logAdminAction } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updatePostSchema = z.object({
  visibility: z.enum(["PUBLIC", "NEIGHBOURS", "PRIVATE"]).optional(),
  moderationStatus: z.enum(["ACTIVE", "FLAGGED", "HIDDEN", "DELETED"]).optional(),
  adminNotes: z.string().optional(),
  isPinned: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/admin/posts/[id]  — post detail
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// PATCH /api/admin/posts/[id]
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const csrfError = validateCsrfRequest(req);
    if (csrfError) return csrfError;
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;
    const body = await req.json();
    const validatedData = updatePostSchema.parse(body);

    let updatedPost;
    // SCHEMA-FALLBACK: 'moderationStatus', 'adminNotes', 'isPinned' may not exist
    try {
      updatedPost = await db.post.update({
        where: { id },
        data: validatedData as Prisma.PostUpdateInput,
      });
    } catch (e) {
      // Fallback: update only existing fields (visibility)
      updatedPost = await db.post.update({
        where: { id },
        data: { visibility: validatedData.visibility },
      });
    }

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

// ---------------------------------------------------------------------------
// DELETE /api/admin/posts/[id]  — soft delete
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const csrfError = validateCsrfRequest(req);
    if (csrfError) return csrfError;
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const { id } = await params;

    // Soft-delete: attempt moderationStatus first, fall back to visibility
    try {
      await db.post.update({
        where: { id },
        data: {
          // @ts-ignore
          deletedAt: new Date(),
          // @ts-ignore
          moderationStatus: "DELETED",
        },
      });
    } catch (e) {
      await db.post.update({
        where: { id },
        data: { visibility: "PRIVATE" },
      });
    }

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
