import React, { useState, useMemo } from 'react';

/**
 * Custom Pie/Donut Chart Component (Pure React/SVG)
 * @param {Array} data - Array of {label, value, color?}
 * @param {Number} size - Chart size
 * @param {Boolean} donut - Donut style
 */
export default function PieChart({ data = [], size = 300, donut = false, showLabels = true, showLegend = true, accentColor = '#800020', rawData = [], chartType = 'pie', onSliceClick = null }) {
  
  // Handle size as object with width/height or number
  let chartWidth, chartHeight;
  if (typeof size === 'object' && size.width && size.height) {
    chartWidth = size.width;
    chartHeight = size.height;
  } else if (typeof size === 'number') {
    chartWidth = size;
    chartHeight = size;
  } else {
    chartWidth = 300;
    chartHeight = 300;
  }
  
  // Use the smaller dimension for the chart to ensure it fits
  const chartSize = Math.min(chartWidth, chartHeight);
  
  if (!data || data.length === 0) {
    return <div style={{ width: chartWidth, height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;
  }

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0) {
    return <div style={{ width: chartWidth, height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;
  }

  const centerX = chartSize / 2;
  const centerY = chartSize / 2;
  const radius = Math.min(chartSize / 2 - 15, 100); // Much smaller padding
  const innerRadius = donut ? radius * 0.6 : 0;

  const colors = [accentColor, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  // Memoize slices calculation to prevent unnecessary re-renders
  const slices = useMemo(() => {
    if (!data || data.length === 0 || total === 0) return [];
    
    let currentAngle = -90; // Start from top
    const calculatedSlices = [];

    data.forEach((item, idx) => {
      const value = item.value || 0;
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const color = item.color || colors[idx % colors.length];

      // Calculate path
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      let path;
      if (donut) {
        const ix1 = centerX + innerRadius * Math.cos(startRad);
        const iy1 = centerY + innerRadius * Math.sin(startRad);
        const ix2 = centerX + innerRadius * Math.cos(endRad);
        const iy2 = centerY + innerRadius * Math.sin(endRad);
        
        path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
      } else {
        path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }

      // Label position
      const labelAngle = (startAngle + endAngle) / 2;
      const labelRad = (labelAngle * Math.PI) / 180;
      const labelRadius = donut ? (radius + innerRadius) / 2 : radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(labelRad);
      const labelY = centerY + labelRadius * Math.sin(labelRad);

      calculatedSlices.push({
        path,
        color,
        label: item.label,
        value,
        percentage: percentage.toFixed(1),
        labelX,
        labelY
      });
    });

    return calculatedSlices;
  }, [data, total, centerX, centerY, radius, innerRadius, donut, colors]);

  // Memoize click handler
  const handleSliceClick = useMemo(() => (slice) => {
    // Call external callback if provided
    if (onSliceClick) {
      onSliceClick(slice);
    }
  }, [onSliceClick]);
  
  // Disable all logging to prevent console spam
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('[PieChart] Data source:', chartType, 'Raw data keys:', Object.keys(rawData || {}));
  //   console.log('[PieChart] Available slices:', data.map(d => d.label));
  // }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: chartWidth, height: chartHeight }}>
        <svg width={chartSize} height={chartSize} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {slices.map((slice, idx) => (
            <g key={idx}>
              <path
                d={slice.path}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                style={{ 
                  transition: 'all 0.3s ease', 
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.transformOrigin = `${centerX}px ${centerY}px`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onClick={() => handleSliceClick(slice)}
              >
                <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)`}</title>
              </path>
              
              {showLabels && parseFloat(slice.percentage) > 5 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="white"
                  style={{ pointerEvents: 'none' }}
                >
                  {slice.percentage}%
                </text>
              )}
            </g>
          ))}

          {/* Center text for donut */}
          {donut && (
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fontWeight="800"
              fill="#374151"
            >
              {total}
            </text>
          )}
        </svg>

        {/* Legend */}
        {showLegend && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: chartWidth }}>
            {slices.map((slice, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 1, background: slice.color }} />
                <span style={{ fontSize: 9, color: '#6b7280' }}>
                  {slice.label} ({slice.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
