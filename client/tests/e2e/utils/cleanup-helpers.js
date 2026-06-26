/**
 * Cleanup Helpers for E2E Tests
 * Provides API-based cleanup to remove test-created entities after tests run.
 * Uses the E2E prefix convention to identify and delete only test data.
 */
import { apiRequest } from './api-helpers.js';
import { testPrefix } from '../fixtures/test-data.js';

/**
 * Hard-delete all entities with the E2E prefix from a given endpoint.
 * Searches for entities where code/name/title contains the E2E prefix and deletes them.
 *
 * @param {string} endpoint - API endpoint e.g. '/programs', '/subjects'
 * @param {string} searchField - field to search for E2E prefix: 'code' | 'nameEn' | 'titleEn' | 'search'
 * @param {string} role - role to use for auth (default: superAdmin)
 * @returns {Promise<number>} number of entities deleted
 */
export async function cleanupByPrefix(endpoint, searchField = 'search', role = 'superAdmin') {
  let deleted = 0;
  try {
    // Search for E2E-prefixed entities
    const searchParam = searchField === 'search' ? `search=${testPrefix}` : `${searchField}=${testPrefix}`;
    const res = await apiRequest('GET', `${endpoint}?${searchParam}&limit=100`, { role });

    if (res.status !== 200 || !res.data?.data || !Array.isArray(res.data.data)) {
      return 0;
    }

    const entities = res.data.data;

    for (const entity of entities) {
      // Verify it has E2E in one of its identifier fields before deleting
      const idents = [
        entity.code, entity.nameEn, entity.titleEn, entity.name, entity.title,
        entity.reason, entity.content, entity.description,
      ].filter(Boolean);

      const isTestEntity = idents.some(v => String(v).includes(testPrefix));
      if (!isTestEntity) continue;

      const id = entity.id;
      if (!id) continue;

      // Try hard delete first, fall back to soft delete
      const hardRes = await apiRequest('DELETE', `${endpoint}/${id}/hard`, { role }).catch(() => null);
      if (hardRes && (hardRes.status === 200 || hardRes.status === 204)) {
        deleted++;
        continue;
      }
      const softRes = await apiRequest('DELETE', `${endpoint}/${id}`, { role }).catch(() => null);
      if (softRes && (softRes.status === 200 || softRes.status === 204)) {
        deleted++;
      }
    }
  } catch (err) {
    // Cleanup should never fail a test suite — just log
    console.warn(`[cleanup] Failed to clean ${endpoint}: ${err.message}`);
  }
  return deleted;
}

/**
 * Delete a specific entity by ID (hard delete).
 * @param {string} endpoint - API endpoint e.g. '/programs'
 * @param {number|string} id - entity ID
 * @param {string} role - auth role
 * @returns {Promise<boolean>} true if deleted
 */
export async function cleanupById(endpoint, id, role = 'superAdmin') {
  if (!id) return false;
  try {
    const hardRes = await apiRequest('DELETE', `${endpoint}/${id}/hard`, { role }).catch(() => null);
    if (hardRes && (hardRes.status === 200 || hardRes.status === 204)) return true;
    const softRes = await apiRequest('DELETE', `${endpoint}/${id}`, { role }).catch(() => null);
    return softRes && (softRes.status === 200 || softRes.status === 204);
  } catch {
    return false;
  }
}

/**
 * Clean up multiple endpoints — convenience wrapper.
 * @param {Array<{endpoint: string, searchField?: string}>} targets
 * @param {string} role
 * @returns {Promise<Object>} map of endpoint → deleted count
 */
export async function cleanupAll(targets, role = 'superAdmin') {
  const results = {};
  for (const { endpoint, searchField = 'search' } of targets) {
    results[endpoint] = await cleanupByPrefix(endpoint, searchField, role);
  }
  return results;
}

/**
 * Common cleanup targets for the LMS modules.
 * Call this in afterAll() to clean up all E2E test data across modules.
 */
export const COMMON_CLEANUP_TARGETS = [
  { endpoint: '/penalties', searchField: 'search' },
  { endpoint: '/activities', searchField: 'search' },
  { endpoint: '/programs', searchField: 'search' },
  { endpoint: '/subjects', searchField: 'search' },
  { endpoint: '/classes', searchField: 'search' },
  { endpoint: '/announcements', searchField: 'search' },
  { endpoint: '/quizzes', searchField: 'search' },
  { endpoint: '/enrollments', searchField: 'search' },
];
