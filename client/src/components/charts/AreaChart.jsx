import React from 'react';

/**
 * Custom Area Chart Component (Pure React/SVG)
 * Stacked or grouped area charts
 */
export default function AreaChart({ data = [], width = 400, height = 300, colors = ['#667eea', '#10b981', '#f59e0b'], showGrid = true, stacked = false }) {
  if (!data || data.length === 0) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;
  }

  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Assume data is array of {label, values: [v1, v2, v3...]}
  const seriesCount = data[0]?.values?.length || 0;
  
  let maxValue = 0;
  if (stacked) {
    maxValue = Math.max(...data.map(d => (d.values || []).reduce((a, b) => a + b, 0)), 1);
  } else {
    maxValue = Math.max(...data.flatMap(d => d.values || []), 1);
  }
  
  const stepX = chartWidth / (data.length - 1 || 1);

  // Generate paths for each series
  const series = [];
  for (let s = 0; s < seriesCount; s++) {
    const points = data.map((item, idx) => {
      const x = padding.left + idx * stepX;
      let value = item.values[s] || 0;
      
      // For stacked, add previous series values
      if (stacked) {
        for (let prev = 0; prev < s; prev++) {
          value += item.values[prev] || 0;
        }
      }
      
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    let areaPath;
    if (stacked && s > 0) {
      // Connect to previous series
      const prevPoints = series[s - 1].points;
      const bottomPath = prevPoints.reverse().map((p, i) => `${i === 0 ? 'L' : 'L'} ${p.x} ${p.y}`).join(' ');
      areaPath = `${linePath} ${bottomPath} Z`;
    } else {
      areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;
    }

    series.push({
      points,
      linePath,
      areaPath,
      color: colors[s % colors.length]
    });
  }

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

      {/* Areas */}
      {series.map((s, idx) => (
        <g key={idx}>
          <path
            d={s.areaPath}
            fill={s.color}
            fillOpacity="0.6"
          />
          <path
            d={s.linePath}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}

      {/* X-axis labels */}
      {data.map((item, idx) => {
        const x = padding.left + idx * stepX;
        return (
          <text
            key={idx}
            x={x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="11"
            fill="#6b7280"
            transform={`rotate(-45, ${x}, ${height - padding.bottom + 20})`}
          >
            {item.label}
          </text>
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
