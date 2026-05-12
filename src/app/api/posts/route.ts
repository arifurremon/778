import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrivacyLevel } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizePostContent } from "@/lib/sanitize";
import { cachedQuery } from "@/lib/cache";
import { rateLimiters } from "@/lib/rate-limit";

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

    const cacheKey = `posts:page:${page}:limit:${limit}`;

    const [posts, total] = await cachedQuery(
      cacheKey,
      async () => {
        return Promise.all([
          db.post.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
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
          db.post.count(),
        ]);
      },
      30 // Cache for 30 seconds
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

    // Create post + activity log sequentially (HTTP adapter doesn't support transactions)
    const post = await db.post.create({
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
    });

    await db.activityLog.create({
      data: {
        userId: authorId,
        type: "SYSTEM",
        description: "You created a new post.",
        contextUrl: "/community",
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/posts]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
