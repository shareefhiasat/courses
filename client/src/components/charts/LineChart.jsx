import React from 'react';

/**
 * Custom Line Chart Component (Pure React/SVG)
 * @param {Array} data - Array of {label, value}
 * @param {Number} width - Chart width
 * @param {Number} height - Chart height
 * @param {String} color - Line color
 * @param {Boolean} showArea - Fill area under line
 */
export default function LineChart({ data = [], width = 400, height = 300, color = '#800020', showArea = true, showPoints = true, showGrid = true }) {
  if (!data || data.length === 0) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;
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
    return { x, y, label: item.label, value: item.value };
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
          fill={color}
          fillOpacity="0.2"
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
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
            stroke={color}
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
