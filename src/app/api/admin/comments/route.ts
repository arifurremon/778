import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// GET /api/admin/comments  — paginated comments across all posts
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";

    const where: Prisma.CommentWhereInput = {};
    if (search) {
      where.text = { contains: search, mode: "insensitive" };
    }

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          text: true,
          likes: true,
          unlikes: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              content: true,
              visibility: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              isVerified: true,
            },
          },
        },
      }),
      db.comment.count({ where }),
    ]);

    return NextResponse.json({
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/comments]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/comments  — bulk delete comments by IDs
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await req.json() as { commentIds: string[] };
    if (!Array.isArray(body.commentIds) || body.commentIds.length === 0) {
      return NextResponse.json({ error: "No comment IDs provided." }, { status: 400 });
    }

    await db.comment.deleteMany({
      where: { id: { in: body.commentIds } },
    });

    return NextResponse.json({ success: true, deleted: body.commentIds.length });
  } catch (error) {
    logErrorToSentry(error, { route: "[DELETE /api/admin/comments]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
