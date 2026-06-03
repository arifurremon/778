import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

const authorSelect = {
  id: true,
  name: true,
  preferredName: true,
  profileImage: true,
  isVerified: true,
  isSeller: true,
  isServiceProvider: true,
  username: true,
} as const;

// GET /api/user/saved-posts — authenticated user's saved posts
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10))
    );
    const skip = (page - 1) * limit;

    const where = { userId: session.user.id };

    const [savedPosts, total] = await Promise.all([
      db.savedPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          post: {
            select: {
              id: true,
              content: true,
              images: true,
              checkInLocation: true,
              visibility: true,
              helpfulCount: true,
              notHelpfulCount: true,
              createdAt: true,
              updatedAt: true,
              repostOfId: true,
              author: { select: authorSelect },
              _count: { select: { comments: true } },
            },
          },
        },
      }),
      db.savedPost.count({ where }),
    ]);

    const posts = savedPosts
      .map((entry) => entry.post)
      .filter((post) => post !== null)
      .map((post) => ({
        ...post,
        isSaved: true,
        isFollowing: true,
        userReaction: null,
      }));

    return NextResponse.json({
      posts,
      total,
      page,
      limit,
      nextPage: skip + limit < total ? page + 1 : null,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/user/saved-posts]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
