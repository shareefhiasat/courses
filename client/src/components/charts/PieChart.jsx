import React from 'react';

/**
 * Custom Pie/Donut Chart Component (Pure React/SVG)
 * @param {Array} data - Array of {label, value, color?}
 * @param {Number} size - Chart size
 * @param {Boolean} donut - Donut style
 */
export default function PieChart({ data = [], size = 300, donut = false, showLabels = true, showLegend = true }) {
  if (!data || data.length === 0) {
    return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;
  }

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0) {
    return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = Math.min(size / 2 - 40, 120);
  const innerRadius = donut ? radius * 0.6 : 0;

  const colors = ['#800020', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  let currentAngle = -90; // Start from top

  const slices = data.map((item, idx) => {
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

    return {
      path,
      color,
      label: item.label,
      value,
      percentage: percentage.toFixed(1),
      labelX,
      labelY
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {slices.map((slice, idx) => (
          <g key={idx}>
            <path
              d={slice.path}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.transformOrigin = `${centerX}px ${centerY}px`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)`}</title>
            </path>
            
            {showLabels && parseFloat(slice.percentage) > 5 && (
              <text
                x={slice.labelX}
                y={slice.labelY}
                textAnchor="middle"
                fontSize="12"
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
            fontSize="24"
            fontWeight="800"
            fill="#374151"
          >
            {total}
          </text>
        )}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: size }}>
          {slices.map((slice, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: slice.color }} />
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                {slice.label} ({slice.value})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
