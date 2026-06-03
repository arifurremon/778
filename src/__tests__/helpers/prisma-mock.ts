/**
 * Prisma mock — provides a fully-mocked PrismaClient for integration tests.
 *
 * Every model method (findUnique, create, count, findMany, etc.) is a vi.fn()
 * that tests can configure per-scenario with mockResolvedValue / mockResolvedValueOnce.
 */
import { vi } from "vitest";

const createMockModel = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  upsert: vi.fn(),
  aggregate: vi.fn(),
});

export const prismaMock = {
  user: createMockModel(),
  post: createMockModel(),
  comment: createMockModel(),
  activityLog: createMockModel(),
  shop: createMockModel(),
  session: createMockModel(),
  account: createMockModel(),
  verificationToken: createMockModel(),
  neighbourConnection: createMockModel(),
  product: createMockModel(),
  savedPost: createMockModel(),
  followedPost: createMockModel(),
  emergencyContact: createMockModel(),
  directoryEntry: createMockModel(),
  featureSuggestion: createMockModel(),
  contactInquiry: createMockModel(),
  settings: createMockModel(),
  order: createMockModel(),
  productReview: createMockModel(),
  expertService: createMockModel(),
  serviceBooking: createMockModel(),
  notification: createMockModel(),
  auditLog: createMockModel(),
  $transaction: vi.fn((arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (client: typeof prismaMock) => Promise<unknown>)(prismaMock);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return Promise.resolve(arg);
  }),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// Auto-mock @/lib/db to return our prismaMock
vi.mock("@/lib/db", () => ({
  db: prismaMock,
}));

export function resetPrismaMock() {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === "function" && "mockReset" in model) {
      (model as any).mockReset();
      return;
    }

    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as any).mockReset();
        }
      });
    }
  });

  prismaMock.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (client: typeof prismaMock) => Promise<unknown>)(prismaMock);
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return Promise.resolve(arg);
  });
}
