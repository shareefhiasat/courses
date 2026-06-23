import { useState, useEffect, useCallback } from 'react';
import dashboardAnalyticsService from '@services/dashboardAnalyticsService';
import { useAuth } from '@contexts/AuthContext';
import { info, error } from '@services/utils/logger.js';

/**
 * Hook to fetch dashboard analytics (drive, workflow, activity metrics).
 * Role-based: HR/Super Admin see all, Admin/Instructor see own data only.
 */
export default function useDashboardAnalytics(classId = null) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardAnalyticsService.getAnalytics({ classId });
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      error('[useDashboardAnalytics] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  return { data, loading, error, reload: load };
}
