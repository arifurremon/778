import { validateCsrfRequest } from "@/lib/csrf";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/audit-log";
import type { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/admin/users/[id]  — single user detail
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        profileImage: true,
        location: true,
        mobile: true,
        dob: true,
        joinDate: true,
        isAdmin: true,
        isVerified: true,
        isSeller: true,
        isServiceProvider: true,
        registrationStatus: true,
        serviceRegistrationStatus: true,
        verificationRequestStatus: true,
        verificationReason: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            sentRequests: true,
            receivedRequests: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            category: true,
            isVerified: true,
            rating: true,
            trustScore: true,
            _count: { select: { products: true } },
          },
        },
        expertService: {
          select: {
            id: true,
            profession: true,
            category: true,
            rating: true,
            experienceYears: true,
          },
        },
        activityLogs: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Fetch deletedAt separately (may be on the model as optional)
    const raw = await db.user.findUnique({ where: { id }, select: { deletedAt: true } });

    return NextResponse.json({ ...user, deletedAt: raw?.deletedAt ?? null });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/users/[id]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/[id]  — update user flags
// ---------------------------------------------------------------------------
const updateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isSeller: z.boolean().optional(),
  isServiceProvider: z.boolean().optional(),
  restore: z.boolean().optional(), // true to restore (set deletedAt = null)
  name: z.string().optional(),
  email: z.string().email().optional(),
  emailVerified: z.union([z.string(), z.date(), z.null()]).optional(),
});

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

    // Prevent self-modification of admin status
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot modify your own admin status." }, { status: 400 });
    }

    const body: unknown = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const { restore, emailVerified, ...rest } = parsed.data;
    const updateData: Prisma.UserUpdateInput = { ...rest };
    if (restore === true) updateData.deletedAt = null;
    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified ? new Date(emailVerified as any) : null;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isVerified: true,
        isSeller: true,
        isServiceProvider: true,
      },
    });

    await logAdminAction(
      session.user.id,
      "UPDATE_USER",
      "User",
      id,
      { changes: parsed.data },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json(user);
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/admin/users/[id]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/users/[id]  — soft delete
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

    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    }

    // Soft delete
    await db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAdminAction(
      session.user.id,
      "SOFT_DELETE_USER",
      "User",
      id,
      { method: "SOFT_DELETE" },
      req.headers.get("x-forwarded-for") || "unknown"
    );

    return NextResponse.json({ success: true, message: "User soft-deleted successfully" });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/admin/users/[id]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
