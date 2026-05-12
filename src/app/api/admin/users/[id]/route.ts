import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isSeller: z.boolean().optional(),
  isServiceProvider: z.boolean().optional(),
  emailVerified: z.union([z.string(), z.date(), z.null()]).optional(),
});

/**
 * GET /api/admin/users/[id]
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { posts: true, comments: true }
        },
        posts: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, createdAt: true }
        },
        shop: true,
        expertService: true
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // [cite_start]Prevent self-demotion. [cite: 69]
    if (params.id === session.user.id && validatedData.isAdmin === false) {
      return NextResponse.json({ error: "You cannot demote yourself from Admin." }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        emailVerified: validatedData.emailVerified ? new Date(validatedData.emailVerified as any) : null
      }
    });

    // [cite_start]Every mutation: logAdminAction() [cite: 71]
    await logAdminAction(
      session.user.id,
      "UPDATE_USER",
      "User",
      params.id,
      { changes: validatedData },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json(updatedUser);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ errors: err.errors }, { status: 400 });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAdmin();
    if (error || !session) return error;

    // [cite_start]Prevent self-deletion. [cite: 70]
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    });

    await logAdminAction(
      session.user.id,
      "SOFT_DELETE_USER",
      "User",
      params.id,
      {},
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "User soft-deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
