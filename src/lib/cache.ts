type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

// Simple in-memory TTL cache that survives hot reloads in dev via globalThis
const globalCache = (globalThis as any).__GITRANKS_CACHE__ || new Map<string, CacheEntry<any>>();
(globalThis as any).__GITRANKS_CACHE__ = globalCache;

export function cacheGet<T>(key: string): T | undefined {
  const entry = globalCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    globalCache.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  globalCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function cacheGetOrSet<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== undefined) return cached;
  const fresh = await fetcher();
  cacheSet<T>(key, fresh, ttlMs);
  return fresh;
}


