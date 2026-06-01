import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

function parseEnv(): ServerEnv {
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Validates required production environment variables at startup.
 * Skips strict checks during `next build` when DATABASE_URL may be absent.
 */
export function validateServerEnv(): void {
  const env = parseEnv();
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";

  if (env.NODE_ENV !== "production" || isBuild) {
    return;
  }

  const missing: string[] = [];
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!env.AUTH_SECRET) missing.push("AUTH_SECRET");
  if (!env.NEXT_PUBLIC_APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    missing.push("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${[...new Set(missing)].join(", ")}`
    );
  }
}
