/**
 * AI Precomputed Data Cache
 *
 * Precomputes common AI assistant metrics into Redis on a schedule so the
 * rule-based fast path can return answers in milliseconds.
 *
 * All computation runs under a synthetic super-admin request so the cache is
 * scoped to the global / class / program level and can be safely reused by
 * users who have access to that same exact scope.
 */

import prisma from '../db/prismaClient.js';
import { getCachedMetric, setCachedMetric } from './cache.js';
import { getTool } from './tools/index.js';
import { getRequestScope } from './scope.js';
import { extractDateRange } from './parser.js';

const AI_CACHE_REFRESH_SECONDS = parseInt(process.env.AI_CACHE_REFRESH_SECONDS || '60', 10);
const AI_METRIC_CACHE_TTL_SECONDS = parseInt(process.env.AI_METRIC_CACHE_TTL_SECONDS || process.env.AI_CACHE_TTL_SECONDS || '300', 10);

// Synthetic admin request for the warm-up worker.
const ADMIN_REQ = { user: { id: 'warmup', dbId: null, roles: ['super-admin'] } };

/**
 * Metrics to precompute.
 * - `tool`: toolRegistry key
 * - `scopeTypes`: which scope granularities to warm up (`global`, `class`, `program`)
 * - `variations`: array of param objects to precompute for each scope
 * - `excludeFromWarmup`: do not precompute on schedule (e.g. quiz / assignment)
 *
 * `variations` should list the date / type dimensions that actually change the
 * tool output. classId / programId are added separately by the worker.
 */
