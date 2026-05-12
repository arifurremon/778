import { redis } from "./rate-limit";

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  // If Redis is not configured or available, fallback to direct query
  if (!redis) {
    return queryFn();
  }

  try {
    const cachedData = await redis.get<T>(key);
    if (cachedData) {
      return cachedData;
    }
  } catch (error) {
    console.error("[CACHE_GET_ERROR]", error);
  }

  const freshData = await queryFn();

  try {
    if (freshData) {
      await redis.set(key, freshData, { ex: ttlSeconds });
    }
  } catch (error) {
    console.error("[CACHE_SET_ERROR]", error);
  }

  return freshData;
}
