import { Redis } from '@upstash/redis';

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
  }

  return fresh;
}

export async function invalidateCache(...patterns: string[]): Promise<void> {
  const client = getRedis();
  if (!client) return;

  for (const pattern of patterns) {
    try {
      if (pattern.includes('*')) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...(keys as [string, ...string[]]));
        }
      } else {
        await client.del(pattern);
      }
    } catch {
      // Ignore cache invalidation failures
    }
  }
}
