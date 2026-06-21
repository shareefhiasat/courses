import { useMemo, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import WidgetConfigurationService from '@services/widgetConfigurationService';
import useWidgetDashboard from '@hooks/useWidgetDashboard';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * useRoleBasedWidgets
 * Hook to manage role-based widgets with performance optimizations
 * 
 * @param {string} dashboard - Dashboard identifier (e.g., 'overview', 'performance')
 * @param {Object} options - Configuration options
 * @returns {Object} Widget management object
 */
export default function useRoleBasedWidgets(dashboard, options = {}) {
  const { user, userProfile } = useAuth();
  const {
    enableCustomization = true,
    filterByPermissions = true,
    mergeWithDefaults = true
  } = options;

  // Get user's role
  const userRole = useMemo(() => {
    return userProfile?.role || user?.role || 'student';
  }, [userProfile, user]);

  // Generate storage key for this dashboard
  const storageKey = useMemo(() => {
    if (!user?.dbId) return null;
    return WidgetConfigurationService.getStorageKey(userRole, dashboard);
  }, [userRole, dashboard, user?.dbId]);

  // Get default widgets for this role/dashboard
  const defaultWidgets = useMemo(() => {
    return WidgetConfigurationService.getDefaultWidgets(userRole, dashboard);
  }, [userRole, dashboard]);

  // Use existing widget dashboard hook
  const {
    widgets,
    setWidgets,
    pinnedIds,
    setPinnedIds,
    loading: widgetLoading
  } = useWidgetDashboard(user?.dbId, storageKey, defaultWidgets);

  // Filter widgets based on permissions
  const filteredWidgets = useMemo(() => {
    if (!filterByPermissions) return widgets;
    
    try {
      return WidgetConfigurationService.filterWidgetsByPermissions(widgets, userRole);
    } catch (error) {
      error('[useRoleBasedWidgets] Error filtering widgets:', error);
      return widgets;
    }
  }, [widgets, userRole, filterByPermissions]);

  // Check if user can edit widgets
  const canEdit = useMemo(() => {
    if (!enableCustomization) return false;
    return WidgetConfigurationService.canEditWidgets(userRole, userRole);
  }, [userRole, enableCustomization]);

  // Memoized widget setter with merge logic
  const setWidgetsWithMerge = useCallback((newWidgets) => {
    if (!mergeWithDefaults) {
      setWidgets(newWidgets);
      return;
    }

    const merged = WidgetConfigurationService.mergeWidgets(newWidgets, defaultWidgets);
    setWidgets(merged);
  }, [setWidgets, mergeWithDefaults, defaultWidgets]);

  // Reset to default widgets
  const resetToDefaults = useCallback(() => {
    info(`[useRoleBasedWidgets] Resetting to default widgets for ${userRole}_${dashboard}`);
    setWidgets(defaultWidgets);
    setPinnedIds([]);
  }, [setWidgets, setPinnedIds, defaultWidgets, userRole, dashboard]);

  // Add a new widget
  const addWidget = useCallback((widgetConfig) => {
    const newWidget = {
      ...widgetConfig,
      id: `${widgetConfig.id || 'custom'}_${Date.now()}`,
      role: userRole,
      dashboard,
      layout: widgetConfig.layout || { x: 0, y: 0, w: 4, h: 3 }
    };

    setWidgetsWithMerge([...widgets, newWidget]);
  }, [widgets, setWidgetsWithMerge, userRole, dashboard]);

  // Update a widget
  const updateWidget = useCallback((widgetId, updates) => {
    setWidgetsWithMerge(widgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ));
  }, [widgets, setWidgetsWithMerge]);

  // Remove a widget
  const removeWidget = useCallback((widgetId) => {
    setWidgetsWithMerge(widgets.filter(w => w.id !== widgetId));
    
    // Also remove from pinned if it was pinned
    if (pinnedIds.includes(widgetId)) {
      setPinnedIds(pinnedIds.filter(id => id !== widgetId));
    }
  }, [widgets, setWidgetsWithMerge, pinnedIds, setPinnedIds]);

  // Get widget statistics
  const widgetStats = useMemo(() => ({
    total: widgets.length,
    pinned: pinnedIds.length,
    custom: widgets.filter(w => w.isCustom).length,
    byType: widgets.reduce((acc, w) => {
      acc[w.chartType] = (acc[w.chartType] || 0) + 1;
      return acc;
    }, {})
  }), [widgets, pinnedIds]);

  return {
    // Data
    widgets: filteredWidgets,
    allWidgets: widgets, // Unfiltered widgets (for admin view)
    defaultWidgets,
    pinnedIds,
    loading: widgetLoading,
    
    // Permissions
    canEdit,
    userRole,
    
    // Actions
    setWidgets: setWidgetsWithMerge,
    setPinnedIds,
    addWidget,
    updateWidget,
    removeWidget,
    resetToDefaults,
    
    // Stats
    stats: widgetStats,
    
    // Utilities
    storageKey,
    hasCustomWidgets: widgets.some(w => w.isCustom)
  };
}
