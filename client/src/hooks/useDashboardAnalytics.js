import { useState, useEffect, useCallback } from 'react';
import dashboardAnalyticsService from '@services/dashboardAnalyticsService';
import { useAuth } from '@contexts/AuthContext';
import { info, error } from '@services/utils/logger.js';

/**
 * Hook to fetch dashboard analytics (drive, workflow, activity metrics).
 * Role-based: HR/Super Admin see all, Admin/Instructor see own data only.
 */
export default function useDashboardAnalytics(classId = null, { enabled = true } = {}) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardAnalyticsService.getAnalytics({ classId });
      console.log('[useDashboardAnalytics DEBUG] API result:', {
        success: result.success,
        hasData: !!result.data,
        drive: result.data?.drive ? {
          overview: result.data.drive.overview,
          fileActivitiesLength: result.data.drive.fileActivities?.length,
          fileActivities: result.data.drive.fileActivities,
        } : 'missing',
        workflow: result.data?.workflow ? {
          overview: result.data.workflow.overview,
          workflowByStatusLength: result.data.workflow.workflowByStatus?.length,
          workflowByStatus: result.data.workflow.workflowByStatus,
        } : 'missing',
      });
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
  }, [classId, enabled]);

  useEffect(() => {
    if (user && enabled) load();
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
    }
  }, [user, load, enabled]);

  return { data, loading, error, reload: load };
}
