import { useState, useEffect, useCallback, useRef } from 'react';
import { info, warn } from '@services/utils/logger.js';
import {
  loadDashboardPreferences,
  saveDashboardPreferences,
  resetDashboardPreferences,
} from '@services/business/dashboardPreferencesService';

/**
 * Migration function to fix widgets with invalid groupBy values
 */
const migrateWidgetConfigs = (widgets) => {
  return widgets.map(widget => {
    if (widget.dataSource === 'schedulingOverviewStats') {
      const statToSource = {
        totalPrograms: 'schedulingPrograms',
        totalSubjects: 'schedulingSubjects',
        totalClasses: 'schedulingClasses',
        totalSessions: 'schedulingSessions',
        scheduledCount: 'schedulingSessions',
        inProgressCount: 'schedulingSessions',
        completedCount: 'schedulingSessions',
        cancelledCount: 'schedulingSessions',
        thisWeekSessions: 'schedulingSessions',
        uniqueClassrooms: 'schedulingRooms',
        totalClassrooms: 'schedulingRooms',
        uniqueInstructors: 'schedulingTeachers',
        totalInstructors: 'schedulingTeachers',
        breakCount: 'schedulingBreaks',
        holidayCount: 'schedulingHolidays',
      };
      return {
        ...widget,
        dataSource: statToSource[widget.statKey] || 'schedulingSessions',
        countMetric: widget.statKey || 'totalSessions',
        groupBy: '',
        aggregation: 'count',
      };
    }

    if (widget.chartType === 'count') {
      return { ...widget, groupBy: '', aggregation: 'count' };
    }

    if (!widget.groupBy || widget.groupBy.trim() === '' || widget.groupBy === 'undefined' || widget.groupBy === 'null') {
      warn('[useWidgetDashboard] Migrating widget with invalid groupBy:', {
        title: widget.title,
        dataSource: widget.dataSource,
        groupBy: widget.groupBy,
      });

      let fixedGroupBy = 'status';

      if (widget.dataSource === 'activities,announcements,resources') {
        fixedGroupBy = 'type';
      } else if (widget.dataSource === 'activities') {
        fixedGroupBy = 'type';
      } else if (widget.dataSource === 'announcements') {
        fixedGroupBy = 'classId';
      } else if (widget.dataSource === 'resources') {
        fixedGroupBy = 'classId';
      } else if (widget.dataSource === 'attendance') {
        fixedGroupBy = 'status';
      } else if (widget.dataSource === 'enrollments') {
        fixedGroupBy = 'programId';
      } else if (widget.dataSource === 'users') {
        fixedGroupBy = 'role';
      } else if (widget.dataSource === 'classes') {
        fixedGroupBy = 'programId';
      } else if (widget.dataSource === 'activityLogs') {
        fixedGroupBy = 'date';
      } else if (widget.dataSource?.startsWith('scheduling')) {
        fixedGroupBy = widget.chartType === 'count' ? '' : (widget.groupBy || 'status');
      }

      return { ...widget, groupBy: fixedGroupBy };
    }
    return widget;
  });
};

/**
 * useWidgetDashboard
 * Persists widget configs per user in PostgreSQL (user_preferences.settings.dashboards).
 */
const useWidgetDashboard = (userDbId, dashboardKey, defaultWidgets = []) => {
  const [widgets, setWidgetsState] = useState(defaultWidgets);
  const [pinnedIds, setPinnedIdsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef(null);
  const skipSaveRef = useRef(false);
  const defaultWidgetsRef = useRef(defaultWidgets);
  const pinnedIdsRef = useRef([]);

  useEffect(() => {
    defaultWidgetsRef.current = defaultWidgets;
  }, [defaultWidgets]);

  useEffect(() => {
    pinnedIdsRef.current = pinnedIds;
  }, [pinnedIds]);

  // ── Load from database ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      if (!userDbId || !dashboardKey) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const saved = await loadDashboardPreferences(dashboardKey);
        if (!cancelled && saved.widgets?.length) {
          const migratedWidgets = migrateWidgetConfigs(saved.widgets);
          setWidgetsState(migratedWidgets);
          setPinnedIdsState(saved.pinnedIds || []);

          if (JSON.stringify(migratedWidgets) !== JSON.stringify(saved.widgets)) {
            await saveDashboardPreferences(dashboardKey, migratedWidgets, saved.pinnedIds || []);
          }
        }
      } catch (e) {
        warn('[useWidgetDashboard] Database load failed:', e);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userDbId, dashboardKey]);

  // ── Debounced save ────────────────────────────────────────────────────────
  const debouncedSave = useCallback((nextWidgets, nextPinned) => {
    if (!userDbId || !dashboardKey) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveDashboardPreferences(dashboardKey, nextWidgets, nextPinned);
    }, 800);
  }, [userDbId, dashboardKey]);

  const setWidgets = useCallback((next, skipSave = false) => {
    const resolved = typeof next === 'function' ? next(widgets) : next;
    setWidgetsState(resolved);
    if (!skipSave && !skipSaveRef.current) {
      debouncedSave(resolved, pinnedIdsRef.current);
    }
  }, [widgets, debouncedSave]);

  const setSkipSave = useCallback((skip) => {
    skipSaveRef.current = skip;
  }, []);

  const setPinnedIds = useCallback((next) => {
    const resolved = typeof next === 'function' ? next(pinnedIds) : next;
    setPinnedIdsState(resolved);
    pinnedIdsRef.current = resolved;
    debouncedSave(widgets, resolved);
  }, [widgets, pinnedIds, debouncedSave]);

  const resetToDefaults = useCallback(async () => {
    const defaults = JSON.parse(JSON.stringify(defaultWidgetsRef.current || []));
    setWidgetsState(defaults);
    setPinnedIdsState([]);
    pinnedIdsRef.current = [];
    if (dashboardKey) {
      await resetDashboardPreferences(dashboardKey);
      await saveDashboardPreferences(dashboardKey, defaults, []);
    }
    info('[useWidgetDashboard] Dashboard reset to system defaults:', { dashboardKey, widgetCount: defaults.length });
  }, [dashboardKey]);

  return { widgets, setWidgets, pinnedIds, setPinnedIds, loading, setSkipSave, resetToDefaults };
};

export default useWidgetDashboard;
