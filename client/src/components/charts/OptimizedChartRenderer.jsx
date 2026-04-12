import React, { Suspense, memo, useMemo } from 'react';
import { SimpleLoading } from '@ui';


import { info, error, warn, debug } from '@services/utils/logger.js';// Lazy load chart components to reduce initial bundle size
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
  const chartProps = useMemo(() => ({
    data,
    accentColor,
    size,
    rawData,
    chartType: getChartTypeFromDataSource(dataSource),
    onSliceClick: onPointClick,
    ...widgetProps
  }), [data, accentColor, size, rawData, dataSource, onPointClick, widgetProps]);

  // Memoize the rendered chart to prevent unnecessary re-renders
  const renderedChart = useMemo(() => {
    switch (chartType) {
      case 'bar':
        return (
          <Suspense fallback={<ChartFallback size={size} />}>
            <BarChart {...chartProps} showValues={false} />
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
        // Calculate responsive font size
        const widgetSize = Math.max(size.width, size.height) / 50; // Convert pixels to grid units (approximate)
        const calculatedFont = Math.max(2.5, Math.min(7, widgetSize * 0.9)) + 'rem'; // Smaller font: 2.5-7rem, 0.9x scaling
        
        return (
          <div style={{ 
            width: '100%',
            height: '100%',
            padding: size.width <= 180 ? '0.1rem' : (size.height <= 100 ? '0.25rem' : '0.5rem'), // Use pixel values for padding
            textAlign: 'center', 
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: calculatedFont, // Use the calculated font
            fontWeight: 'normal',
            background: `linear-gradient(135deg, ${accentColor}35 0%, ${accentColor}25 100%)`, // Even darker background
            borderRadius: '12px',
            border: `3px solid ${accentColor}40`, // Thicker border
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box' // Ensure padding doesn't overflow
          }}>
            {/* Animated background effect */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, ${accentColor}10 0%, transparent 70%)`,
              animation: 'pulse 3s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
            
            {/* Main number - perfectly centered and flexible */}
            <div style={{
              fontSize: 'inherit',
              fontWeight: 'inherit',
              color: accentColor,
              textShadow: `0 2px 8px ${accentColor}30`,
              position: 'relative',
              zIndex: 1,
              animation: 'countIn 0.6s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              flex: 1,
              lineHeight: 1.1 // Tighter line height for better fit
            }}>
              {data.length > 0 ? data[0].value.toLocaleString() : 0}
            </div>
          </div>
        );
      
      default:
        if (import.meta.env.MODE === 'development') {
          warn(`[OptimizedChartRenderer] Unknown chart type: ${chartType}`);
        }
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
  }, [chartType, chartProps, size, data]);

  return renderedChart;
});

OptimizedChartRenderer.displayName = 'OptimizedChartRenderer';

// Add CSS animations for count widget
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.6;
    }
  }
  
  @keyframes countIn {
    0% {
      transform: scale(0.8) translateY(20px);
      opacity: 0;
    }
    50% {
      transform: scale(1.1) translateY(-5px);
    }
    100% {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }
`;
if (!document.head.querySelector('style[data-count-widget]')) {
  style.setAttribute('data-count-widget', 'true');
  document.head.appendChild(style);
}

export default OptimizedChartRenderer;
