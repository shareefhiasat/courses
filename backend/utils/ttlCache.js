/**
 * Generic in-memory TTL cache utility.
 *
 * Creates a named cache with a configurable TTL (time-to-live).
 * Entries expire lazily on read. Supports per-key and full invalidation.
 *
 * Usage:
 *   const cache = createTtlCache('programCounts', 60_000);
 *   cache.set(1, { classes: 5, subjects: 3 });
 *   cache.get(1);             // → { classes: 5, subjects: 3 }
 *   cache.invalidate(1);      // remove key 1
 *   cache.invalidate();       // clear all
 *   cache.getOrCompute(2, async () => fetchCounts(2));  // async compute on miss
 */

/**
 * @param {string} name - Cache name (for logging)
 * @param {number} ttlMs - TTL in milliseconds
 * @returns {{ get, set, invalidate, getOrCompute, size, has }}
 */
export function createTtlCache(name = 'cache', ttlMs = 60_000) {
  const store = new Map(); // key → { value, expiresAt }

  function get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key, value) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  function invalidate(key) {
    if (key === undefined || key === null) {
      const had = store.size > 0;
      store.clear();
      if (had) console.log(`[TTLCache:${name}] Cleared all entries`);
      return;
    }
    store.delete(key);
  }

  async function getOrCompute(key, computeFn) {
    const cached = get(key);
    if (cached !== undefined) return cached;
    const value = await computeFn();
    if (value !== undefined) set(key, value);
    return value;
  }

  function has(key) {
    return get(key) !== undefined;
  }

  function size() {
    return store.size;
  }

  return { get, set, invalidate, getOrCompute, has, size };
}
