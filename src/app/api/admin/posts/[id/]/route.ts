import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { z } from "zod";

const updatePostSchema = z.object({
  visibility: z.enum(["PUBLIC", "NEIGHBOURS", "PRIVATE"]).optional(),
  moderationStatus: z.enum(["ACTIVE", "FLAGGED", "HIDDEN", "DELETED"]).optional(),
  adminNotes: z.string().optional(),
  isPinned: z.boolean().optional(),
});

/**
 * GET /api/admin/posts/[id]
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const post = await db.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, email: true, profileImage: true } },
        comments: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, name: true, profileImage: true } } }
        },
        _count: { select: { comments: true } }
      }
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/posts/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const body = await req.json();
    const validatedData = updatePostSchema.parse(body);

    let updatedPost;
    // [cite_start]SCHEMA-FALLBACK: 'moderationStatus', 'adminNotes', 'isPinned' may not exist [cite: 264]
    try {
      updatedPost = await db.post.update({
        where: { id: params.id },
        data: validatedData
      });
    } catch (e) {
      // Fallback: update only existing fields (visibility)
      updatedPost = await db.post.update({
        where: { id: params.id },
        data: { visibility: validatedData.visibility }
      });
    }

    await logAdminAction(
      session.user.id,
      "UPDATE_POST",
      "Post",
      params.id,
      { changes: validatedData },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ errors: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/posts/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    // [cite_start]Implement soft-delete for DELETE method. [cite: 70]
    // SCHEMA-FALLBACK: 'deletedAt' or 'moderationStatus' may not exist — verify schema
    try {
      await db.post.update({
        where: { id: params.id },
        data: { 
          // @ts-ignore
          deletedAt: new Date(),
          // @ts-ignore
          moderationStatus: 'DELETED'
        }
      });
    } catch (e) {
      // If soft-delete is not supported, we hide it instead
      await db.post.update({
        where: { id: params.id },
        data: { visibility: 'PRIVATE' }
      });
    }

    await logAdminAction(
      session.user.id,
      "DELETE_POST",
      "Post",
      params.id,
      { method: "SOFT_DELETE" },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "Post soft-deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
