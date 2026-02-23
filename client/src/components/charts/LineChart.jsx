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
  
  // Check for Arabic name first (handle both snake_case and camelCase)
  if (lang === 'ar') {
    return item.localize || item.name_ar || item.nameAr || item.title_ar || item.titleAr || item.name || item.title || item.code || item.docId || '';
  }
  
  // Default to English
  return item.name_en || item.nameEn || item.name || item.title || item.code || item.docId || '';
};

/**
 * Custom Line Chart Component (Pure React/SVG)
 * @param {Array} data - Array of {label, value}
 * @param {Number} width - Chart width
 * @param {Number} height - Chart height
 * @param {String} color - Line color
 * @param {Boolean} showArea - Fill area under line
 */
function LineChart({ data = [], size = { width: 400, height: 300 }, accentColor = '#800020', showArea = true, showPoints = true, showGrid = true }) {
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

  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data.map(d => d.value || 0), 1);
  const minValue = Math.min(...data.map(d => d.value || 0), 0);
  const range = maxValue - minValue || 1;
  
  const stepX = chartWidth / (data.length - 1 || 1);

  // Generate path
  const points = data.map((item, idx) => {
    const x = padding.left + idx * stepX;
    const y = padding.top + chartHeight - ((item.value - minValue) / range) * chartHeight;
    const localizedLabel = getLocalizedName(item, lang) || item.label;
    return { x, y, label: localizedLabel, value: item.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  const areaPath = showArea
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
    : '';

  return (
    <svg width={width} height={height} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Grid lines */}
      {showGrid && (
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartHeight * (1 - ratio);
            const value = minValue + range * ratio;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={accentColor}
          fillOpacity="0.2"
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {showPoints && points.map((p, idx) => (
        <g key={idx}>
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            fill="white"
            stroke={accentColor}
            strokeWidth="3"
          >
            <title>{`${p.label}: ${p.value}`}</title>
          </circle>
          
          {/* X-axis label */}
          <text
            x={p.x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
            transform={`rotate(-45, ${p.x}, ${height - padding.bottom + 20})`}
          >
            {p.label}
          </text>
        </g>
      ))}

      {/* Axes */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke="#374151"
        strokeWidth="2"
      />
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke="#374151"
        strokeWidth="2"
      />
    </svg>
  );
}

const LineChartMemo = memo(LineChart);
LineChartMemo.displayName = 'LineChart';
export default LineChartMemo;
