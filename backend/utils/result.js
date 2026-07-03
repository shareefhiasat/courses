/**
 * Shared result helpers for service-layer return values.
 *
 * Every service in the backend returns a consistent envelope:
 *   - ok(payload)  → { success: true,  payload, timestamp }
 *   - err(code, msg) → { success: false, error: { code, message }, timestamp }
 *
 * Import these instead of redefining them in every service file.
 */

export const ok = (payload) => ({ success: true, payload, timestamp: Date.now() });

export const okData = (data) => ({ success: true, data, timestamp: Date.now() });

export const err = (code, message, extra = {}) => ({
  success: false,
  error: { code, message, ...extra },
  timestamp: Date.now(),
});
