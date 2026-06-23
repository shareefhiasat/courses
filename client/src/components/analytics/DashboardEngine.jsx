import React, { useState, useCallback, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import GridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon } from '@constants/iconTypes';
import { processWidgetData } from '@hooks/useAnalyticsData';
import { processWidgetDataOptimized } from '@hooks/useOptimizedAnalyticsData';
import useWidgetDashboard from '@hooks/useWidgetDashboard';
import WidgetWrapper from './WidgetWrapper';
import WidgetBuilder, { DEFAULT_WIDGET_CONFIG } from './WidgetBuilder';
import OptimizedChartRenderer from '../charts/OptimizedChartRenderer';
import { normalizeAttendanceStatus, normalizeActivityType } from '@utils/listChartResolvers';
import { inferSchedulingWidgetCategory, getWidgetDisplayTitle, resolveDrillDownListWidget, SCHEDULING_SUMMARY_MAX_WIDGETS } from '@constants/schedulingSummaryWidgets';
import { inferStudentWidgetCategory, getStudentWidgetDisplayTitle, resolveStudentDrillDownListWidget } from '@constants/studentPerformanceWidgets';
import { inferClassWidgetCategory, getClassWidgetDisplayTitle, resolveClassDrillDownListWidget } from '@constants/classPerformanceWidgets';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { ConfirmModal } from '@ui';

const ResponsiveGrid = WidthProvider(GridLayout);
const GRID_COLS = 12;

/** Pack visible widgets from the top-left when search/category filters are active. */
function compactLayoutItems(items, cols = GRID_COLS) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const placed = [];

  for (const item of sorted) {
    let y = 0;
    while (true) {
      const collides = placed.some((p) => !(
        item.x + item.w <= p.x
        || p.x + p.w <= item.x
        || y + item.h <= p.y
        || p.y + p.h <= y
      ));
      if (!collides) {
        placed.push({ ...item, y });
        break;
      }
      y += 1;
    }
  }
  return placed;
}

/**
 * DashboardEngine
 * Plug-and-play analytics container.
 * Widget configs are persisted per user in PostgreSQL (user_preferences.settings.dashboards).
 *
 * Props:
 *   rawData        - from useAnalyticsData()
 *   globalFilters  - { classId, term, year, programId, subjectId, semester, studentId }
 *   accentColor    - hex string
 *   editLayout     - bool (drag/resize mode)
 *   defaultWidgets - seed widget list (used when database has no saved layout)
 *   storageKey     - dashboard identifier (default: 'main')
 *   isLoading      - bool (global loading state from useAnalyticsData)
 *   lastUpdatedAt  - timestamp ms
 */
