/**
 * Utility for handling API result objects in frontend components.
 * Works with the standard { success, data, error } response shape.
 *
 * @example
 * import { handleResult } from '../utils/handleResult.js';
 *
 * const result = await api.updateSubject(id, data);
 * const { data, error } = handleResult(result);
 * if (error) {
 *   setErrors({ submit: error });
 * } else {
 *   onSaved(data);
 * }
 */

/**
 * Extracts data or error from a standard API result object.
 * Also handles axios error responses ({ response: { data: { ... } } }).
 *
 * @param {object} result - API response or axios error
 * @returns {{ data: any|null, error: string|null, success: boolean }}
 */
export function handleResult(result) {
  // Handle axios error responses
  if (result?.response?.data) {
    const { data: errorData } = result.response;
    return {
      data: errorData.data || null,
      error: errorData.error || errorData.message || 'Request failed',
      success: false,
    };
  }

  // Handle standard { success, data, error } shape
  if (result && typeof result === 'object' && 'success' in result) {
    return {
      data: result.data || null,
      error: result.error || null,
      success: result.success,
    };
  }

  // Handle raw data (no success field — assume success)
  return {
    data: result,
    error: null,
    success: true,
  };
}
