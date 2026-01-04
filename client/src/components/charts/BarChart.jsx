import React from 'react';

/**
 * Custom Bar Chart Component (Pure React/SVG)
 * @param {Array} data - Array of {label, value, color?}
 * @param {Number} width - Chart width
 * @param {Number} height - Chart height
 * @param {Boolean} horizontal - Horizontal bars
 */
export default function BarChart({ data = [], width = 400, height = 300, horizontal = false, showValues = true, showGrid = true }) {
  if (!data || data.length === 0) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;
  }

  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data.map(d => d.value || 0), 1);
  const barWidth = horizontal ? chartHeight / data.length : chartWidth / data.length;
  const barGap = barWidth * 0.2;
  const actualBarWidth = barWidth - barGap;

  return (
    <svg width={width} height={height} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Grid lines */}
      {showGrid && (
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartHeight * (1 - ratio);
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
                  {Math.round(maxValue * ratio)}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Bars */}
      {data.map((item, idx) => {
        const value = item.value || 0;
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding.left + idx * barWidth + barGap / 2;
        const y = padding.top + chartHeight - barHeight;
        const color = item.color || '#800020';

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
              <title>{`${item.label}: ${value}`}</title>
            </rect>
            
            {/* Value label on top */}
            {showValues && (
              <text
                x={x + actualBarWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="12"
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
              fontSize="11"
              fill="#6b7280"
              transform={`rotate(-45, ${x + actualBarWidth / 2}, ${height - padding.bottom + 20})`}
            >
              {item.label}
            </text>
          </g>
        );
      })}

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
