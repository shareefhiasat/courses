import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import logger from '@utils/logger';

const ResponsiveGrid = WidthProvider(GridLayout);

/**
 * DashboardEngine
 * Plug-and-play analytics container.
 * Widget configs are persisted to Firestore (users/{uid}/preferences.dashboards.{storageKey}).
 *
 * Props:
 *   rawData        - from useAnalyticsData()
 *   globalFilters  - { classId, term, year, programId, subjectId, semester, studentId }
 *   accentColor    - hex string
 *   editLayout     - bool (drag/resize mode)
 *   defaultWidgets - seed widget list (used when Firestore + localStorage are empty)
 *   storageKey     - dashboard identifier (default: 'main')
 *   isLoading      - bool (global loading state from useAnalyticsData)
 *   lastUpdatedAt  - timestamp ms
 */
const DashboardEngine = ({
  rawData = {},
  globalFilters = {},
  accentColor,
  editLayout = false,
  defaultWidgets = [],
  storageKey = 'main',
  isLoading = false,
  lastUpdatedAt,
}) => {
  const { theme } = useTheme();
  const { t } = useLang();
  const { user } = useAuth();

  // ── Persistent widget state (Firestore + localStorage fallback) ────────────
  const {
    widgets,
    setWidgets,
    loading: dashLoading
  } = useWidgetDashboard(user?.uid, storageKey, defaultWidgets);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [widgetConfig, setWidgetConfig] = useState(DEFAULT_WIDGET_CONFIG);

  // Per-widget: minimized state, refresh version counter (no Firebase call needed)
  const [minimizedIds, setMinimizedIds] = useState({});
  const [widgetVersions, setWidgetVersions] = useState({});   // bump → forces re-render of that chart
  const [recentlyRefreshed, setRecentlyRefreshed] = useState({});
  const [widgetUpdatedAt, setWidgetUpdatedAt] = useState({});

  // ── Clear problematic localStorage cache on mount ────────────────────────
  useEffect(() => {
    // Clear the analytics widgets cache to prevent old widget restoration
    try {
      localStorage.removeItem(`wdg_${storageKey}`);
      logger.log(`[DashboardEngine] Cleared localStorage cache on mount for ${storageKey}`);
    } catch (e) {
      logger.warn(`[DashboardEngine] Failed to clear localStorage on mount:`, e);
    }
  }, [storageKey]);

  // ── Sorted widgets ─────────────────────────────────────────
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => {
      const ay = a.layout?.y ?? a.y ?? 0;
      const by = b.layout?.y ?? b.y ?? 0;
      return ay - by || (a.layout?.x ?? a.x ?? 0) - (b.layout?.x ?? b.x ?? 0);
    });
  }, [widgets]);

  // ── Grid layout — minimized widgets collapse to header height (h=1) ───────
  const gridLayout = useMemo(() => {
    const layout = sortedWidgets.map(w => {
      const isMinimized = minimizedIds[w.id];
      const item = {
        i: w.id,
        x: w.layout?.x ?? w.x ?? 0,
        y: w.layout?.y ?? w.y ?? 0,
        w: isMinimized ? 4 : (w.layout?.w ?? w.w ?? 3),  // Use 3 as default width
        h: isMinimized ? 1 : (w.layout?.h ?? w.h ?? 5),  // Use 5 as default height
        minW: isMinimized ? 4 : 2,
        minH: isMinimized ? 1 : 2,
        maxH: isMinimized ? 1 : undefined,
        static: false,  // Always allow dragging, even when minimized
        isResizable: !isMinimized  // Only allow resizing when not minimized
      };
      logger.log(`[gridLayout] Widget ${w.id}: minimized=${isMinimized}, w=${item.w}, h=${item.h}`);
      return item;
    });
    logger.log(`[gridLayout] Total widgets in layout: ${layout.length}`);
    return layout;
  }, [sortedWidgets, minimizedIds]);

  // ── Layout change (drag/resize) ───────────────────────────────────────────
  const onLayoutChange = useCallback((newLayout) => {
    if (!editLayout) return;
    setWidgets(prev => prev.map(widget => {
      const li = newLayout.find(l => l.i === widget.id);
      if (!li) return widget;
      return { ...widget, layout: { ...(widget.layout || {}), x: li.x, y: li.y, w: li.w, h: li.h } };
    }));
  }, [editLayout, setWidgets]);

  // ── Builder ───────────────────────────────────────────────────────────────
  const openBuilder = useCallback((widget = null) => {
    setEditingWidget(widget);
    setWidgetConfig(widget ? { ...DEFAULT_WIDGET_CONFIG, ...widget } : DEFAULT_WIDGET_CONFIG);
    setShowBuilder(true);
  }, []);

  const closeBuilder = useCallback(() => {
    setShowBuilder(false);
    setEditingWidget(null);
    setWidgetConfig(DEFAULT_WIDGET_CONFIG);
  }, []);

  const handleSave = useCallback(() => {
    if (editingWidget) {
      setWidgets(prev => prev.map(w => w.id === editingWidget.id ? { ...w, ...widgetConfig } : w));
    } else {
      const newWidget = { ...widgetConfig, id: 'w' + Date.now() };
      setWidgets(prev => [...prev, newWidget]);
    }
    closeBuilder();
  }, [editingWidget, widgetConfig, setWidgets, closeBuilder]);

  // ── Widget actions ────────────────────────────────────────────────────────
  const handleDelete = useCallback((id) => {
    logger.log(`[handleDelete] Deleting widget: ${id}`);
    
    // Clear any cached widget data that might interfere
    try {
      localStorage.removeItem(`wdg_${storageKey}`);
      logger.log(`[handleDelete] Cleared localStorage cache for ${storageKey}`);
    } catch (e) {
      logger.warn(`[handleDelete] Failed to clear localStorage:`, e);
    }
    
    // Remove widget from widgets array (skip save to prevent reload)
    setWidgets(prev => {
      const newWidgets = prev.filter(w => w.id !== id);
      logger.log(`[handleDelete] Widgets after removal: ${newWidgets.length}`);
      return newWidgets;
    }, true); // Skip save to prevent Firestore reload
    
    // Remove from minimized state
    setMinimizedIds(prev => {
      const newState = { ...prev };
      delete newState[id];
      logger.log(`[handleDelete] MinimizedIds after removal:`, newState);
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
    logger.log(`[handleMinimize] Toggling widget: ${id}`);
    
    // Get current minimized state
    const currentMinimized = minimizedIds[id];
    const isMinimizing = !currentMinimized;
    
    logger.log(`[handleMinimize] ${isMinimizing ? 'Minimizing' : 'Restoring'} widget ${id}`);
    
    // Clear any cached widget data that might interfere
    try {
      localStorage.removeItem(`wdg_${storageKey}`);
      logger.log(`[handleMinimize] Cleared localStorage cache for ${storageKey}`);
    } catch (e) {
      logger.warn(`[handleMinimize] Failed to clear localStorage:`, e);
    }
    
    // Update minimized state
    setMinimizedIds(prev => {
      const newState = { ...prev, [id]: isMinimizing };
      logger.log(`[handleMinimize] Updated minimizedIds:`, newState);
      return newState;
    });
    
    // Update the specific widget layout
    setWidgets(prev => {
      const updatedWidgets = prev.map(widget => {
        if (widget.id === id) {
          const updatedWidget = {
            ...widget,
            layout: {
              ...widget.layout,
              w: isMinimizing ? 4 : 3,  // Fixed 3 width when restored
              h: isMinimizing ? 1 : 5,  // Fixed 5 height when restored
              static: false,  // Always allow dragging
              isResizable: !isMinimizing  // Allow resizing when not minimized
            }
          };
          logger.log(`[handleMinimize] Updated widget ${id} layout:`, updatedWidget.layout);
          return updatedWidget;
        }
        return widget;
      });
      logger.log(`[handleMinimize] Total widgets updated: ${updatedWidgets.length}`);
      return updatedWidgets;
    }, true); // Skip save to prevent Firestore reload
  }, [minimizedIds, storageKey, setWidgets]);

  /**
   * Per-widget refresh: just bumps a version counter so the chart re-renders
   * from the already-loaded rawData. No Firebase call needed — rawData is live.
   */
  const handleRefreshWidget = useCallback((id) => {
    setWidgetVersions(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setWidgetUpdatedAt(prev => ({ ...prev, [id]: Date.now() }));
    setRecentlyRefreshed(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setRecentlyRefreshed(prev => ({ ...prev, [id]: false })), 1400);
  }, []);

  // ── Pre-compute chart data for all widgets (memoized with optimization) ─────
  // Using optimized data processor with caching
  const chartDataMap = useMemo(() => {
    const map = {};
    sortedWidgets.forEach(w => {
      // Use optimized processor for better performance
      map[w.id] = processWidgetDataOptimized(w, rawData, globalFilters);
    });
    return map;
  }, [sortedWidgets, rawData, globalFilters]);

  // ── Chart rendering ───────────────────────────────────────────────────────
  const handleChartClick = useCallback((widget, dataPoint) => {
    // Create a new list widget based on the clicked pie chart slice
    const newListWidget = {
      id: 'list-' + Date.now(),
      title: `${widget.title} - ${dataPoint.label}`,
      chartType: 'list',
      dataSource: widget.dataSource,
      groupBy: widget.groupBy,
      filterValue: dataPoint.label,
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
    
    // Add the new list widget to the widgets list
    setWidgets(prev => [...prev, newListWidget]);
  }, [setWidgets]);

  const renderChart = useCallback((widget, size) => {
    const data = chartDataMap[widget.id] || [];
    
    return (
      <OptimizedChartRenderer 
        widget={widget}
        size={size}
        data={data}
        accentColor={accentColor}
        rawData={rawData}
        onPointClick={(dp) => handleChartClick(widget, dp)}
      />
    );
  }, [chartDataMap, handleChartClick, accentColor, rawData]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Scoped CSS */}
      <style>{`
        .rgl-engine .react-grid-item.react-grid-placeholder {
          background: ${accentColor}33;
          border: 2px dashed ${accentColor};
          border-radius: 16px;
          opacity: 0.8;
        }
        .rgl-engine .react-resizable-handle {
          background-color: ${accentColor};
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .rgl-engine .react-grid-item:hover .react-resizable-handle { opacity: 0.8; }
        .rgl-engine .react-grid-item:hover .widget-actions { opacity: 1 !important; }
        .rgl-engine .react-grid-item { transition: all 200ms ease; transition-property: left, top, width, height; }
        .rgl-engine .react-grid-item.cssTransforms { transition-property: transform, width, height; }
        .rgl-engine .react-grid-item.resizing,
        .rgl-engine .react-grid-item.react-draggable-dragging { transition: none; z-index: 100; }
      `}</style>

      {/* ── Toolbar: always-visible Add Widget button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={() => openBuilder()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.6rem 1.2rem',
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            color: 'white', border: 'none', borderRadius: 8,
            cursor: 'pointer', fontWeight: 700, fontSize: 14,
            boxShadow: `0 2px 8px ${accentColor}44`
          }}
        >
          {getThemedIcon('ui', 'plus', 16, theme) || '+'}
          {t('add_widget') || 'Add Widget'}
        </button>
      </div>

      {/* ── Grid ── */}
      <ResponsiveGrid
        className="layout rgl-engine"
        layout={gridLayout}
        cols={12}
        rowHeight={64}
        isDraggable={editLayout}
        isResizable={editLayout && Object.keys(minimizedIds).filter(k => minimizedIds[k]).length === 0}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
        resizeHandles={['se', 'sw', 'ne', 'nw']}
        compactType="vertical"
        preventCollision={false}
        margin={[12, 12]}
      >
        {sortedWidgets.map(widget => (
          <div key={widget.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <WidgetWrapper
              widget={widget}
              accentColor={accentColor}
              isMinimized={!!minimizedIds[widget.id]}
              onMinimize={() => handleMinimize(widget.id)}
              onEdit={() => openBuilder(widget)}
              onDelete={() => handleDelete(widget.id)}
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

      {/* ── Empty state ── */}
      {!dashLoading && sortedWidgets.length === 0 && (
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
      />
    </>
  );
};

export default DashboardEngine;
