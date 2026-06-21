import { useState, useEffect, useCallback, useRef } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Migration function to fix widgets with invalid groupBy values
 */
const migrateWidgetConfigs = (widgets) => {
  return widgets.map(widget => {
    if (widget.chartType === 'count' || widget.dataSource === 'schedulingOverviewStats') {
      return { ...widget, groupBy: '' };
    }

    // If groupBy is empty, undefined, null, or invalid, fix it
    if (!widget.groupBy || widget.groupBy.trim() === '' || widget.groupBy === 'undefined' || widget.groupBy === 'null') {
      warn('[useWidgetDashboard] Migrating widget with invalid groupBy:', { 
        title: widget.title, 
        dataSource: widget.dataSource, 
        groupBy: widget.groupBy 
      });
      
      // Set appropriate groupBy based on dataSource
      let fixedGroupBy = 'status'; // default fallback
      
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
      
      return {
        ...widget,
        groupBy: fixedGroupBy
      };
    }
    return widget;
  });
};

/**
 * useWidgetDashboard
 * Persists widget configs per user in localStorage: wdg_{dashboardKey}
 * dashboardKey should include user id when dashboards are user-specific.
 */
const useWidgetDashboard = (uid, dashboardKey, defaultWidgets = []) => {
  const [widgets, setWidgetsState] = useState(defaultWidgets);
  const [pinnedIds, setPinnedIdsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef(null);
  const skipSaveRef = useRef(false);
  const defaultWidgetsRef = useRef(defaultWidgets);

  useEffect(() => {
    defaultWidgetsRef.current = defaultWidgets;
  }, [defaultWidgets]);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const saved = localStorage.getItem(`wdg_${dashboardKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!cancelled) {
            const migratedWidgets = migrateWidgetConfigs(parsed.widgets || defaultWidgets);
            setWidgetsState(migratedWidgets);
            setPinnedIdsState(parsed.pinnedIds || []);

            if (JSON.stringify(migratedWidgets) !== JSON.stringify(parsed.widgets || defaultWidgets)) {
              try {
                const payload = { widgets: migratedWidgets, pinnedIds: parsed.pinnedIds || [] };
                localStorage.setItem(`wdg_${dashboardKey}`, JSON.stringify(payload));
                info('[useWidgetDashboard] Migrated widgets saved to localStorage');
              } catch (e) {
                warn('[useWidgetDashboard] Failed to save migrated widgets to localStorage:', e);
              }
            }
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        warn('[useWidgetDashboard] localStorage load failed:', e);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, dashboardKey]);

  // ── Debounced save ────────────────────────────────────────────────────────
  const debouncedSave = useCallback((nextWidgets, nextPinned) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const payload = { widgets: nextWidgets, pinnedIds: nextPinned };

      // Always write localStorage as fast cache
      try {
        localStorage.setItem(`wdg_${dashboardKey}`, JSON.stringify(payload));
      } catch {}

      // Firestore removed - using localStorage only
      info('[useWidgetDashboard] Dashboard saved to localStorage:', { dashboardKey, widgetCount: payload.widgets?.length || 0 });
    }, 800);
  }, [uid, dashboardKey]);

  // ── Setters that also persist ─────────────────────────────────────────────
  const setWidgets = useCallback((next, skipSave = false) => {
    const resolved = typeof next === 'function' ? next(widgets) : next;
    setWidgetsState(resolved);
    if (!skipSave && !skipSaveRef.current) {
      debouncedSave(resolved, pinnedIds);
    }
  }, [widgets, pinnedIds, debouncedSave]);

  // ── Control save mechanism ────────────────────────────────────────────────
  const setSkipSave = useCallback((skip) => {
    skipSaveRef.current = skip;
  }, []);

  const setPinnedIds = useCallback((next) => {
    const resolved = typeof next === 'function' ? next(pinnedIds) : next;
    setPinnedIdsState(resolved);
    debouncedSave(widgets, resolved);
  }, [widgets, pinnedIds, debouncedSave]);

  const resetToDefaults = useCallback(() => {
    const defaults = JSON.parse(JSON.stringify(defaultWidgetsRef.current || []));
    setWidgetsState(defaults);
    setPinnedIdsState([]);
    try {
      localStorage.removeItem(`wdg_${dashboardKey}`);
      localStorage.setItem(`wdg_${dashboardKey}`, JSON.stringify({ widgets: defaults, pinnedIds: [] }));
    } catch {}
    info('[useWidgetDashboard] Dashboard reset to system defaults:', { dashboardKey, widgetCount: defaults.length });
  }, [dashboardKey]);

  return { widgets, setWidgets, pinnedIds, setPinnedIds, loading, setSkipSave, resetToDefaults };
};

export default useWidgetDashboard;
