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

/**
 * Retrieves the current epoch version for a cache namespace.
 * Returns 1 if Redis is unavailable or the key does not yet exist.
 * This is intentionally non-throwing — a missing version simply means
 * all reads are cache misses for that epoch, which is safe.
 */
async function getNamespaceVersion(
  client: Redis,
  namespace: string
): Promise<number> {
  try {
    const v = await client.get<number>(`${namespace}:v`);
    return v ?? 1;
  } catch {
    return 1;
  }
}

/**
 * Constructs a versioned cache key when a namespace is provided.
 * Example: namespace='posts', key='page:1:limit:10', version=3
 *   → 'posts:v3:page:1:limit:10'
 * Without a namespace the raw key is used as-is.
 */
function buildVersionedKey(
  key: string,
  namespace: string | undefined,
  version: number
): string {
  if (!namespace) return key;
  return `${namespace}:v${version}:${key}`;
}

/**
 * Execute a query with Redis caching.
 *
 * @param key       - The cache key segment (e.g. 'page:1:limit:10').
 * @param fetcher   - Async function that fetches fresh data from the source.
 * @param ttlSeconds - Cache TTL in seconds. Defaults to 300.
 * @param namespace  - Optional namespace (e.g. 'posts'). When provided, the
 *                     key is automatically versioned using the namespace epoch
 *                     counter. Invalidating the namespace increments the epoch,
 *                     instantly orphaning all keys from the previous epoch.
 *
 * Cache miss path: fetcher() is called, result is stored under the versioned
 * key, and the fresh value is returned.
 *
 * Redis unavailable: falls through to fetcher() transparently.
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300,
  namespace?: string
): Promise<T> {
  const client = getRedis();

  if (client) {
    try {
      const version = namespace
        ? await getNamespaceVersion(client, namespace)
        : 1;
      const versionedKey = buildVersionedKey(key, namespace, version);

      const cached = await client.get<string>(versionedKey);
      if (cached !== null && cached !== undefined) {
        if (typeof cached === 'string') {
          try {
            return JSON.parse(cached) as T;
          } catch {
            return cached as unknown as T;
          }
        }
        return cached as unknown as T;
      }

      // Cache miss — fetch, store, return
      const fresh = await fetcher();
      try {
        await client.set(versionedKey, JSON.stringify(fresh), { ex: ttlSeconds });
      } catch {
        // Cache write failure is non-fatal — return fresh data
      }
      return fresh;
    } catch {
      // Redis error — fall through to DB
    }
  }

  return fetcher();
}

/**
 * Invalidate one or more cache namespaces by bumping their epoch counters.
 *
 * How it works:
 *   INCR posts:v  →  3
 *
 * All keys written under epoch 2 (e.g. posts:v2:page:1:limit:10) will never
 * be read again. They expire naturally via their original TTL. Redis does not
 * need to enumerate or delete them.
 *
 * Resilience: If Redis has just restarted and posts:v does not exist, INCR
 * creates it with value 1. The next cachedQuery will read version 1 and
 * experience a cache miss, falling through to the DB. No stale data is ever
 * served, even on a cold Redis instance.
 *
 * @param namespaces - One or more namespace names (e.g. 'posts', 'users').
 */
export async function invalidateCache(...namespaces: string[]): Promise<void> {
  const client = getRedis();
  if (!client) return;

  await Promise.allSettled(
    namespaces.map(async (namespace) => {
      try {
        await client.incr(`${namespace}:v`);
      } catch {
        // Invalidation failure is logged but non-fatal.
        // The next request will still see stale data for up to ttlSeconds,
        // which is the same behaviour as before this fix.
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[Cache] Failed to invalidate namespace '${namespace}'. ` +
            `Stale data may be served for up to the configured TTL.`
          );
        }
      }
    })
  );
}
