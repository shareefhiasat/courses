/**
 * Send a safe 500 error response without leaking internal error details.
 *
 * Logs the real error server-side (for debugging) but returns a generic
 * "Internal server error" message to the client. Prevents information
 * exposure of stack traces, SQL errors, file paths, etc.
 *
 * @param {import('express').Response} res
 * @param {string} label - Context label for server-side logging (e.g. 'listUsersController')
 * @param {Error|unknown} error - The caught error
 * @param {number} [status=500] - HTTP status code
 */
export function sendError(res, label, error, status = 500) {
  console.error(`[${label}]`, error);
  return res.status(status).json({
    success: false,
    error: 'Internal server error',
  });
}

export default sendError;
