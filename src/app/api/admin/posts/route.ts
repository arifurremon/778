import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { Prisma, PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/posts
 * Paginated list of posts with filtering and search.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";
    const visibility = searchParams.get("visibility") || "all";
    const status = searchParams.get("status") || "all";
    const authorId = searchParams.get("authorId") || "";

    const where: Prisma.PostWhereInput = {};

    // Search logic
    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    // Visibility filter
    if (visibility !== "all") {
      where.visibility = visibility as PrivacyLevel;
    }

    // Author filter
    if (authorId) {
      where.authorId = authorId;
    }

    // Status filter uses visibility because Post has no moderationStatus field.
    if (status === "hidden") {
      where.visibility = "PRIVATE" as PrivacyLevel;
    }

    let posts: Prisma.PostGetPayload<object>[] = [];
    let total = 0;

    try {
      [posts, total] = await Promise.all([
        db.post.findMany({
          where,
          take: limit,
          skip: (page - 1) * limit,
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: { id: true, name: true, email: true, profileImage: true }
            },
            _count: {
              select: { comments: true }
            }
          }
        }),
        db.post.count({ where })
      ]);
    } catch (err) {
      [posts, total] = await Promise.all([
        db.post.findMany({
          where,
          take: limit,
          skip: (page - 1) * limit,
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, email: true, profileImage: true } },
            _count: { select: { comments: true } }
          }
        }),
        db.post.count({ where })
      ]);
    }

    return NextResponse.json({
      success: true,
      posts,
      total,
      page,
      limit
    });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/posts",
      method: "GET",
    });
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