const DashboardEngine = React.forwardRef(({
  rawData = {},
  globalFilters = {},
  accentColor,
  editLayout = false,
  defaultWidgets = [],
  storageKey = 'main',
  isLoading = false,
  lastUpdatedAt,
  onSmartReload,
  widgetSearch = '',
  widgetCategory = '',
  widgetCategoryResolver = null,
  builderCategoryScope = null,
  maxWidgets = null,
}, ref) => {
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const { user } = useAuth();

  // ── Persistent widget state (PostgreSQL user_preferences) ────────────────
  const {
    widgets,
    setWidgets,
    loading: dashLoading,
    resetToDefaults,
  } = useWidgetDashboard(user?.dbId, storageKey, defaultWidgets);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [widgetConfig, setWidgetConfig] = useState(DEFAULT_WIDGET_CONFIG);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Per-widget: minimized state, refresh version counter (no Firebase call needed)
  const [minimizedIds, setMinimizedIds] = useState({});
  const [originalSizes, setOriginalSizes] = useState({}); // Store original sizes before minimize
  const [widgetVersions, setWidgetVersions] = useState({});   // bump → forces re-render of that chart
  const [recentlyRefreshed, setRecentlyRefreshed] = useState({});
  const [widgetUpdatedAt, setWidgetUpdatedAt] = useState({});
  const [widgetFreshData, setWidgetFreshData] = useState({}); // Store fresh data for each widget
  const [maxWidgetsWarning, setMaxWidgetsWarning] = useState(false);

  const widgetLimit = maxWidgets ?? null;
  const atWidgetLimit = widgetLimit != null && widgets.length >= widgetLimit;

  const warnWidgetLimit = useCallback(() => {
    setMaxWidgetsWarning(true);
    window.setTimeout(() => setMaxWidgetsWarning(false), 6000);
  }, []);

  const canAddWidget = useCallback(() => {
    if (!atWidgetLimit) return true;
    warnWidgetLimit();
    return false;
  }, [atWidgetLimit, warnWidgetLimit]);

  // ── Widget state loaded from database via useWidgetDashboard ─────────────

  // ── Sorted widgets with duplicate cleanup ─────────────────────────────────────────
  const sortedWidgets = useMemo(() => {
    const widgetsArray = [...widgets];
    
    // Remove duplicate widgets (same title with "(Copy)" suffix)
    const uniqueWidgets = widgetsArray.filter((widget, index, self) => {
      const isCopy = widget.title?.includes('(Copy)');
      if (!isCopy) return true;
      
      // Find the original widget this is a copy of
      const baseTitle = widget.title.replace(/\s*\(Copy\)(?:\s*\(\d+\))?$/, '');
      const hasOriginal = self.some((w, wIndex) => 
        wIndex !== index && 
        w.title === baseTitle &&
        w.dataSource === widget.dataSource &&
        w.groupBy === widget.groupBy
      );
      
      // Keep only the first copy of each unique widget type
      const earlierCopyIndex = self.findIndex((w, wIndex) => 
        wIndex < index &&
        w.title?.includes('(Copy)') &&
        w.title.replace(/\s*\(Copy\)(?:\s*\(\d+\))?$/, '') === baseTitle &&
        w.dataSource === widget.dataSource &&
        w.groupBy === widget.groupBy
      );
      
      const shouldKeep = !hasOriginal && earlierCopyIndex === -1;
      
      if (import.meta.env.MODE === 'development' && !shouldKeep) {
        info(`[DashboardEngine] Filtering out duplicate widget: ${widget.title}`);
      }
      
      return shouldKeep;
    });
    
    return uniqueWidgets.sort((a, b) => {
      const ay = a.layout?.y ?? a.y ?? 0;
      const by = b.layout?.y ?? b.y ?? 0;
      return ay - by || (a.layout?.x ?? a.x ?? 0) - (b.layout?.x ?? b.x ?? 0);
    });
  }, [widgets]);

  const filteredWidgets = useMemo(() => {
    const q = widgetSearch.trim().toLowerCase();
    return sortedWidgets.filter((widget) => {
      // 'overview' category shows all widgets (it's the default/general view)
      if (widgetCategory && widgetCategory !== 'overview') {
        if (widgetCategoryResolver === 'scheduling') {
          const cat = inferSchedulingWidgetCategory(widget);
          if (cat !== widgetCategory) return false;
        }
        if (widgetCategoryResolver === 'student') {
          const cat = inferStudentWidgetCategory(widget);
          if (cat !== widgetCategory) return false;
        }
        if (widgetCategoryResolver === 'class') {
          const cat = inferClassWidgetCategory(widget);
          if (cat !== widgetCategory) return false;
        }
      }
      if (!q) return true;
      const title = String(widget.title || widget.titleEn || '').toLowerCase();
      const titleAr = String(widget.titleAr || '').toLowerCase();
      const id = String(widget.id || '').toLowerCase();
      const groupBy = String(widget.groupBy || '').toLowerCase();
      return title.includes(q) || titleAr.includes(q) || id.includes(q) || groupBy.includes(q);
    });
  }, [sortedWidgets, widgetSearch, widgetCategory, widgetCategoryResolver]);

  const isFilterActive = Boolean(widgetSearch.trim())
    || (widgetCategoryResolver === 'scheduling' && widgetCategory && widgetCategory !== 'overview')
    || (widgetCategoryResolver === 'student' && widgetCategory && widgetCategory !== 'overview')
    || (widgetCategoryResolver === 'class' && widgetCategory && widgetCategory !== 'overview');

  // ── Grid layout — minimized widgets collapse to header height (h=1) ───────
  const gridLayout = useMemo(() => {
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    const layout = filteredWidgets.map(w => {
      const isMinimized = minimizedIds[w.id];
      const originalSize = originalSizes[w.id];
      
      // Get base position
      let x = w.layout?.x ?? w.x ?? 0;
      let widgetWidth = w.layout?.w ?? w.w ?? 3;
      
      // Mirror x-coordinate for RTL (12-column grid)
      if (isRTL) {
        x = 12 - x - widgetWidth;
      }
      
      const item = {
        i: w.id,
        x,
        y: w.layout?.y ?? w.y ?? 0,
        w: isMinimized ? (originalSize?.w ?? w.layout?.w ?? w.w ?? 3) : (originalSize?.w ?? w.layout?.w ?? w.w ?? 3),  // Preserve original width
        h: isMinimized ? 1 : (originalSize?.h ?? w.layout?.h ?? w.h ?? 5),  // Use original height when restored
        minW: isMinimized ? (originalSize?.w ?? w.layout?.w ?? w.w ?? 3) : 2,  // Min width = original width when minimized
        minH: isMinimized ? 1 : 2,
        maxH: isMinimized ? 1 : undefined,
        static: false,  // Always allow dragging, even when minimized
        isResizable: !isMinimized,  // Only allow resizing when not minimized
        // Add CSS class for animation
        className: isMinimized ? 'minimized' : ''
      };
      // Only log in development mode
      if (import.meta.env.MODE === 'development') {
        info(`[gridLayout] Widget ${w.id}: minimized=${isMinimized}, w=${item.w}, h=${item.h}, original=${JSON.stringify(originalSize)}, RTL=${isRTL}, x=${x}`);
      }
      return item;
    });
    if (import.meta.env.MODE === 'development') {
      info(`[gridLayout] Total widgets in layout: ${layout.length}, RTL=${isRTL}, compact=${isFilterActive}`);
    }
    return isFilterActive ? compactLayoutItems(layout) : layout;
  }, [filteredWidgets, minimizedIds, originalSizes, isFilterActive]);

  // ── Layout change (drag/resize) ───────────────────────────────────────────
  const onLayoutChange = useCallback((newLayout) => {
    if (!editLayout) return;
    
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    
    setWidgets(prev => prev.map(widget => {
      const li = newLayout.find(l => l.i === widget.id);
      if (!li) return widget;
      
      // Mirror x-coordinate back for RTL when saving
      let x = li.x;
      if (isRTL) {
        x = 12 - li.x - li.w;
      }
      
      return { 
        ...widget, 
        layout: { 
          ...(widget.layout || {}), 
          x, 
          y: li.y, 
          w: li.w, 
          h: li.h 
        } 
      };
    }));
  }, [editLayout, setWidgets]);

  // ── Builder ───────────────────────────────────────────────────────────────
  const openBuilder = useCallback((widget = null) => {
    if (!widget && atWidgetLimit) {
      warnWidgetLimit();
      return;
    }
    setEditingWidget(widget);
    setWidgetConfig(widget ? { ...DEFAULT_WIDGET_CONFIG, ...widget } : DEFAULT_WIDGET_CONFIG);
    setShowBuilder(true);
  }, [atWidgetLimit, warnWidgetLimit]);

  const closeBuilder = useCallback(() => {
    setShowBuilder(false);
    setEditingWidget(null);
    setWidgetConfig(DEFAULT_WIDGET_CONFIG);
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openBuilder,
    resetToDefaults: () => {
      setShowResetConfirm(true);
    },
  }), [openBuilder, t]);

  const handleSave = useCallback(() => {
    if (editingWidget) {
      setWidgets(prev => prev.map(w => w.id === editingWidget.id ? { ...w, ...widgetConfig } : w));
    } else if (canAddWidget()) {
      const newWidget = { ...widgetConfig, id: 'w' + Date.now() };
      setWidgets(prev => [...prev, newWidget]);
    }
    closeBuilder();
  }, [editingWidget, widgetConfig, setWidgets, closeBuilder, canAddWidget]);

  // ── Widget actions ────────────────────────────────────────────────────────
  const handleDelete = useCallback((id) => {
    if (import.meta.env.MODE === 'development') {
      info(`[handleDelete] Deleting widget: ${id}`);
    }
    
    // Remove widget from widgets array (allow save to persist deletion)
    setWidgets(prev => {
      const newWidgets = prev.filter(w => w.id !== id);
      if (import.meta.env.MODE === 'development') {
        info(`[handleDelete] Widgets after removal: ${newWidgets.length}`);
      }
      return newWidgets;
    });
    
    // Remove from minimized state
    setMinimizedIds(prev => {
      const newState = { ...prev };
      delete newState[id];
      if (import.meta.env.MODE === 'development') {
        info(`[handleDelete] MinimizedIds after removal:`, newState);
      }
      return newState;
    });
    
    // Clean up other related state
    setWidgetVersions(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    
    setWidgetUpdatedAt(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    
    setRecentlyRefreshed(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, [storageKey, setWidgets]);

  const handleMinimize = useCallback((id) => {
    if (import.meta.env.MODE === 'development') {
      info(`[handleMinimize] Toggling widget: ${id}`);
    }
    
    // Get current minimized state
    const currentMinimized = minimizedIds[id];
    const isMinimizing = !currentMinimized;
    
    if (import.meta.env.MODE === 'development') {
      info(`[handleMinimize] ${isMinimizing ? 'Minimizing' : 'Restoring'} widget ${id}`);
    }
    
    // Store original size before minimizing
    if (isMinimizing) {
      const widget = widgets.find(w => w.id === id);
      if (widget) {
        const currentWidth = widget.layout?.w ?? widget.w ?? 3;
        const currentHeight = widget.layout?.h ?? widget.h ?? 5;
        setOriginalSizes(prev => ({
          ...prev,
          [id]: { w: currentWidth, h: currentHeight }
        }));
        if (import.meta.env.MODE === 'development') {
          info(`[handleMinimize] Stored original size for ${id}:`, { w: currentWidth, h: currentHeight });
        }
      }
    }
    
    // Update minimized state
    setMinimizedIds(prev => {
      const newState = { ...prev, [id]: isMinimizing };
      if (import.meta.env.MODE === 'development') {
        info(`[handleMinimize] Updated minimizedIds:`, newState);
      }
      return newState;
    });
    
    // Update the specific widget layout
    setWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id) {
          const originalSize = originalSizes[id];
          const updatedWidget = {
            ...widget,
            layout: {
              ...widget.layout,
              w: isMinimizing ? (originalSize?.w ?? widget.layout?.w ?? widget.w ?? 3) : (originalSize?.w ?? widget.layout?.w ?? widget.w ?? 3),  // Preserve original width
              h: isMinimizing ? 1 : (originalSize?.h ?? widget.layout?.h ?? widget.h ?? 5),  // Minimized height = 1, restore original height
              static: false,  // Always allow dragging
              isResizable: !isMinimizing  // Allow resizing when not minimized
            }
          };
          if (import.meta.env.MODE === 'development') {
            info(`[handleMinimize] Updated widget ${id} layout:`, updatedWidget.layout);
          }
          return updatedWidget;
        }
        return widget;
      });
      if (import.meta.env.MODE === 'development') {
        info(`[handleMinimize] Total widgets updated: ${updatedWidgets.length}`);
      }
      return updatedWidgets;
    }, true); // Skip save to prevent Firestore reload
  }, [minimizedIds, originalSizes, storageKey, setWidgets, widgets]);

  /**
   * Per-widget refresh: just bumps a version counter so the chart re-renders
   * from the already-loaded rawData. No Firebase call needed — rawData is live.
   */
  const handleDuplicate = useCallback((id) => {
    if (!canAddWidget()) return;
    const widgetToDuplicate = widgets.find(w => w.id === id);
    if (!widgetToDuplicate) return;

    // Create a duplicate with a new ID and updated title
    const duplicatedWidget = {
      ...widgetToDuplicate,
      id: 'w' + Date.now(),
      title: `${widgetToDuplicate.title} (${t('copy') || 'Copy'})`,
      layout: {
        x: (widgetToDuplicate.layout?.x || 0) + 1, // Offset position slightly
        y: (widgetToDuplicate.layout?.y || 0) + 1,
        w: widgetToDuplicate.layout?.w || widgetToDuplicate.w || 3,
        h: widgetToDuplicate.layout?.h || widgetToDuplicate.h || 5
      }
    };

    // Add the duplicated widget to the widgets list
    setWidgets(prev => [...prev, duplicatedWidget]);
  }, [widgets, setWidgets, t, canAddWidget]);

  const handleRefreshWidget = useCallback(async (id) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    let freshData = null;
    if (onSmartReload) {
      const result = await onSmartReload(widget);
      freshData = result?.freshData;
      if (freshData) {
        setWidgetFreshData(prev => ({ ...prev, [id]: freshData }));
      }
    }

    setWidgetVersions(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setWidgetUpdatedAt(prev => ({ ...prev, [id]: Date.now() }));
    setRecentlyRefreshed(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setRecentlyRefreshed(prev => ({ ...prev, [id]: false })), 1400);
  }, [widgets, onSmartReload]);
  // Using processWidgetData with translation support
  const chartDataMap = useMemo(() => {
    const map = {};
    filteredWidgets.forEach((w) => {
      map[w.id] = processWidgetData(w, rawData, globalFilters, 0, t, lang);
    });
    return map;
  }, [
    filteredWidgets,
    rawData,
    globalFilters,
    t,
    lang,
  ]);

  // ── Chart rendering ───────────────────────────────────────────────────────
  const handleChartClick = useCallback((widget, dataPoint) => {
    if (!canAddWidget()) return;

    const drillWidget = widgetCategoryResolver === 'student'
      ? resolveStudentDrillDownListWidget(widget, dataPoint, t, lang)
      : widgetCategoryResolver === 'class'
      ? resolveClassDrillDownListWidget(widget, dataPoint, t, lang)
      : resolveDrillDownListWidget(widget, dataPoint, t, lang);
    if (drillWidget) {
      setWidgets((prev) => [...prev, drillWidget]);
      return;
    }

    const parentTitle = widgetCategoryResolver === 'student'
      ? getStudentWidgetDisplayTitle(widget, t, lang)
      : widgetCategoryResolver === 'class'
      ? getClassWidgetDisplayTitle(widget, t, lang)
      : getWidgetDisplayTitle(widget, t, lang);
    const sliceLabel = dataPoint.label || dataPoint.lines?.[0] || t('not_specified') || 'Item';
    const newTitle = `${parentTitle} - ${sliceLabel}`;
    const newListWidget = {
      id: 'list-' + Date.now(),
      title: newTitle,
      titleEn: newTitle,
      titleAr: newTitle,
      chartType: 'list',
      dataSource: widget.dataSource,
      groupBy: widget.groupBy,
      filterValue: sliceLabel,
      aggregation: 'list',
      dateRange: widget.dateRange,
      filters: widget.filters,
      comparisonMode: false,
      layout: { 
        x: widget.layout?.x || 0, 
        y: (widget.layout?.y || 0) + (widget.layout?.h || 4), 
        w: widget.layout?.w || 6, 
        h: 6 
      }
    };
    
    setWidgets(prev => [...prev, newListWidget]);
  }, [setWidgets, t, lang, canAddWidget]);

  const renderChart = useCallback((widget, size) => {
    const data = chartDataMap[widget.id] || [];
    
    // Use fresh data if available for this widget, otherwise fall back to global rawData
    const widgetSpecificRawData = widgetFreshData[widget.id] || rawData;
    
    return (
      <OptimizedChartRenderer 
        widget={widget}
        size={size}
        data={data}
        accentColor={accentColor}
        rawData={widgetSpecificRawData}
        onPointClick={(dp) => handleChartClick(widget, dp)}
        onListColumnsChange={(cols) => {
          setWidgets((prev) => prev.map((w) => (
            w.id === widget.id ? { ...w, listColumns: cols } : w
          )));
        }}
        onListConfigChange={(config) => {
          setWidgets((prev) => prev.map((w) => (
            w.id === widget.id ? { ...w, ...config } : w
          )));
        }}
      />
    );
  }, [chartDataMap, handleChartClick, accentColor, rawData, widgetFreshData, setWidgets]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {maxWidgetsWarning && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: 8,
          border: '1px solid #f59e0b',
          background: 'rgba(245, 158, 11, 0.12)',
          color: 'var(--text)',
          fontSize: '0.875rem',
        }}>
          <strong>{t('widget_limit_reached') || 'Widget limit reached'}</strong>
          {' — '}
          {t('widget_limit_message') || `Maximum ${widgetLimit} widgets (system default). Delete or edit existing widgets before adding more.`}
        </div>
      )}
      {/* Scoped CSS */}
      <style>{`
        .rgl-engine .react-grid-item {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          transition-property: width, height, transform !important;
        }
        .rgl-engine .react-grid-item.react-grid-placeholder {
          background: ${accentColor}33;
          border: 2px dashed ${accentColor};
          border-radius: 16px;
          opacity: 0.8;
          transition: all 0.3s ease;
        }
        .rgl-engine .react-resizable-handle {
          background-color: ${accentColor};
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .rgl-engine .react-grid-item:hover .react-resizable-handle { opacity: 0.8; }
        .rgl-engine .react-grid-item:hover .widget-actions { opacity: 1 !important; }
        .rgl-engine .react-grid-item.cssTransforms { transition-property: transform, width, height; }
        .rgl-engine .react-grid-item.resizing,
        .rgl-engine .react-grid-item.react-draggable-dragging { 
          transition: none !important; 
          z-index: 100; 
        }
        
        /* RTL Support */
        [dir="rtl"] .rgl-engine {
          direction: ltr; /* Keep grid layout LTR for positioning */
        }
        
        [dir="rtl"] .rgl-engine .react-grid-item {
          direction: rtl; /* Make content RTL */
        }
        
        [dir="rtl"] .rgl-engine .react-grid-placeholder {
          direction: ltr; /* Keep placeholder LTR */
        }
        
        /* Smooth minimize/restore animations */
        .rgl-engine .react-grid-item.minimizing {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .rgl-engine .react-grid-item.restoring {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        /* Widget content animation */
        .widget-content {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .widget-content.minimized {
          opacity: 0;
          transform: scaleY(0);
          transform-origin: top;
          height: 0 !important;
          overflow: hidden;
        }
        
        .widget-content.restored {
          opacity: 1;
          transform: scaleY(1);
        }
        
        /* RTL-specific widget adjustments */
        [dir="rtl"] .widget-actions {
          left: 8px;
          right: auto;
        }
        
        [dir="rtl"] .drag-handle {
          right: 8px;
          left: auto;
        }
      `}</style>

      {/* ── Grid ── */}
      {/* Show loading state while widgets are being loaded from Firestore */}
      {(dashLoading || isLoading) ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          color: accentColor,
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {t('loading_dashboard') || 'Loading dashboard...'}
        </div>
      ) : (
        <ResponsiveGrid
          key={`widgets-${widgetSearch}-${widgetCategory}`}
          className="layout rgl-engine"
          layout={gridLayout}
          cols={GRID_COLS}
          rowHeight={64}
          isDraggable={editLayout}
          isResizable={editLayout}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          resizeHandles={editLayout ? ['se', 'sw', 'ne', 'nw'] : []}
          compactType={null}
          preventCollision={false}
          margin={[12, 12]}
        >
          {filteredWidgets.map(widget => (
            <div key={widget.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <WidgetWrapper
                widget={widget}
                accentColor={accentColor}
                isMinimized={!!minimizedIds[widget.id]}
                onMinimize={() => handleMinimize(widget.id)}
                onEdit={() => openBuilder(widget)}
                onDelete={() => handleDelete(widget.id)}
                onDuplicate={() => handleDuplicate(widget.id)}
                onRefresh={() => handleRefreshWidget(widget.id)}
                isLoading={isLoading}
                isRecentlyRefreshed={!!recentlyRefreshed[widget.id]}
                lastUpdatedAt={widgetUpdatedAt[widget.id] || lastUpdatedAt}
                editLayout={editLayout}
              >
                {/* version key forces chart re-render on refresh without full data reload */}
                {(size) => (
                  <React.Fragment key={widgetVersions[widget.id] || 0}>
                    {renderChart(widget, size)}
                  </React.Fragment>
                )}
              </WidgetWrapper>
            </div>
          ))}
        </ResponsiveGrid>
      )}

      {/* ── Empty state ── */}
      {!dashLoading && filteredWidgets.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', gap: 16, color: 'var(--muted)', textAlign: 'center'
        }}>
          <span style={{ fontSize: 48, opacity: 0.25 }}>{getThemedIcon('ui', 'bar_chart3', 48, theme)}</span>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t('no_widgets_yet') || 'No widgets yet'}</p>
          <p style={{ margin: 0, fontSize: 13 }}>{t('add_widget_hint') || 'Click "Add Widget" to build your first chart.'}</p>
        </div>
      )}

      {/* ── Widget Builder Modal ── */}
      <WidgetBuilder
        isOpen={showBuilder}
        config={widgetConfig}
        onChange={(partial) => setWidgetConfig(prev => ({ ...prev, ...partial }))}
        onSave={handleSave}
        onCancel={closeBuilder}
        isEditing={!!editingWidget}
        accentColor={accentColor}
        categoryScope={builderCategoryScope ?? (storageKey === 'scheduling_summary' ? 'scheduling' : null)}
      />

      {/* ── Reset Confirmation Modal ── */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetToDefaults();
          setMinimizedIds({});
          setOriginalSizes({});
          setWidgetVersions({});
          setWidgetUpdatedAt({});
          setShowResetConfirm(false);
        }}
        title={t('reset_dashboard') || 'Reset Dashboard'}
        message={t('reset_dashboard_confirm') || 'Reset dashboard to system defaults? Your custom layout will be lost.'}
        confirmText={t('reset') || 'Reset'}
        cancelText={t('cancel') || 'Cancel'}
        variant="danger"
        size="small"
      />
    </>
  );
});

export default DashboardEngine;
