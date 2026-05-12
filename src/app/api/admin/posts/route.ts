import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/posts  — paginated post list with admin filters
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
    const visibility = searchParams.get("visibility") ?? "all";

    const where: Record<string, unknown> = {};

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    if (visibility !== "all") {
      where.visibility = visibility.toUpperCase();
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          images: true,
          visibility: true,
          helpfulCount: true,
          notHelpfulCount: true,
          checkInLocation: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isVerified: true,
              email: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/posts]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/posts  — bulk delete posts by IDs
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body = await req.json() as { postIds: string[] };
    if (!Array.isArray(body.postIds) || body.postIds.length === 0) {
      return NextResponse.json({ error: "No post IDs provided." }, { status: 400 });
    }

    await db.post.deleteMany({
      where: { id: { in: body.postIds } },
    });

    return NextResponse.json({ success: true, deleted: body.postIds.length });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/admin/posts]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
