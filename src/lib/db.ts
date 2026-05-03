import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

/**
 * Edge-compatible Prisma Client Initialization.
 * We avoid using 'ws' in the Edge runtime.
 */
const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return new PrismaClient();

  const url = connectionString.replace(/&?channel_binding=require/g, "");

  // Detect runtime
  const isEdge = process.env.NEXT_RUNTIME === "edge";

  if (!isEdge && typeof window === "undefined") {
    // We only set the WebSocket constructor in Node.js
    // We use a global check to avoid 'require' issues in some bundlers
    try {
      // @ts-ignore
      const ws = require("ws");
      neonConfig.webSocketConstructor = ws;
    } catch (e) {
      // ws not found or not supported
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
