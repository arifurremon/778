import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { recordDbQueryMetric } from "@/lib/observability/metrics";
import ws from "ws";

/**
 * SECURITY DIRECTIVE: No debug endpoint for DB connectivity should ever
 * be created. Exposing database configuration or connectivity status
 * poses a critical security risk.
 *
 * This module is Node.js-only. It must never be imported by middleware
 * or any route segment declared with `export const runtime = 'edge'`.
 * next.config.ts declares 'ws' and '@neondatabase/serverless' in
 * serverExternalPackages to enforce this boundary at the bundler level.
 */

/**
 * Set the WebSocket constructor at module scope, synchronously, before
 * any PrismaNeon adapter or PrismaClient is instantiated.
 *
 * This is the correct pattern per @neondatabase/serverless documentation.
 * A top-level ESM import guarantees the constructor is always set,
 * unlike a dynamic require() inside a try/catch which can silently no-op.
 *
 * The 'ws' package is a Node.js external (serverExternalPackages in
 * next.config.ts) and is never bundled into Edge or client chunks.
 */
neonConfig.webSocketConstructor = ws;

const getPrismaClient = (): PrismaClient => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // No DATABASE_URL — typically during build-time static analysis.
    // Return a baseline client; queries will fail at runtime without the URL.
    return new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }

  // Strip the channel_binding parameter that some Neon connection strings
  // include — it is not supported by the serverless WebSocket driver.
  const url = connectionString.replace(/&?channel_binding=require/g, "");

  const adapter = new PrismaNeon({ connectionString: url });
  return new PrismaClient({ adapter });
};

/**
 * Global singleton pattern for the Prisma client.
 *
 * In development, Next.js hot-reloads invalidate module caches on every
 * file change. Without a global singleton, each reload creates a new
 * PrismaClient instance, quickly exhausting the Neon connection pool.
 * We attach the client to `globalThis` in non-production environments
 * so it survives hot-reloads.
 *
 * In production (Vercel serverless), each function invocation starts with
 * a fresh module load. The singleton is only meaningful within a single
 * warm instance, but it is still correct — it prevents double-init within
 * the same invocation.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedPrismaClient> | undefined;
};

function createExtendedPrismaClient() {
  const client = getPrismaClient();

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const started = performance.now();
          try {
            const result = await query(args);
            recordDbQueryMetric({
              model,
              operation,
              durationMs: Math.round(performance.now() - started),
              success: true,
            });
            return result;
          } catch (error) {
            recordDbQueryMetric({
              model,
              operation,
              durationMs: Math.round(performance.now() - started),
              success: false,
            });
            throw error;
          }
        },
      },
    },
  });
}

export const db = globalForPrisma.prisma ?? createExtendedPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
