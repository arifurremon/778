import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";
import ws from "ws";

/**
 * Prisma client for Playwright global setup (Node only).
 * Uses the PG adapter for local/CI Postgres and Neon adapter for Neon URLs.
 */
export function createE2ePrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for E2E database setup");
  }

  const isLocalPostgres =
    /localhost|127\.0\.0\.1/.test(connectionString) &&
    !connectionString.includes("neon.tech");

  if (isLocalPostgres) {
    const pool = new Pool({ connectionString });
    return new PrismaClient({ adapter: new PrismaPg(pool) });
  }

  neonConfig.webSocketConstructor = ws;
  const url = connectionString.replace(/&?channel_binding=require/g, "");
  return new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
}
