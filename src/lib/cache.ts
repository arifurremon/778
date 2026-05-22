// Fixed: 6 — Replaced unsupported KEYS command with tag-based cache tracking for Upstash Redis.
import { Redis } from '@upstash/redis';

const CACHE_TAG_GROUPS: Record<string, string> = {
  "posts:page:": "cache:tag:posts",
  // Add future groups here
};

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const client = getRedis();

  if (client) {
    try {
      const cached = await client.get<string>(key);
      if (cached !== null && cached !== undefined) {
        // Upstash may return a string or already-parsed object
        // Handle both cases safely:
        if (typeof cached === 'string') {
          try {
            return JSON.parse(cached) as T;
          } catch {
            return cached as unknown as T;
          }
        }
        return cached as unknown as T;
      }
    } catch {
      // Redis unavailable — fall through to database
    }
  }

  const fresh = await fetcher();

  if (client) {
    try {
      // Use client.set with ex option — more standard than setex
      await client.set(key, JSON.stringify(fresh), { ex: ttlSeconds });
    } catch {
      // Cache write failed — return fresh data anyway
    }

    const prefix = Object.keys(CACHE_TAG_GROUPS).find(p => key.startsWith(p));
    if (prefix) {
      const tagSetKey = CACHE_TAG_GROUPS[prefix];
      if (tagSetKey) {
        try {
          await client.sadd(tagSetKey, key);
        } catch { }
        
        try {
          await client.expire(tagSetKey, 3600);
        } catch { }
      }
    }
  }

  return fresh;
}

export async function invalidateCache(...patterns: string[]): Promise<void> {
  const client = getRedis();
  if (!client) return;

  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const parts = pattern.split('*');
      const basePrefix = parts[0];
      
      if (!basePrefix) continue;
      
      const tagSetKey = CACHE_TAG_GROUPS[basePrefix];
      
      if (tagSetKey) {
        let keys: string[] = [];
        try {
          keys = await client.smembers(tagSetKey);
        } catch { }
        
        if (keys.length > 0) {
          try {
            await client.del(...(keys as [string, ...string[]]));
          } catch { }
        }
        
        try {
          await client.del(tagSetKey);
        } catch { }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[Cache] Warning: Wildcard invalidation for pattern '${pattern}' skipped. Prefix '${basePrefix}' is not mapped in CACHE_TAG_GROUPS.`);
        }
      }
    } else {
      try {
        await client.del(pattern);
      } catch { }
    }
  }
}
