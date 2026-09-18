/**
 * AI Query Cache (Redis)
 *
 * Caches LLM-generated answers by normalized question hash.
 * Uses Redis with TTL to avoid stale data.
 * Falls back gracefully (no caching) if Redis is unavailable.
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || `redis://:${process.env.REDIS_PASSWORD || 'redis123'}@localhost:6379`;
const CACHE_TTL_SECONDS = parseInt(process.env.AI_CACHE_TTL_SECONDS || '300', 10); // 5 min default
const CACHE_PREFIX = 'ai:qa:';

let client = null;
let connectionFailed = false;

/**
 * Get or create Redis client (singleton).
 * Returns null if Redis is unavailable.
 */
function getClient() {
  if (connectionFailed) return null;
  if (client) return client;

  try {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 2) {
          connectionFailed = true;
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    client.on('error', (err) => {
      if (!connectionFailed) {
        console.warn('[AI Cache] Redis error:', err.message);
      }
    });

    client.on('connect', () => {
      console.log('[AI Cache] Redis connected');
      connectionFailed = false;
    });

    return client;
  } catch (err) {
    console.warn('[AI Cache] Redis init failed:', err.message);
    connectionFailed = true;
    return null;
  }
}

/**
 * Normalize a question string for cache key generation.
 * Lowercases, trims, collapses whitespace, removes diacritics for Arabic.
 */
export function normalizeQuestion(question) {
  if (!question) return '';
  let s = question.trim().toLowerCase();
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ');
  // Normalize Arabic: remove diacritics, normalize hamzas and taa marbuta
  s = s
    .replace(/[\u064B-\u065F\u0670]/g, '') // diacritics
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه');
  return s;
}

/**
 * Generate a stable cache key from question + user scope.
 */
function cacheKey(question, scopeKey = 'global') {
  const normalized = normalizeQuestion(question);
  // Simple hash (djb2) to keep keys short
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(i)) & 0x7fffffff;
  }
  return `${CACHE_PREFIX}${scopeKey}:${hash}`;
}

/**
 * Get a cached answer.
 * Returns null if cache miss or Redis unavailable.
 */
export async function getCachedAnswer(question, scopeKey = 'global') {
  const redis = getClient();
  if (!redis) return null;

  try {
    const key = cacheKey(question, scopeKey);
    const cached = await redis.get(key);
    if (cached) {
      console.log('[AI Cache] Hit for key:', key);
      return JSON.parse(cached);
    }
    return null;
  } catch (err) {
    console.warn('[AI Cache] Get failed:', err.message);
    return null;
  }
}

/**
 * Store an answer in cache with TTL.
 */
export async function setCachedAnswer(question, answer, scopeKey = 'global', ttlSeconds = CACHE_TTL_SECONDS) {
  const redis = getClient();
  if (!redis) return;

  try {
    const key = cacheKey(question, scopeKey);
    await redis.setex(key, ttlSeconds, JSON.stringify(answer));
    console.log('[AI Cache] Stored key:', key, 'TTL:', ttlSeconds);
  } catch (err) {
    console.warn('[AI Cache] Set failed:', err.message);
  }
}

/**
 * Invalidate all AI cache entries (e.g., after data changes).
 */
export async function invalidateCache() {
  const redis = getClient();
  if (!redis) return 0;

  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log('[AI Cache] Invalidated', keys.length, 'entries');
    }
    return keys.length;
  } catch (err) {
    console.warn('[AI Cache] Invalidation failed:', err.message);
    return 0;
  }
}

/**
 * Invalidate precomputed metric cache entries (ai:metric:*).
 */
export async function invalidateMetricCache(pattern = 'ai:metric:*') {
  const redis = getClient();
  if (!redis) return 0;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log('[AI Metric Cache] Invalidated', keys.length, 'entries');
      return keys.length;
    }
    return 0;
  } catch (err) {
    console.warn('[AI Metric Cache] Invalidation failed:', err.message);
    return 0;
  }
}

/**
 * Invalidate all AI caches (answers + metrics).
 */
export async function invalidateAllAiCache() {
  const answerCount = await invalidateCache();
  const metricCount = await invalidateMetricCache();
  console.log('[AI Cache] Total invalidated:', answerCount, 'answers +', metricCount, 'metrics');
  return { answers: answerCount, metrics: metricCount };
}

/**
 * Check if Redis is connected and working.
 */
export async function isCacheAvailable() {
  const redis = getClient();
  if (!redis) return false;
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

const METRIC_CACHE_PREFIX = 'ai:metric:';

/**
 * Build a stable cache key for a tool result.
 * Scope is kept separate from params (classId/programId are not in the param hash).
 */
export function buildMetricCacheKey(toolName, params = {}, scopeKey = 'global') {
  const relevant = {};
  if (params && typeof params === 'object') {
    for (const key of Object.keys(params).sort()) {
      if (key === 'classId' || key === 'programId' || key === 'className' || key === 'programName') continue;
      const value = params[key];
      if (value !== undefined && value !== null) {
        relevant[key] = value;
      }
    }
  }
  const paramPart = JSON.stringify(relevant);
  let hash = 5381;
  for (let i = 0; i < paramPart.length; i++) {
    hash = ((hash << 5) + hash + paramPart.charCodeAt(i)) & 0x7fffffff;
  }
  return `${METRIC_CACHE_PREFIX}${scopeKey}:${toolName}:${hash}`;
}

/**
 * Get a precomputed metric result.
 */
export async function getCachedMetric(toolName, params = {}, scopeKey = 'global') {
  const redis = getClient();
  if (!redis) return null;

  try {
    const key = buildMetricCacheKey(toolName, params, scopeKey);
    const cached = await redis.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        data: parsed.data,
        cachedAt: parsed.cachedAt,
        key,
      };
    }
    return null;
  } catch (err) {
    console.warn('[AI Metric Cache] Get failed:', err.message);
    return null;
  }
}

/**
 * Store a precomputed metric result.
 */
export async function setCachedMetric(toolName, params = {}, scopeKey = 'global', data, ttlSeconds = CACHE_TTL_SECONDS) {
  const redis = getClient();
  if (!redis) return;

  try {
    const key = buildMetricCacheKey(toolName, params, scopeKey);
    const payload = JSON.stringify({
      data,
      cachedAt: new Date().toISOString(),
    });
    await redis.setex(key, ttlSeconds, payload);
  } catch (err) {
    console.warn('[AI Metric Cache] Set failed:', err.message);
  }
}

export default {
  getCachedAnswer,
  setCachedAnswer,
  invalidateCache,
  isCacheAvailable,
  normalizeQuestion,
  getCachedMetric,
  setCachedMetric,
  buildMetricCacheKey,
  invalidateMetricCache,
  invalidateAllAiCache,
};
