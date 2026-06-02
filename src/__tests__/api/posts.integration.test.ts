/**
 * Integration Tests — GET/POST /api/posts
 *
 * Tests the posts API route handlers with a mocked Prisma client.
 * Verifies pagination, auth guards, validation, XSS sanitisation,
 * and rate-limiting behaviour.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testPosts, testUsers, validPostPayload } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

// Mock rate-limiter
vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => true),
  runRateLimit: vi.fn(
    (limiter: { limit: (key: string) => Promise<{ success: boolean }> }, key: string) =>
      limiter.limit(key)
  ),
  rateLimiters: {
    register: { limit: vi.fn().mockResolvedValue({ success: true }) },
    signin: { limit: vi.fn().mockResolvedValue({ success: true }) },
    posts: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

// Mock cache (bypass — always run the query function)
vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((_key: string, fn: () => Promise<any>) => fn()),
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth session — default: unauthenticated
const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock error handler
vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

// Import AFTER mocks
import { GET, POST } from "@/app/api/posts/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost:3000/api/posts");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { method: "GET" });
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "origin": "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

const sampleDbPost = {
  ...testPosts.publicPost,
  author: {
    id: testUsers.regular.id,
    name: testUsers.regular.name,
    preferredName: testUsers.regular.preferredName,
    profileImage: null,
    isVerified: false,
    isSeller: false,
    isServiceProvider: false,
    username: testUsers.regular.username,
  },
  _count: { comments: 0 },
} as any;

// ---------------------------------------------------------------------------

describe("GET /api/posts — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns paginated posts with default page=1, limit=10", async () => {
    prismaMock.post.findMany.mockResolvedValue([sampleDbPost]);
    prismaMock.post.count.mockResolvedValue(1);

    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.posts).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.nextPage).toBeNull();
  });

  it("returns nextPage when more results exist", async () => {
    prismaMock.post.findMany.mockResolvedValue([sampleDbPost]);
    prismaMock.post.count.mockResolvedValue(25);

    const res = await GET(makeGetRequest({ page: "1", limit: "10" }));
    const json = await res.json();

    expect(json.nextPage).toBe(2);
  });

  it("respects custom page and limit params", async () => {
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.post.count.mockResolvedValue(5);

    await GET(makeGetRequest({ page: "2", limit: "3" }));

    // Verify the ORM was called with correct skip/take
    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 3, // (2-1)*3
        take: 3,
      })
    );
  });

  it("clamps limit to a maximum of 50", async () => {
    prismaMock.post.findMany.mockResolvedValue([]);
    prismaMock.post.count.mockResolvedValue(0);

    await GET(makeGetRequest({ limit: "999" }));

    expect(prismaMock.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });
});

// ---------------------------------------------------------------------------

function mockActiveUser(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    isAdmin: false,
    deletedAt: null,
    suspendedAt: null,
  });
}

describe("POST /api/posts — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
  });

  it("returns 401 when user is unauthenticated", async () => {
    const res = await POST(makePostRequest(validPostPayload));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when content is missing", async () => {
    mockActiveUser(testUsers.regular.id);

    const res = await POST(makePostRequest({ images: [] }));
    const json = await res.json();

    expect(res.status).toBe(400);
    // Zod returns "Required" when the key is absent from the payload
    expect(json.error).toBeTruthy();
  });

  it("creates a post and returns 201 for authenticated user", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.post.create.mockResolvedValue(sampleDbPost);
    prismaMock.activityLog.create.mockResolvedValue({});

    const res = await POST(makePostRequest(validPostPayload));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.content).toBeDefined();
    expect(prismaMock.post.create).toHaveBeenCalledOnce();
    expect(prismaMock.activityLog.create).toHaveBeenCalledOnce();
  });

  it("sanitises XSS in post content before saving", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.post.create.mockResolvedValue(sampleDbPost);
    prismaMock.activityLog.create.mockResolvedValue({});

    await POST(
      makePostRequest({
        content: '<script>alert("XSS")</script><p>Safe content</p>',
      })
    );

    const createCall = prismaMock.post.create.mock.calls[0]?.[0];
    expect(createCall?.data.content).not.toContain("<script>");
    expect(createCall?.data.content).toContain("<p>Safe content</p>");
  });

  it("returns 429 when post rate limit is exceeded", async () => {
    mockActiveUser(testUsers.regular.id);

    const { rateLimiters } = await import("@/lib/rate-limit");
    (rateLimiters.posts.limit as any).mockResolvedValueOnce({ success: false });

    const res = await POST(makePostRequest(validPostPayload));
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toContain("Post limit reached");
  });

  it("rejects content exceeding 1000 characters", async () => {
    mockActiveUser(testUsers.regular.id);

    const longContent = "x".repeat(1001);
    const res = await POST(makePostRequest({ content: longContent }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("1000 characters");
  });
});
