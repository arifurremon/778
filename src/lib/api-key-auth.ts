import { db } from "@/lib/db";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const API_KEY_PREFIX = "tc_live_";
export const API_KEY_SCOPES = [
  "read:shops",
  "read:services",
  "read:directory",
  "read:orders",
  "write:orders",
  "write:webhooks",
  "read:webhooks",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export function generateApiKeyMaterial(): { rawKey: string; keyPrefix: string; hashedKey: string } {
  const secret = randomBytes(24).toString("base64url");
  const rawKey = `${API_KEY_PREFIX}${secret}`;
  const keyPrefix = rawKey.slice(0, 16);
  const hashedKey = hashApiKey(rawKey);
  return { rawKey, keyPrefix, hashedKey };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function parseBearerApiKey(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token.startsWith(API_KEY_PREFIX)) return null;
  return token;
}

export async function authenticateApiKey(rawKey: string) {
  const hashedKey = hashApiKey(rawKey);
  const record = await db.apiKey.findUnique({
    where: { hashedKey },
    select: {
      id: true,
      userId: true,
      scopes: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          deletedAt: true,
          suspendedAt: true,
        },
      },
    },
  });

  if (!record || record.revokedAt) return null;
  if (record.expiresAt && record.expiresAt < new Date()) return null;
  if (record.user.deletedAt || record.user.suspendedAt) return null;

  await db.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return record;
}

export function hasApiKeyScope(scopes: string[], required: ApiKeyScope): boolean {
  return scopes.includes(required) || scopes.includes("*");
}

export function safeCompareHashes(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
