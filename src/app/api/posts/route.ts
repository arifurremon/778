import { auth } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters } from "@/lib/rate-limit";
import { sanitizePostContent } from "@/lib/sanitize";
import { PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Opt this route out of Next.js Full Route Cache entirely.
// The community feed is real-time content — every request must hit the DB.
export const dynamic = "force-dynamic";

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
// GET /api/posts  — paginated feed (real-time, no cache)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10))
    );
    const skip = (page - 1) * limit;

    // Direct DB read — no Redis TTL layer for the community feed.
    //
    // Rationale: a 30s TTL was counter-productive: too short to yield
    // meaningful cache benefit (cold-start + round-trip overhead), yet
    // too long to feel live for a social feed. The Prisma $transaction
    // ensures the count and findMany observe the same DB snapshot,
    // preventing pagination corruption from concurrent inserts.
    const [posts, total] = await db.$transaction([
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

    const hasNextPage = skip + limit < total;

    return NextResponse.json(
      { posts, nextPage: hasNextPage ? page + 1 : null, total },
      {
        headers: {
          // Prevent CDNs and browsers from caching the feed response.
          // Each request must return a fresh snapshot from the DB.
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/posts]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    // Rate limiting: 10 posts per hour per user
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

    // Wrap post creation + activity log in a Prisma interactive transaction.
    // Both writes succeed or both roll back atomically — no orphaned posts
    // without audit records, and no orphaned audit records without posts.
    const [post] = await db.$transaction([
      db.post.create({
        data: { authorId, content, images, checkInLocation, visibility },
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

    // Advance the 'posts' cache epoch. This is a cheap O(1) Redis INCR
    // (~0.5 ms) that future-proofs this route: any route that later adds
    // cachedQuery() over post data will automatically receive invalidation
    // on every new post without further changes here.
    await invalidateCache("posts");

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/posts]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
