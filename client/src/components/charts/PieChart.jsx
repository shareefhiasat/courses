import React, { useState } from 'react';

/**
 * Custom Pie/Donut Chart Component (Pure React/SVG)
 * @param {Array} data - Array of {label, value, color?}
 * @param {Number} size - Chart size
 * @param {Boolean} donut - Donut style
 */
export default function PieChart({ data = [], size = 300, donut = false, showLabels = true, showLegend = true, accentColor = '#800020', rawData = [], chartType = 'pie' }) {
  const [showDetails, setShowDetails] = useState(false);
  
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

  // Get unknown items details
  const getUnknownItems = () => {
    if (!rawData || typeof rawData !== 'object') return [];
    
    let sourceData = [];
    
    // Get the appropriate data source based on chartType
    if (chartType === 'activity') {
      // Combine activities, announcements, and resources
      sourceData = [
        ...(rawData.activities || []),
        ...(rawData.announcements || []),
        ...(rawData.resources || [])
      ];
    } else if (chartType === 'attendance') {
      sourceData = rawData.attendance || [];
    } else if (chartType === 'enrollment') {
      sourceData = rawData.enrollments || [];
    } else {
      // Default: try to find any array in rawData
      sourceData = Object.values(rawData).find(item => Array.isArray(item)) || [];
    }
    
    if (!Array.isArray(sourceData)) return [];
    
    return sourceData.filter(item => {
      if (chartType === 'activity') {
        return !item.type || item.type === 'Unknown';
      } else if (chartType === 'attendance') {
        return !item.status || item.status === 'Unknown';
      } else if (chartType === 'enrollment') {
        return !item.programId || !item.programId.startsWith('xMh3Tqzg4stjRohjwCGX');
      }
      return false;
    });
  };

  const unknownItems = getUnknownItems();
  
  // Add logging to confirm data source
  console.log('[PieChart] Data source:', chartType, 'Raw data keys:', Object.keys(rawData || {}));
  console.log('[PieChart] Unknown items count:', unknownItems.length);
  console.log('[PieChart] Sample unknown items:', unknownItems.slice(0, 3));

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
                onClick={() => {
                  if (unknownItems.length > 0) {
                    setShowDetails(true);
                  }
                }}
                style={{ 
                  transition: 'all 0.3s ease', 
                  cursor: unknownItems.length > 0 ? 'pointer' : 'default'
                }}
              >
                <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)${unknownItems.length > 0 ? ' - Click to see details' : ''}`}</title>
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
                  gap: 2,
                  cursor: unknownItems.length > 0 ? 'pointer' : 'default',
                  textDecoration: unknownItems.length > 0 ? 'underline' : 'none'
                }}
                onClick={() => {
                  if (unknownItems.length > 0) {
                    setShowDetails(true);
                  }
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

      {/* Side Panel Dialog */}
      {showDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          height: '100vh',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
              Unknown Items ({unknownItems.length})
            </h3>
            <button
              onClick={() => setShowDetails(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            {unknownItems.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center' }}>No unknown items found</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Grid Header */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: chartType === 'activity' ? '2fr 2fr 1fr 1fr' : '1fr 1fr 1fr 1fr',
                  gap: '8px',
                  padding: '8px',
                  background: 'var(--bg)',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: 'var(--muted)',
                  borderBottom: '1px solid var(--border)'
                }}>
                  {chartType === 'activity' && (
                    <>
                      <div>Type</div>
                      <div>Title</div>
                      <div>ID</div>
                      <div>Created</div>
                    </>
                  )}
                  {chartType === 'attendance' && (
                    <>
                      <div>Status</div>
                      <div>Date</div>
                      <div>Student ID</div>
                      <div>Class ID</div>
                    </>
                  )}
                  {chartType === 'enrollment' && (
                    <>
                      <div>Program ID</div>
                      <div>Student ID</div>
                      <div>Class ID</div>
                      <div>Status</div>
                    </>
                  )}
                </div>

                {/* Grid Content */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  {unknownItems.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'grid',
                      gridTemplateColumns: chartType === 'activity' ? '2fr 2fr 1fr 1fr' : '1fr 1fr 1fr 1fr',
                      gap: '8px',
                      padding: '8px',
                      background: idx % 2 === 0 ? 'var(--panel)' : 'var(--bg)',
                      borderRadius: '4px',
                      fontSize: '9px',
                      alignItems: 'center',
                      border: '1px solid var(--border)'
                    }}>
                      {chartType === 'activity' && (
                        <>
                          <div style={{ color: 'var(--text)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.type || 'Not specified'}
                          </div>
                          <div style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title || item.name || 'Not specified'}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(item.id || item.docId || 'Not specified').slice(0, 8)}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '8px' }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </>
                      )}
                      
                      {chartType === 'attendance' && (
                        <>
                          <div style={{ color: 'var(--text)', fontWeight: '500' }}>
                            {item.status || 'Not specified'}
                          </div>
                          <div style={{ color: 'var(--muted)' }}>
                            {item.date || item.createdAt ? new Date(item.date || item.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(item.studentId || 'Not specified').slice(0, 8)}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(item.classId || 'Not specified').slice(0, 8)}
                          </div>
                        </>
                      )}
                      
                      {chartType === 'enrollment' && (
                        <>
                          <div style={{ color: 'var(--text)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.programId || 'Not specified'}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(item.studentId || 'Not specified').slice(0, 8)}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(item.classId || 'Not specified').slice(0, 8)}
                          </div>
                          <div style={{ color: 'var(--muted)' }}>
                            {item.status || 'Not specified'}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {showDetails && (
        <div
          onClick={() => setShowDetails(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999
          }}
        />
      )}
    </>
  );
}
