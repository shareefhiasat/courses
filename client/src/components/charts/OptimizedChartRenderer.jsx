import React, { Suspense, memo } from 'react';
import { SimpleLoading } from '@ui';

// Lazy load chart components to reduce initial bundle size
const BarChart = React.lazy(() => import('../charts/BarChart'));
const LineChart = React.lazy(() => import('../charts/LineChart'));
const PieChart = React.lazy(() => import('../charts/PieChart'));
const ListChart = React.lazy(() => import('../charts/ListChart'));

/**
 * Chart loading fallback component
 */
const ChartFallback = memo(({ size = { w: 4, h: 3 } }) => {
  const height = size.h * 64; // rowHeight is 64px
  return (
    <div 
      style={{ 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--panel)',
        borderRadius: 8,
        border: '1px solid var(--border)'
      }}
    >
      <SimpleLoading loading={false} type="brand" size="sm" />
    </div>
  );
});
ChartFallback.displayName = 'ChartFallback';

// Helper function to determine chart type from data source
const getChartTypeFromDataSource = (dataSource) => {
  if (dataSource.includes('activities') || dataSource.includes('announcements') || dataSource.includes('resources')) {
    return 'activity';
  } else if (dataSource === 'attendance') {
    return 'attendance';
  } else if (dataSource === 'enrollments') {
    return 'enrollment';
  }
  return 'list'; // Default to list for unknown types
};

/**
 * Optimized Chart Renderer with lazy loading and memoization
 * 
 * @param {Object} widget - Widget configuration
 * @param {Object} size - Widget size from grid layout
 * @param {Object} data - Processed widget data
 * @param {string} accentColor - Theme accent color
 * @param {Object} rawData - Raw data for unknown items details
 * @param {Function} onPointClick - Click handler for chart points
 * @returns {React.Component} Rendered chart
 */
const OptimizedChartRenderer = memo(({ widget, size, data, accentColor, rawData, onPointClick }) => {
  const { chartType, dataSource, ...widgetProps } = widget;

  // Memoize chart props to prevent unnecessary re-renders
  const chartProps = React.useMemo(() => ({
    data,
    accentColor,
    size,
    rawData,
    chartType: getChartTypeFromDataSource(dataSource),
    onSliceClick: onPointClick,
    ...widgetProps
  }), [data, accentColor, size, rawData, dataSource, onPointClick, widgetProps]);

  // Render appropriate chart based on type
  switch (chartType) {
    case 'bar':
      return (
        <Suspense fallback={<ChartFallback size={size} />}>
          <BarChart {...chartProps} />
        </Suspense>
      );
    
    case 'line':
      return (
        <Suspense fallback={<ChartFallback size={size} />}>
          <LineChart {...chartProps} />
        </Suspense>
      );
    
    case 'pie':
      return (
        <Suspense fallback={<ChartFallback size={size} />}>
          <PieChart {...chartProps} donut={false} />
        </Suspense>
      );
    
    case 'donut':
      return (
        <Suspense fallback={<ChartFallback size={size} />}>
          <PieChart {...chartProps} donut={true} />
        </Suspense>
      );
    
    case 'list':
      return (
        <Suspense fallback={<ChartFallback size={size} />}>
          <ListChart {...chartProps} />
        </Suspense>
      );
    
    case 'count':
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: 'var(--text)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          {data.length > 0 ? data[0].value : 0}
        </div>
      );
    
    default:
      console.warn(`[OptimizedChartRenderer] Unknown chart type: ${chartType}`);
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: 'var(--muted)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Unknown chart type: {chartType}
        </div>
      );
  }
});

OptimizedChartRenderer.displayName = 'OptimizedChartRenderer';

export default OptimizedChartRenderer;
