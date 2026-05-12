import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// GET /api/admin/users  — paginated user list with filters
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const filter = searchParams.get("filter") ?? "all"; // all | verified | sellers | experts | admins | deleted

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filter === "verified") where.isVerified = true;
    else if (filter === "sellers") where.isSeller = true;
    else if (filter === "experts") where.isServiceProvider = true;
    else if (filter === "admins") where.isAdmin = true;
    else if (filter === "deleted") where.deletedAt = { not: null };
    // default: show all users

    const [users, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          profileImage: true,
          location: true,
          isAdmin: true,
          isVerified: true,
          isSeller: true,
          isServiceProvider: true,
          registrationStatus: true,
          serviceRegistrationStatus: true,
          verificationRequestStatus: true,
          deletedAt: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/users]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/users  — bulk update users
// ---------------------------------------------------------------------------
const bulkActionSchema = z.object({
  userIds: z.array(z.string()).min(1),
  action: z.enum(["delete", "restore", "makeAdmin", "removeAdmin", "verify", "unverify"]),
});

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body: unknown = await req.json();
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Validation failed." }, { status: 400 });
    }

    const { userIds, action } = parsed.data;

    // Prevent modifying self
    if (userIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Cannot perform bulk actions on your own account." }, { status: 400 });
    }

    const updateData: Prisma.UserUpdateManyMutationInput = {};
    if (action === "delete") updateData.deletedAt = new Date();
    else if (action === "restore") updateData.deletedAt = null;
    else if (action === "makeAdmin") updateData.isAdmin = true;
    else if (action === "removeAdmin") updateData.isAdmin = false;
    else if (action === "verify") {
      updateData.isVerified = true;
      updateData.verificationRequestStatus = "APPROVED";
    } else if (action === "unverify") {
      updateData.isVerified = false;
    }

    await db.user.updateMany({
      where: { id: { in: userIds } },
      data: updateData,
    });

    return NextResponse.json({ success: true, affected: userIds.length });
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/admin/users]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
