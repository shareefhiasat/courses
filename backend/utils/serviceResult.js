/**
 * Wraps a service function's thrown errors into a consistent { success: false, error } shape.
 * Eliminates try/catch boilerplate in service files.
 *
 * Usage:
 *   export const getSubjects = serviceResult(async (params) => {
 *     const data = await db.getSubjects(params);
 *     return { success: true, data };
 *   });
 *
 * @param {Function} fn - async service function
 * @returns {Function} wrapped function that never throws, always returns { success, ... }
 */
export function serviceResult(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[serviceResult] ${fn.name || 'anonymous'}:`, error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };
}