export const METRIC_CONFIG = [
  // Attendance
  {
    tool: 'attendanceSummary',
    scopeTypes: ['global', 'class'],
    variations: [
      { dateRange: 'today' },
      { dateRange: 'yesterday' },
      { dateRange: 'this_week' },
      { dateRange: 'last_week' },
      { dateRange: 'this_month' },
      { dateRange: 'last_month' },
    ],
  },
  {
    tool: 'standupAttendance',
    scopeTypes: ['global', 'class'],
    variations: [
      { dateRange: 'today' },
      { dateRange: 'this_week' },
      { dateRange: 'this_month' },
    ],
  },
  {
    tool: 'lateCount',
    scopeTypes: ['global', 'class'],
    variations: [
      { dateRange: 'today' },
      { dateRange: 'this_week' },
      { dateRange: 'this_month' },
    ],
  },
  {
    tool: 'humanCaseCount',
    scopeTypes: ['global', 'class'],
    variations: [
      { dateRange: 'today' },
      { dateRange: 'this_week' },
      { dateRange: 'this_month' },
    ],
  },
  {
    tool: 'attendanceTypes',
    scopeTypes: ['global', 'class'],
    variations: [{ dateRange: 'this_month' }],
  },

  // Counts / lists
  {
    tool: 'studentCount',
    scopeTypes: ['global', 'class', 'program'],
    variations: [{}],
  },
  {
    tool: 'classCount',
    scopeTypes: ['global', 'program'],
    variations: [{}],
  },
  {
    tool: 'programInfo',
    scopeTypes: ['global'],
    variations: [{}],
  },
  {
    tool: 'subjectInfo',
    scopeTypes: ['global', 'program'],
    variations: [{}],
  },
  {
    tool: 'enrollmentInfo',
    scopeTypes: ['global', 'class'],
    variations: [{}],
  },
  {
    tool: 'classroomInfo',
    scopeTypes: ['global'],
    variations: [{}],
  },

  // Conduct / discipline
  {
    tool: 'absenceWarningCounts',
    scopeTypes: ['global', 'class', 'program'],
    variations: [
      { warningType: 'all' },
      { warningType: 'first' },
      { warningType: 'final' },
    ],
  },
  {
    tool: 'penaltySummary',
    scopeTypes: ['global', 'class', 'program'],
    variations: [{}],
  },
  {
    tool: 'behaviorSummary',
    scopeTypes: ['global', 'class', 'program'],
    variations: [{}],
  },
  {
    tool: 'participationSummary',
    scopeTypes: ['global', 'class', 'program'],
    variations: [{}],
  },
  {
    tool: 'topAbsenceStudent',
    scopeTypes: ['global', 'class', 'program'],
    variations: [
      { dateRange: 'this_month' },
      { dateRange: 'last_month' },
    ],
  },

  // Notes / comments / workflows
  {
    tool: 'notesAndComments',
    scopeTypes: ['global', 'class'],
    variations: [
      { dateRange: 'today' },
      { dateRange: 'this_week' },
      { dateRange: 'this_month' },
    ],
  },
  {
    tool: 'workflowSummary',
    scopeTypes: ['global', 'class', 'program'],
    variations: [{}],
  },

  // Schedule / calendar / sessions / breaks
  {
    tool: 'scheduleSummary',
    scopeTypes: ['global', 'class'],
    variations: [
      { dateRange: 'today' },
      { dateRange: 'this_week' },
      { dateRange: 'this_month' },
    ],
  },
  {
    tool: 'sessionSummary',
    scopeTypes: ['global', 'class'],
    variations: [
      { dateRange: 'today' },
      { dateRange: 'this_week' },
      { dateRange: 'this_month' },
    ],
  },
  {
    tool: 'breakSessionSummary',
    scopeTypes: ['global', 'class'],
    variations: [
      { dateRange: 'today' },
      { dateRange: 'this_week' },
      { dateRange: 'this_month' },
    ],
  },
  {
    tool: 'academicClosureInfo',
    scopeTypes: ['global'],
    variations: [{}],
  },
  {
    tool: 'holidayInfo',
    scopeTypes: ['global'],
    variations: [{}],
  },
  {
    tool: 'activityInfo',
    scopeTypes: ['global', 'class'],
    variations: [{}],
  },
  {
    tool: 'announcementInfo',
    scopeTypes: ['global'],
    variations: [{}],
  },
  {
    tool: 'exportHistory',
    scopeTypes: ['global'],
    variations: [{}],
  },

  // Excluded from initial warm-up per user request
  { tool: 'quizSummary', excludeFromWarmup: true },
  { tool: 'submissionSummary', excludeFromWarmup: true },

  // Marks / distribution — precomputed only at global/class level to limit load
  { tool: 'marksSummary', scopeTypes: ['global', 'class'], variations: [{}] },
  { tool: 'marksDistribution', scopeTypes: ['global', 'class'], variations: [{}] },
];

/**
 * Resolve the cache scope key from request + parsed params.
 * Returns null if the user cannot access the requested scope.
 */
export async function resolveScopeKey(req, params = {}) {
  const scope = await getRequestScope(req);

  if (params.classId) {
    const id = Number(params.classId);
    if (scope.unrestricted || (scope.classIds || []).includes(id)) {
      return `class:${id}`;
    }
    return null;
  }

  if (params.programId) {
    const id = Number(params.programId);
    if (scope.unrestricted || (scope.programIds || []).includes(id)) {
      return `program:${id}`;
    }
    return null;
  }

  if (scope.unrestricted) {
    return 'global';
  }

  // Restricted user without a specific class/program cannot use shared global cache.
  return null;
}

/**
 * Lookup a precomputed metric for this user + params.
 */
export async function getCachedAnswerData(req, toolName, params = {}) {
  const scopeKey = await resolveScopeKey(req, params);
  if (!scopeKey) return null;
  const cached = await getCachedMetric(toolName, params, scopeKey);
  if (!cached) return null;
  return {
    data: cached.data,
    cachedAt: cached.cachedAt,
    fromCache: true,
  };
}

/**
 * Store a live-computed metric result in the cache.
 * Safe to call for a restricted user because the data is already scoped.
 */
export async function setCachedAnswerData(req, toolName, params = {}, data, ttlSeconds = AI_METRIC_CACHE_TTL_SECONDS) {
  const scopeKey = await resolveScopeKey(req, params);
  if (!scopeKey) return;
  await setCachedMetric(toolName, params, scopeKey, data, ttlSeconds);
}

