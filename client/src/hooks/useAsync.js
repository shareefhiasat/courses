import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing async data fetching with loading/error/data state.
 * Eliminates repetitive useState + useEffect + useCallback boilerplate found
 * across drawer and tab components.
 *
 * @param {Function} asyncFn - async function that returns data (or { success, data, error })
 * @param {Array} deps - dependency array for re-fetching (same as useEffect deps)
 * @param {object} options
 * @param {boolean} options.immediate - if true (default), fetch on mount/deps change; if false, wait for manual `refetch`
 * @param {any} options.initialData - initial data value before first fetch completes
 * @returns {{ data, loading, error, refetch, setData }}
 *
 * @example
 * const { data, loading, error, refetch } = useAsync(
 *   () => api.get(`/subjects/${id}`),
 *   [id]
 * );
 */
export function useAsync(asyncFn, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);

  // Keep the latest asyncFn without triggering a re-fetch
  asyncFnRef.current = asyncFn;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFnRef.current();
      if (!mountedRef.current) return;

      // Support both raw data and { success, data, error } shapes
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Request failed');
        }
      } else {
        setData(result);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'An unexpected error occurred');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, immediate]);

  return { data, loading, error, refetch: execute, setData };
}
