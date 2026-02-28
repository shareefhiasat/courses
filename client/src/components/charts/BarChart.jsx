import React, { memo } from 'react';
import { useLang } from '@contexts/LangContext';

/**
 * Helper function to get localized name for chart items
 * @param {Object} item - Data item
 * @param {string} lang - Current language ('en' or 'ar')
 * @returns {string} Localized name
 */
const getLocalizedName = (item, lang) => {
  if (!item) return '';
  
  // Check for Arabic name first
  if (lang === 'ar') {
    return item.localize || item.nameAr || item.titleAr || item.name || item.title || item.code || item.docId || '';
  }
  
  // Default to English
  return item.nameEn || item.name || item.title || item.code || item.docId || '';
};

/**
 * Custom Bar Chart Component (Pure React/SVG)
 * @param {Array} data - Array of {label, value, color?}
 * @param {Number} width - Chart width
 * @param {Number} height - Chart height
 * @param {Boolean} horizontal - Horizontal bars
 */
function BarChart({ data = [], size = { width: 400, height: 300 }, horizontal = false, showValues = true, showGrid = true, accentColor = '#800020' }) {
  const { t, lang } = useLang();
  
  // Handle size as object with width/height or legacy width/height props
  let width, height;
  if (typeof size === 'object' && size.width && size.height) {
    width = size.width;
    height = size.height;
  } else if (typeof size === 'number') {
    width = size;
    height = size;
  } else {
    width = 400;
    height = 300;
  }
  
  if (!data || data.length === 0) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>{t('no_data') || 'No data'}</div>;
  }

  // Reduced padding for less wasted space
  const padding = { top: 15, right: 15, bottom: 45, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate responsive font sizes based on chart dimensions
  const axisFontSize = Math.max(8, Math.min(12, Math.min(width, height) / 25));
  const valueFontSize = Math.max(9, Math.min(14, Math.min(width, height) / 20));
  const labelFontSize = Math.max(9, Math.min(12, Math.min(width, height) / 25));
  
  const maxValue = Math.max(...data.map(d => d.value || 0), 1);
  const barWidth = horizontal ? chartHeight / data.length : chartWidth / data.length;
  const barGap = barWidth * 0.2;
  const actualBarWidth = barWidth - barGap;

  return (
    <svg width={width} height={height} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Grid lines */}
      {showGrid && (
        <g>
          {(() => {
            // Generate proper y-axis labels to avoid duplicates
            const steps = 5; // Number of grid lines
            const stepSize = maxValue / (steps - 1);
            const yLabels = [];
            
            for (let i = 0; i < steps; i++) {
              const value = Math.round(stepSize * i);
              if (!yLabels.includes(value)) {
                yLabels.push(value);
              }
            }
            
            // Ensure we have the max value at the end
            if (!yLabels.includes(maxValue)) {
              yLabels.push(maxValue);
            }
            
            return yLabels.map((value, i) => {
              const ratio = value / maxValue;
              const y = padding.top + chartHeight * (1 - ratio);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + chartWidth}
                    y2={y}
                    stroke="#9ca3af" // Changed to gray
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={axisFontSize} // Responsive font
                    fontWeight="bold"
                    fill="#6b7280"
                  >
                    {value}
                  </text>
                </g>
              );
            });
          })()}
        </g>
      )}

      {/* Bars */}
      {data.map((item, idx) => {
        const value = item.value || 0;
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding.left + idx * barWidth + barGap / 2;
        const y = padding.top + chartHeight - barHeight;
        const color = item.color || accentColor;
        const localizedLabel = getLocalizedName(item, lang) || item.label;

        return (
          <g key={idx}>
            <rect
              x={x}
              y={y}
              width={actualBarWidth}
              height={barHeight}
              fill={color}
              rx="4"
              style={{ transition: 'all 0.3s ease' }}
            >
              <title>{`${localizedLabel}: ${value}`}</title>
            </rect>
            
            {/* Value label on top */}
            {showValues && (
              <text
                x={x + actualBarWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize={valueFontSize} // Responsive font
                fontWeight="600"
                fill="#374151"
              >
                {value}
              </text>
            )}

            {/* X-axis label */}
            <text
              x={x + actualBarWidth / 2}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize={labelFontSize} // Responsive font
              fontWeight="normal"
              fill="#000000" // Changed to black for better readability
              transform={`rotate(-45, ${x + actualBarWidth / 2}, ${height - padding.bottom + 20})`}
            >
              {localizedLabel}
            </text>
          </g>
        );
      })}

      {/* Axes - changed to gray */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke="#9ca3af" // Changed to gray
        strokeWidth="2"
      />
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke="#9ca3af" // Changed to gray
        strokeWidth="2"
      />
    </svg>
  );
}

const BarChartMemo = memo(BarChart);
BarChartMemo.displayName = 'BarChart';
export default BarChartMemo;
