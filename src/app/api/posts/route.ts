import { auth } from "@/lib/auth";
import { cachedQuery, invalidateCache } from "@/lib/cache";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters } from "@/lib/rate-limit";
import { sanitizePostContent } from "@/lib/sanitize";
import { PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared author select — used by both GET and POST
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /api/posts  — paginated feed
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const skip = (page - 1) * limit;

    // Key is the page/limit segment only; the namespace embeds the version.
    // Full resolved key example: posts:v3:page:1:limit:10
    const cacheKey = `page:${page}:limit:${limit}`;

    // Fix #6: wrap count + findMany in a Prisma transaction to guarantee
    // the two queries observe the same DB snapshot. This eliminates the
    // pagination corruption race where a concurrent INSERT between the two
    // queries causes total to be N+1 while posts only returns N items.
    const [posts, total] = await cachedQuery(
      cacheKey,
      async () => {
        return db.$transaction([
          db.post.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            where: { visibility: PrivacyLevel.PUBLIC },
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
              author: { select: authorSelect },
              _count: { select: { comments: true } },
            },
          }),
          db.post.count({ where: { visibility: PrivacyLevel.PUBLIC } }),
        ]);
      },
      30,
      'posts' // namespace — versioned key, epoch-safe invalidation
    );

    const hasNextPage = skip + limit < total;

    return NextResponse.json({
      posts,
      nextPage: hasNextPage ? page + 1 : null,
      total,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/posts]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/posts  — create a post (auth required)
// ---------------------------------------------------------------------------
const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty.")
    .max(1000, "Content cannot exceed 1000 characters."),
  images: z.array(z.string().url()).optional().default([]),
  checkInLocation: z.string().optional(),
  visibility: z.nativeEnum(PrivacyLevel).optional().default(PrivacyLevel.PUBLIC),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting (10 posts per hour per user)
    const { success } = await rateLimiters.posts.limit(session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Post limit reached. Please try again later." },
        { status: 429 }
      );
    }

    const body: unknown = await req.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    let { content, images, checkInLocation, visibility } = parsed.data;
    content = sanitizePostContent(content);
    const authorId = session.user.id;

    // Fix #14: wrap post creation + activity log in a Prisma interactive
    // transaction. Previously, if activityLog.create failed, the post would
    // exist in the DB with no corresponding audit record. Now both writes
    // succeed or both roll back atomically.
    const [post] = await db.$transaction([
      db.post.create({
        data: {
          authorId,
          content,
          images,
          checkInLocation,
          visibility,
        },
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
          author: { select: authorSelect },
          _count: { select: { comments: true } },
        },
      }),
      db.activityLog.create({
        data: {
          userId: authorId,
          type: "SYSTEM",
          description: "You created a new post.",
          contextUrl: "/community",
        },
      }),
    ]);

    // Epoch-safe invalidation: bumps posts:v counter in Redis (O(1)).
    // All page cache keys from the previous epoch are instantly orphaned.
    // Safe on cold Redis restart — INCR on a missing key initialises it to 1.
    await invalidateCache('posts');

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/posts]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