/**
 * Execute a tool under the warm-up admin request.
 */
async function executeToolAsAdmin(toolName, params = {}) {
  const tool = getTool(toolName);
  if (!tool) {
    console.warn('[AI Data Cache] Tool not found:', toolName);
    return null;
  }
  try {
    const result = await tool.execute(ADMIN_REQ, params);
    if (result && result.success) {
      return result.data;
    }
    console.warn('[AI Data Cache] Tool failed:', toolName, result?.error);
    return null;
  } catch (err) {
    console.warn('[AI Data Cache] Tool error:', toolName, err.message);
    return null;
  }
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function runWithConcurrency(tasks, limit) {
  for (const batch of chunk(tasks, limit)) {
    await Promise.all(batch.map((fn) => fn()));
  }
}

/**
 * Precompute and store a metric for the given scope.
 */
async function precomputeAndCache(toolName, scopeType, scopeId, params = {}) {
  const scopeKey = scopeType === 'global' ? 'global' : `${scopeType}:${scopeId}`;
  const scopedParams = { ...params };
  if (scopeType === 'class') scopedParams.classId = scopeId;
  if (scopeType === 'program') scopedParams.programId = scopeId;

  // Resolve dateRange string keys (e.g. "this_month") into concrete dateFrom/dateTo
  // so the tools actually filter by date and the cache key is stable.
  if (scopedParams.dateRange) {
    const phrase = String(scopedParams.dateRange).replace(/_/g, ' ');
    const range = extractDateRange(phrase);
    if (range) {
      scopedParams.dateFrom = range.dateFrom;
      scopedParams.dateTo = range.dateTo;
      scopedParams.labelEn = range.labelEn;
      scopedParams.labelAr = range.labelAr;
    }
  }

  const data = await executeToolAsAdmin(toolName, scopedParams);
  if (data !== null) {
    await setCachedMetric(toolName, scopedParams, scopeKey, data, AI_METRIC_CACHE_TTL_SECONDS);
  }
}

/**
 * Precompute all configured metrics.
 */
export async function warmupAllMetrics() {
  const startedAt = Date.now();
  console.log('[AI Data Cache] Starting metric warm-up...');

  const [classes, programs] = await Promise.all([
    prisma.class.findMany({
      where: { isActive: true },
      select: { id: true, programId: true },
    }),
    prisma.program.findMany({
      where: { isActive: true },
      select: { id: true },
    }),
  ]);

  const classIds = classes.map((c) => c.id);
  const programIds = programs.map((p) => p.id);

  const tasks = [];

  for (const metric of METRIC_CONFIG) {
    if (metric.excludeFromWarmup) continue;

    const tool = getTool(metric.tool);
    if (!tool) {
      console.warn('[AI Data Cache] Skipping unknown tool in config:', metric.tool);
      continue;
    }

    const variations = metric.variations || [{}];
    const scopeTypes = metric.scopeTypes || ['global'];

    for (const variation of variations) {
      for (const scopeType of scopeTypes) {
        if (scopeType === 'global') {
          tasks.push(() => precomputeAndCache(metric.tool, 'global', null, variation));
        } else if (scopeType === 'class') {
          for (const id of classIds) {
            tasks.push(() => precomputeAndCache(metric.tool, 'class', id, variation));
          }
        } else if (scopeType === 'program') {
          for (const id of programIds) {
            tasks.push(() => precomputeAndCache(metric.tool, 'program', id, variation));
          }
        }
      }
    }
  }

  // Limit concurrency to avoid overwhelming the DB / Redis.
  const concurrency = 10;
  await runWithConcurrency(tasks, concurrency);

  console.log('[AI Data Cache] Warm-up complete in', Date.now() - startedAt, 'ms for', tasks.length, 'entries');
}

export default {
  METRIC_CONFIG,
  warmupAllMetrics,
  getCachedAnswerData,
  setCachedAnswerData,
  resolveScopeKey,
};
