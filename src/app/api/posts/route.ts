import { validateCsrfRequest } from "@/lib/csrf";
import { auth } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters } from "@/lib/rate-limit";
import { sanitizePostContent } from "@/lib/sanitize";
import { ConnectionStatus, PrivacyLevel, Prisma } from "@prisma/client";
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
// resolveNeighborIds
//
// Fetches the set of user IDs that have an ACCEPTED NeighbourConnection with
// the given userId. Because NeighbourConnection is bidirectional (either party
// can initiate the request), we query BOTH sides of the relation and merge the
// results into a single deduplicated array.
//
// This query is O(N) on connections, which is appropriate for a hyperlocal
// platform where the expected neighbour count per user is small (< 500).
// ---------------------------------------------------------------------------
async function resolveNeighborIds(userId: string): Promise<string[]> {
  const connections = await db.neighbourConnection.findMany({
    where: {
      status: ConnectionStatus.ACCEPTED,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });

  // For each accepted connection, the neighbour is whichever side is NOT the
  // current user.
  const neighborIds = connections.map((c) =>
    c.senderId === userId ? c.receiverId : c.senderId
  );

  // Deduplicate defensively — the @@unique([senderId, receiverId]) constraint
  // on the model makes duplicates impossible in practice, but Set gives us a
  // clean guarantee regardless.
  return [...new Set(neighborIds)];
}

async function resolveBlockedIds(userId: string): Promise<string[]> {
  const blocks = await db.blockedUser.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  return blocks.map((b) => b.blockedId);
}

// ---------------------------------------------------------------------------
// buildFeedWhereClause
//
// Constructs a Prisma WhereInput that enforces the hybrid visibility rules:
//
//   Unauthenticated:
//     - Only PUBLIC posts are visible.
//
//   Authenticated:
//     - PUBLIC posts from anyone                       (openness)
//     - The user's own posts, regardless of visibility (self-authorship)
//     - NEIGHBOURS posts whose author is an accepted   (trust boundary)
//       neighbour of the requesting user
//
// The three arms are composed with OR, so a post is visible if it satisfies
// ANY one of them. PRIVATE posts authored by others are never included.
// ---------------------------------------------------------------------------
function buildFeedWhereClause(
  userId: string | null,
  neighborIds: string[],
  blockedIds: string[]
): Prisma.PostWhereInput {
  if (!userId) {
    return { visibility: PrivacyLevel.PUBLIC };
  }

  return {
    AND: [
      {
        OR: [
          // Arm 1 — public content from the entire community
          { visibility: PrivacyLevel.PUBLIC },
          // Arm 2 — the user's own posts (all visibility levels)
          { authorId: userId },
          // Arm 3 — neighbour-restricted posts from accepted connections
          ...(neighborIds.length > 0
            ? [
                {
                  visibility: PrivacyLevel.NEIGHBOURS,
                  authorId: { in: neighborIds },
                },
              ]
            : []),
        ],
      },
      ...(blockedIds.length > 0
        ? [{ NOT: { authorId: { in: blockedIds } } }]
        : []),
    ],
  };
}

// ---------------------------------------------------------------------------
// GET /api/posts  — paginated hybrid feed (real-time, no cache)
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

    // Resolve the requesting user's identity and neighbour graph.
    // For unauthenticated requests both values remain null / empty, and the
    // where clause degrades gracefully to PUBLIC-only.
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const neighborIds = userId ? await resolveNeighborIds(userId) : [];
    const blockedIds = userId ? await resolveBlockedIds(userId) : [];

    const where = buildFeedWhereClause(userId, neighborIds, blockedIds);

    // The Prisma $transaction ensures the count and findMany observe the
    // same DB snapshot, preventing pagination corruption from concurrent
    // inserts between the two queries.
    const [posts, total] = await db.$transaction([
      db.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        where,
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
      db.post.count({ where }),
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
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 10 posts per hour per user
    const result = await rateLimiters.posts.limit(session.user.id);
    if (!result.success) {
      const retryAfterSec = result.reset ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) : 3600;
      return NextResponse.json(
        { error: "Post limit reached. Please try again later." },
        { 
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) }
        }
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
