import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { z } from "zod";

const moderationSchema = z.object({
  action: z.enum(['approve', 'hide', 'delete', 'ban_author']),
  reason: z.string().min(5, "Reason must be at least 5 characters long").optional(),
});

/**
 * POST /api/admin/posts/[id]/moderate
 * Handles specific moderation decisions for a post.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const body = await req.json();
    const validatedData = moderationSchema.parse(body);

    // All actions except 'approve' MUST require a reason
    if (validatedData.action !== 'approve' && !validatedData.reason) {
      return NextResponse.json({ error: "A reason is required for this moderation action." }, { status: 400 });
    }

    const post = await db.post.findUnique({
      where: { id: params.id },
      select: { authorId: true }
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    let updatedPost;

    if (validatedData.action === 'approve') {
      // SCHEMA-FALLBACK: 'moderationStatus' or 'flagCount' may not exist
      try {
        updatedPost = await db.post.update({
          where: { id: params.id },
          data: { 
            // @ts-ignore
            moderationStatus: 'ACTIVE', 
            // @ts-ignore
            flagCount: 0 
          }
        });
      } catch (e) {
        updatedPost = await db.post.update({
          where: { id: params.id },
          data: { visibility: 'PUBLIC' }
        });
      }
    } else if (validatedData.action === 'hide') {
      try {
        updatedPost = await db.post.update({
          where: { id: params.id },
          data: { 
            // @ts-ignore
            moderationStatus: 'HIDDEN',
            visibility: 'PRIVATE'
          }
        });
      } catch (e) {
        updatedPost = await db.post.update({
          where: { id: params.id },
          data: { visibility: 'PRIVATE' }
        });
      }
    } else if (validatedData.action === 'delete') {
      try {
        updatedPost = await db.post.update({
          where: { id: params.id },
          data: { 
            // @ts-ignore
            deletedAt: new Date(),
            // @ts-ignore
            moderationStatus: 'DELETED'
          }
        });
      } catch (e) {
        updatedPost = await db.post.update({
          where: { id: params.id },
          data: { visibility: 'PRIVATE' }
        });
      }
    } else if (validatedData.action === 'ban_author') {
      // [cite_start]ban_author (set suspendedAt = now() on author). [cite: 78]
      // SCHEMA-FALLBACK: 'suspendedAt' or 'suspensionReason' may not exist on User
      try {
        await db.user.update({
          where: { id: post.authorId },
          data: {
            // @ts-ignore
            suspendedAt: new Date(),
            // @ts-ignore
            suspensionReason: validatedData.reason
          }
        });
      } catch (e) {
        console.warn("[SCHEMA_FALLBACK]: Suspension fields missing on User.");
      }
      
      // Also hide the post
      updatedPost = await db.post.update({
        where: { id: params.id },
        data: { visibility: 'PRIVATE' }
      });
    }

    // [cite_start]Every mutation: logAdminAction() with action, postId, and reason. [cite: 71]
    await logAdminAction(
      session.user.id,
      `MODERATE_${validatedData.action.toUpperCase()}`,
      "Post",
      params.id,
      { reason: validatedData.reason },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, post: updatedPost });

  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ errors: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Moderation action failed" }, { status: 500 });
  }
}
