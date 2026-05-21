import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role === "admin") where.isAdmin = true;
    else if (role === "seller") where.isSeller = true;
    else if (role === "provider") where.isServiceProvider = true;
    else if (role === "user") {
      where.isAdmin = false;
      where.isSeller = false;
      where.isServiceProvider = false;
    }

    if (status === "unverified") {
      where.emailVerified = null;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [sortBy]: sortOrder } as Prisma.UserOrderByWithRelationInput,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          profileImage: true,
          isAdmin: true,
          isSeller: true,
          isServiceProvider: true,
          emailVerified: true,
          createdAt: true,
          deletedAt: true,
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

    return NextResponse.json({ users, total, page, limit });
  } catch (err) {
    logErrorToSentry(err, { endpoint: "/api/admin/users", method: "GET" });
    return NextResponse.json(formatAPIError(err), { status: 500 });
  }
}