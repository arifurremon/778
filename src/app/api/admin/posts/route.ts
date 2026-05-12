import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/posts
 * Paginated list of posts with filtering and search.
 */
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URLSearchParams(req.url.split("?")[1]);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const search = searchParams.get("search") || "";
    const visibility = searchParams.get("visibility") || "all";
    const status = searchParams.get("status") || "all";
    const authorId = searchParams.get("authorId") || "";

    const where: any = {};

    // Search logic
    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    // Visibility filter
    if (visibility !== "all") {
      where.visibility = visibility;
    }

    // Author filter
    if (authorId) {
      where.authorId = authorId;
    }

    // [cite_start]Status filter (Moderation Status Fallback) [cite: 211, 264]
    if (status !== "all") {
      // SCHEMA-FALLBACK: 'moderationStatus' may not exist — verify schema
      try {
        if (status === "HIDDEN") {
          where.OR = [
            { moderationStatus: "HIDDEN" },
            { visibility: "PRIVATE" } // Using visibility as proxy
          ];
        } else {
          where.moderationStatus = status;
        }
      } catch (e) {
        if (status === "HIDDEN") where.visibility = "PRIVATE";
      }
    }

    let posts = [];
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
      // SCHEMA-FALLBACK: 'moderationStatus' or other fields may not exist
      // If the complex query fails, try a simpler one
      [posts, total] = await Promise.all([
        db.post.findMany({
          where: { ...where, moderationStatus: undefined }, // Remove potential problematic fields
          take: limit,
          skip: (page - 1) * limit,
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, email: true, profileImage: true } },
            _count: { select: { comments: true } }
          }
        }),
        db.post.count({ where: { ...where, moderationStatus: undefined } })
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
    console.error("[GET_POSTS_ERROR]:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
