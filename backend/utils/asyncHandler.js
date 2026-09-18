/**
 * Wraps an async Express controller, automatically catching thrown errors
 * and returning a 500 response. Eliminates try/catch boilerplate in controllers.
 *
 * @param {Function} fn - async controller function (req, res) => Promise<void>
 * @returns {Function} Express middleware
 */
export function asyncHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error(`[asyncHandler] ${fn.name || 'anonymous'}:`, error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}

/**
 * Maps a service result object to an HTTP response.
 * Passes the result through as-is to preserve existing response shapes.
 *
 * @param {object} res - Express response object
 * @param {object} result - Service result: { success, data?, error?, code?, ... }
 * @param {object} options
 * @param {number} options.successStatus - HTTP status on success (default 200)
 * @param {number} options.notFoundStatus - HTTP status when result.error includes 'not found' (default 404)
 */
export function sendResult(res, result, { successStatus = 200, notFoundStatus = 404 } = {}) {
  if (result.success) {
    return res.status(successStatus).json(result);
  }
  const isNotFound = result.error?.includes('not found') || result.code === 'NOT_FOUND';
  return res.status(isNotFound ? notFoundStatus : 400).json(result);
}
