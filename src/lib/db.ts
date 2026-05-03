import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Enable WebSocket for Node.js runtime (not needed in Edge runtime)
neonConfig.webSocketConstructor = ws;

declare global {
  // eslint-disable-next-line no-var
  var __prismaPool: PrismaClient | undefined;
}

export function getDb(): PrismaClient {
  if (global.__prismaPool) return global.__prismaPool;

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL is not set.");

  // Strip channel_binding=require — unsupported by @neondatabase/serverless Pool
  const url = rawUrl.replace(/&?channel_binding=require/g, "");

  // PrismaNeon creates its own Pool internally; pass the config object directly
  const adapter = new PrismaNeon({ connectionString: url });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") global.__prismaPool = client;
  return client;
}

// Convenience alias — every property accessor defers to getDb() so the
// client is only constructed after Next.js has loaded .env.local.
export const db = {
  get user() { return getDb().user; },
  get post() { return getDb().post; },
  get comment() { return getDb().comment; },
  get activityLog() { return getDb().activityLog; },
  get shop() { return getDb().shop; },
  get product() { return getDb().product; },
  get expertService() { return getDb().expertService; },
  get neighbourConnection() { return getDb().neighbourConnection; },
};






