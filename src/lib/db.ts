// Fixed: 1 — Added security documentation to ensure no DB debug endpoints are ever created.
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

/**
 * SECURITY DIRECTIVE: No debug endpoint for DB connectivity should ever be created.
 * Exposing database configuration or connectivity status poses a critical security risk.
 * 
 * Edge-compatible Prisma Client Initialization.
 * We avoid using 'ws' in the Edge runtime.
 */
const getPrismaClient = () => {
  // The Neon Serverless driver handles connection pooling natively.
  // Using the pooled DATABASE_URL (-pooler) can cause deadlocks and timeouts.
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  // Detect runtime
  const isEdge = process.env.NEXT_RUNTIME === "edge";

  if (!connectionString) {
    // In Prisma 7, we must provide an options object.
    // If we reach here, we're likely in a build or environment without the URL.
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }

  const url = connectionString.replace(/&?channel_binding=require/g, "");

  if (!isEdge && typeof window === "undefined") {
    try {
      // Use require for Node.js runtime and handle default export
      const ws = require("ws");
      const WebSocket = ws.default || ws;
      if (WebSocket) {
        neonConfig.webSocketConstructor = WebSocket;
      }
    } catch (e) {
      console.error("[Prisma] Failed to load 'ws' for Neon adapter:", e);
    }
  }

  const adapter = new PrismaNeon({ connectionString: url });
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
