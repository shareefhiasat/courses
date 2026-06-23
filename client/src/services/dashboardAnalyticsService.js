/**
 * Dashboard Analytics Service - API Client
 * Fetches drive, workflow, and activity metrics for dashboard widgets.
 */
import api from '@api';

const getAnalytics = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.classId) queryParams.append('classId', params.classId);
    const url = `/dashboard/analytics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const result = await api.get(url);
    return result;
  } catch (error) {
    console.error('[DashboardAnalyticsService] Error:', error);
    return { success: false, error: error.message };
  }
};

const getDriveAnalytics = async () => {
  try {
    return await api.get('/dashboard/analytics/drive');
  } catch (error) {
    console.error('[DashboardAnalyticsService] Drive error:', error);
    return { success: false, error: error.message };
  }
};

const getWorkflowAnalytics = async () => {
  try {
    return await api.get('/dashboard/analytics/workflow');
  } catch (error) {
    console.error('[DashboardAnalyticsService] Workflow error:', error);
    return { success: false, error: error.message };
  }
};

const getActivityAnalytics = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.classId) queryParams.append('classId', params.classId);
    const url = `/dashboard/analytics/activity${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await api.get(url);
  } catch (error) {
    console.error('[DashboardAnalyticsService] Activity error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getAnalytics,
  getDriveAnalytics,
  getWorkflowAnalytics,
  getActivityAnalytics,
};
