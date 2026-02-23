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
  const [originalSizes, setOriginalSizes] = useState({}); // Store original sizes before minimize
  const [widgetVersions, setWidgetVersions] = useState({});   // bump → forces re-render of that chart
  const [recentlyRefreshed, setRecentlyRefreshed] = useState({});
  const [widgetUpdatedAt, setWidgetUpdatedAt] = useState({});

  // ── Clear problematic localStorage cache on mount (only if corrupted) ───────────
  useEffect(() => {
    // Only clear localStorage if it's corrupted, not on every mount
    // This prevents the flash when loading widgets
    try {
      const saved = localStorage.getItem(`wdg_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only clear if the data is corrupted (not an array)
        if (!Array.isArray(parsed?.widgets)) {
          localStorage.removeItem(`wdg_${storageKey}`);
          logger.log(`[DashboardEngine] Cleared corrupted localStorage cache for ${storageKey}`);
        }
      }
    } catch (e) {
      // Only clear if there's an actual error parsing
      localStorage.removeItem(`wdg_${storageKey}`);
      logger.warn(`[DashboardEngine] Cleared invalid localStorage cache for ${storageKey}:`, e);
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
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    const layout = sortedWidgets.map(w => {
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
      if (process.env.NODE_ENV === 'development') {
        logger.log(`[gridLayout] Widget ${w.id}: minimized=${isMinimized}, w=${item.w}, h=${item.h}, original=${JSON.stringify(originalSize)}, RTL=${isRTL}, x=${x}`);
      }
      return item;
    });
    if (process.env.NODE_ENV === 'development') {
      logger.log(`[gridLayout] Total widgets in layout: ${layout.length}, RTL=${isRTL}`);
    }
    return layout;
  }, [sortedWidgets, minimizedIds, originalSizes]);

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
    if (process.env.NODE_ENV === 'development') {
      logger.log(`[handleDelete] Deleting widget: ${id}`);
    }
    
    // Clear any cached widget data that might interfere
    try {
      localStorage.removeItem(`wdg_${storageKey}`);
      if (process.env.NODE_ENV === 'development') {
        logger.log(`[handleDelete] Cleared localStorage cache for ${storageKey}`);
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`[handleDelete] Failed to clear localStorage:`, e);
      }
    }
    
    // Remove widget from widgets array (allow save to persist deletion)
    setWidgets(prev => {
      const newWidgets = prev.filter(w => w.id !== id);
      if (process.env.NODE_ENV === 'development') {
        logger.log(`[handleDelete] Widgets after removal: ${newWidgets.length}`);
      }
      return newWidgets;
    }); // Allow save to persist deletion
    
    // Remove from minimized state
    setMinimizedIds(prev => {
      const newState = { ...prev };
      delete newState[id];
      if (process.env.NODE_ENV === 'development') {
        logger.log(`[handleDelete] MinimizedIds after removal:`, newState);
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
    if (process.env.NODE_ENV === 'development') {
      logger.log(`[handleMinimize] Toggling widget: ${id}`);
    }
    
    // Get current minimized state
    const currentMinimized = minimizedIds[id];
    const isMinimizing = !currentMinimized;
    
    if (process.env.NODE_ENV === 'development') {
      logger.log(`[handleMinimize] ${isMinimizing ? 'Minimizing' : 'Restoring'} widget ${id}`);
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
        if (process.env.NODE_ENV === 'development') {
          logger.log(`[handleMinimize] Stored original size for ${id}:`, { w: currentWidth, h: currentHeight });
        }
      }
    }
    
    // Clear any cached widget data that might interfere
    try {
      localStorage.removeItem(`wdg_${storageKey}`);
      if (process.env.NODE_ENV === 'development') {
        logger.log(`[handleMinimize] Cleared localStorage cache for ${storageKey}`);
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`[handleMinimize] Failed to clear localStorage:`, e);
      }
    }
    
    // Update minimized state
    setMinimizedIds(prev => {
      const newState = { ...prev, [id]: isMinimizing };
      if (process.env.NODE_ENV === 'development') {
        logger.log(`[handleMinimize] Updated minimizedIds:`, newState);
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
          if (process.env.NODE_ENV === 'development') {
            logger.log(`[handleMinimize] Updated widget ${id} layout:`, updatedWidget.layout);
          }
          return updatedWidget;
        }
        return widget;
      });
      if (process.env.NODE_ENV === 'development') {
        logger.log(`[handleMinimize] Total widgets updated: ${updatedWidgets.length}`);
      }
      return updatedWidgets;
    }, true); // Skip save to prevent Firestore reload
  }, [minimizedIds, originalSizes, storageKey, setWidgets, widgets]);

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
  }, [sortedWidgets.map(w => w.id).join(','), rawData?.activities?.length || 0, rawData?.attendance?.length || 0, rawData?.enrollments?.length || 0, Object.keys(globalFilters).join(',')]);

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
          className="layout rgl-engine"
          layout={gridLayout}
          cols={12}
          rowHeight={64}
          isDraggable={editLayout}
          isResizable={editLayout}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          resizeHandles={editLayout ? ['se', 'sw', 'ne', 'nw'] : []}
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
      )}

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
