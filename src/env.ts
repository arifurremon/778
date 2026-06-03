import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");

/** Parsed at runtime in all environments (optional fields allowed outside production). */
const runtimeEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

/** Required when NODE_ENV=production at runtime (not during `next build`). */
export const productionRequiredEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
});

export type ServerEnv = z.infer<typeof runtimeEnvSchema>;

function readProcessEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

function formatProductionEnvError(error: z.ZodError): string {
  const fields = [
    ...new Set(error.errors.map((issue) => issue.path[0]).filter(Boolean)),
  ] as string[];
  return `Missing required production environment variables: ${fields.join(", ")}`;
}

/**
 * Validates required production environment variables at startup.
 * Skips strict checks during `next build` when DATABASE_URL may be absent.
 */
export function validateServerEnv(): void {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv !== "production" || isBuild) {
    return;
  }

  const productionCheck = productionRequiredEnvSchema.safeParse(readProcessEnv());
  if (!productionCheck.success) {
    throw new Error(formatProductionEnvError(productionCheck.error));
  }
}
