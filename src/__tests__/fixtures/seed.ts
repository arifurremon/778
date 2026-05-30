/**
 * Test Fixtures — seed data and cleanup utilities.
 *
 * Because the production database uses Neon's serverless Postgres via the
 * PrismaNeon adapter, we do NOT spin up a real database in tests. Instead we
 * provide consistent fixture data that integration tests use when they mock
 * the Prisma client.
 */

import { hash } from "bcryptjs";

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------
export const TEST_PASSWORD_RAW = "secureP@ss123";
let cachedPasswordHash: string | null = null;

export async function getTestPasswordHash(): Promise<string> {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await hash(TEST_PASSWORD_RAW, 12);
  }
  return cachedPasswordHash;
}

// ---------------------------------------------------------------------------
// User fixtures
// ---------------------------------------------------------------------------
export const testUsers = {
  regular: {
    id: "user-test-001",
    email: "testuser@chattala.test",
    username: "testuser",
    password: null as string | null, // populated via getTestPasswordHash()
    name: "Test User",
    preferredName: "Test",
    mobile: "01712345678",
    location: "Khulshi",
    dob: "2000-01-01",
    joinDate: "January 2026",
    isAdmin: false,
    isVerified: false,
    isSeller: false,
    isServiceProvider: false,
    emailToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    emailTokenExp: new Date("2026-12-31T00:00:00Z"),
    registrationStatus: "NONE" as const,
    serviceRegistrationStatus: "NONE" as const,
    verificationRequestStatus: "NONE" as const,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },

  admin: {
    id: "user-admin-001",
    email: "admin@chattala.test",
    username: "admin_user",
    password: null as string | null,
    name: "Admin User",
    preferredName: "Admin",
    mobile: "01799887766",
    location: "Panchlaish",
    dob: "1995-06-15",
    joinDate: "December 2025",
    isAdmin: true,
    isVerified: true,
    isSeller: false,
    isServiceProvider: false,
    emailToken: null,
    emailTokenExp: null,
    registrationStatus: "NONE" as const,
    serviceRegistrationStatus: "NONE" as const,
    verificationRequestStatus: "NONE" as const,
    createdAt: new Date("2025-12-01T00:00:00Z"),
    updatedAt: new Date("2025-12-01T00:00:00Z"),
  },

  pendingVerification: {
    id: "user-pending-001",
    email: "pending@chattala.test",
    username: "pending_user",
    password: null as string | null,
    name: "Pending User",
    preferredName: "Pending",
    mobile: "01611223344",
    location: "Kotwali",
    dob: "1998-03-20",
    joinDate: "February 2026",
    isAdmin: false,
    isVerified: false,
    isSeller: false,
    isServiceProvider: false,
    emailToken: null,
    emailTokenExp: null,
    registrationStatus: "NONE" as const,
    serviceRegistrationStatus: "NONE" as const,
    verificationRequestStatus: "PENDING" as const,
    createdAt: new Date("2026-02-01T00:00:00Z"),
    updatedAt: new Date("2026-02-01T00:00:00Z"),
  },
};

// ---------------------------------------------------------------------------
// Post fixtures
// ---------------------------------------------------------------------------
export const testPosts = {
  publicPost: {
    id: "post-test-001",
    authorId: testUsers.regular.id,
    content: "Hello Chittagong! This is a public post.",
    images: [],
    checkInLocation: "Khulshi",
    visibility: "PUBLIC" as const,
    helpfulCount: 3,
    notHelpfulCount: 0,
    createdAt: new Date("2026-04-01T10:00:00Z"),
    updatedAt: new Date("2026-04-01T10:00:00Z"),
  },

  privatePost: {
    id: "post-test-002",
    authorId: testUsers.regular.id,
    content: "This is a private post.",
    images: [],
    checkInLocation: null,
    visibility: "PRIVATE" as const,
    helpfulCount: 0,
    notHelpfulCount: 0,
    createdAt: new Date("2026-04-02T12:00:00Z"),
    updatedAt: new Date("2026-04-02T12:00:00Z"),
  },

  neighboursPost: {
    id: "post-test-003",
    authorId: testUsers.admin.id,
    content: "Admin announcement for neighbours only.",
    images: [],
    checkInLocation: "Panchlaish",
    visibility: "NEIGHBOURS" as const,
    helpfulCount: 10,
    notHelpfulCount: 1,
    createdAt: new Date("2026-04-03T08:00:00Z"),
    updatedAt: new Date("2026-04-03T08:00:00Z"),
  },
};

// ---------------------------------------------------------------------------
// Registration payload helpers
// ---------------------------------------------------------------------------
export const validRegistrationPayload = {
  email: "newuser@chattala.test",
  password: "newPassword123",
  username: "new_user",
  name: "New User",
  preferredName: "Newbie",
  mobile: "01812345678",
  location: "Chandgaon",
  dob: "2001-05-15",
};

export const validPostPayload = {
  content: "Just visited the new waterfront park in Patenga!",
  images: [],
  checkInLocation: "Patenga",
  visibility: "PUBLIC",
};

// ---------------------------------------------------------------------------
// Cleanup utility (for real DB integration — not used in mock mode)
// ---------------------------------------------------------------------------
export async function cleanupTestDB(prisma: any): Promise<void> {
  const testEmails = Object.values(testUsers).map((u) => u.email);
  testEmails.push(validRegistrationPayload.email);

  // Delete in dependency order
  await prisma.activityLog.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.comment.deleteMany({
    where: { author: { email: { in: testEmails } } },
  });
  await prisma.post.deleteMany({
    where: { author: { email: { in: testEmails } } },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.account.deleteMany({
    where: { user: { email: { in: testEmails } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });
}
