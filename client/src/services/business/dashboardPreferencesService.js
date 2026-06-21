/**
 * Dashboard widget layout persistence — PostgreSQL user_preferences.settings.dashboards
 */

import { apiService } from '../api/apiService';
import { info, warn } from '../utils/logger.js';

const API_BASE = '/me/dashboards';

export async function loadDashboardPreferences(dashboardKey) {
  try {
    const response = await apiService.get(`${API_BASE}/${encodeURIComponent(dashboardKey)}`);
    if (response?.success && response?.data) {
      return {
        widgets: response.data.widgets || [],
        pinnedIds: response.data.pinnedIds || [],
      };
    }
    return { widgets: [], pinnedIds: [] };
  } catch (error) {
    warn('[dashboardPreferences] load failed:', error);
    return { widgets: [], pinnedIds: [] };
  }
}

export async function saveDashboardPreferences(dashboardKey, widgets, pinnedIds = []) {
  try {
    const response = await apiService.put(`${API_BASE}/${encodeURIComponent(dashboardKey)}`, {
      widgets,
      pinnedIds,
    });
    if (response?.success) {
      info('[dashboardPreferences] saved:', { dashboardKey, widgetCount: widgets?.length || 0 });
      return true;
    }
    return false;
  } catch (error) {
    warn('[dashboardPreferences] save failed:', error);
    return false;
  }
}

export async function resetDashboardPreferences(dashboardKey) {
  try {
    await apiService.delete(`${API_BASE}/${encodeURIComponent(dashboardKey)}`);
    return true;
  } catch (error) {
    warn('[dashboardPreferences] reset failed:', error);
    return false;
  }
}
