import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ userId: string }> };

// ---------------------------------------------------------------------------
// GET /api/admin/users/[userId]  — single user detail
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { userId } = await params;

    const user = await db.user.findUnique({
      where: { id: userId },
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

    // Fetch deletedAt separately
    const raw = await db.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });

    return NextResponse.json({ ...user, deletedAt: raw?.deletedAt ?? null });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/users/[userId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/[userId]  — update user flags
// ---------------------------------------------------------------------------
const updateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isSeller: z.boolean().optional(),
  isServiceProvider: z.boolean().optional(),
  restore: z.boolean().optional(), // true to restore (set deletedAt = null)
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { userId } = await params;

    // Prevent self-modification of admin status
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot modify your own admin status." }, { status: 400 });
    }

    const body: unknown = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Validation failed." }, { status: 400 });
    }

    const { restore, ...rest } = parsed.data;
    const updateData: Prisma.UserUpdateInput = { ...rest };
    if (restore === true) updateData.deletedAt = null;

    const user = await db.user.update({
      where: { id: userId },
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

    return NextResponse.json(user);
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/admin/users/[userId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/users/[userId]  — soft delete
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { userId } = await params;

    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    }

    // Soft delete
    await db.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/admin/users/[userId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
