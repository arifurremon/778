import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";

// Load environment variables for non-Next.js environments (like CLI or scripts)
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
}

// Enable WebSocket for Node.js runtime
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is not set. Creating PrismaClient without adapter.");
    return new PrismaClient();
  }

  // Strip channel_binding=require — unsupported by @neondatabase/serverless Pool
  const url = connectionString.replace(/&?channel_binding=require/g, "");
  const adapter = new PrismaNeon({ connectionString: url });
  
  return new PrismaClient({ adapter });
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
