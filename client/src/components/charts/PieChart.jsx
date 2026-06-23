import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '@contexts/LangContext';
import { PIE_LEGEND_TEXT_STYLE, PIE_LEGEND_ITEM_BG } from './chartLabelStyles';

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
 * Custom Pie/Donut Chart Component (Pure React/SVG)
 * @param {Array} data - Array of {label, value, color?}
 * @param {Number} size - Chart size
 * @param {Boolean} donut - Donut style
 */
export default function PieChart({ data = [], size = 300, donut = false, showLabels = true, showLegend = true, accentColor = '#800020', rawData = [], chartType = 'pie', onSliceClick = null }) {
  const { t, lang, isRTL } = useLang();
  const [hovered, setHovered] = useState(null);

  const activeData = useMemo(
    () => (data || []).filter((item) => (item.value || 0) > 0),
    [data],
  );// Handle size as object with width/height or number
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
  const baseLegendReserve = showLegend ? Math.min(72, Math.max(48, chartHeight * 0.2)) : 0;
  const tentativeSize = Math.min(chartWidth, Math.max(120, chartHeight - baseLegendReserve));
  const sideLegend = showLegend && chartWidth >= tentativeSize + 100;
  const chartSize = sideLegend
    ? Math.min(chartWidth - 108, chartHeight)
    : tentativeSize;
  const legendReserve = showLegend && !sideLegend ? baseLegendReserve : 0;
  const legendWidth = sideLegend ? Math.max(120, chartWidth - chartSize - 16) : chartWidth;
  // Calculate responsive font sizes based on chart size
  const labelFontSize = Math.max(8, Math.min(14, chartSize / 20));
  const centerFontSize = Math.max(12, Math.min(20, chartSize / 15));
  const legendFontSize = Math.max(10, Math.min(13, chartSize / 22));

  const total = useMemo(
    () => activeData.reduce((sum, item) => sum + (item.value || 0), 0),
    [activeData],
  );

  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  let radius;
  if (showLegend && chartHeight < 200) {
    radius = Math.min(chartSize / 2 - 20, chartSize * 0.35);
  } else if (showLegend && chartHeight < 300) {
    radius = Math.min(chartSize / 2 - 15, chartSize * 0.40);
  } else {
    radius = Math.min(chartSize / 2 - 5, chartSize * 0.45);
  }

  const innerRadius = donut ? radius * 0.6 : 0;
  const colors = [accentColor, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  const slices = useMemo(() => {
    if (!activeData || activeData.length === 0 || total === 0) return [];
    
    let currentAngle = -90; // Start from top
    const calculatedSlices = [];

    activeData.forEach((item, idx) => {
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
        
        // Special case for 360° full circle donut - use two semicircles
        if (angle >= 359.9) {
          path = `
            M ${centerX + radius} ${centerY}
            A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY}
            A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY}
            M ${centerX + innerRadius} ${centerY}
            A ${innerRadius} ${innerRadius} 0 1 0 ${centerX - innerRadius} ${centerY}
            A ${innerRadius} ${innerRadius} 0 1 0 ${centerX + innerRadius} ${centerY}
            Z
          `.replace(/\s+/g, ' ').trim();
        } else {
          path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
        }
      } else {
        // Special case for 360° full circle pie
        if (angle >= 359.9) {
          path = `
            M ${centerX} ${centerY}
            L ${centerX + radius} ${centerY}
            A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY}
            A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY}
            Z
          `.replace(/\s+/g, ' ').trim();
        } else {
          path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        }
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
        label: item.label || getLocalizedName(item, lang) || t('not_specified') || 'Unspecified',
        labelLines: item.labelLines,
        value,
        percentage: percentage.toFixed(1),
        labelX,
        labelY,
      });
    });

    return calculatedSlices;
  }, [activeData, total, centerX, centerY, radius, innerRadius, donut, colors, lang, t]);

  // Memoize click handler
  const handleSliceClick = useCallback((slice) => {
    // Call external callback if provided
    if (onSliceClick) {
      onSliceClick(slice);
    }
  }, [onSliceClick]);

  const getSliceLines = useCallback((slice) => {
    if (Array.isArray(slice.labelLines) && slice.labelLines.length > 0) {
      return slice.labelLines;
    }
    const label = slice.label || '';
    if (!label) return [t('not_specified') || 'Unspecified'];
    if (label.includes(' · ')) return label.split(' · ').map((s) => s.trim()).filter(Boolean);
    return [label];
  }, [t]);

  if (!activeData || activeData.length === 0 || total === 0) {
    return (
      <div style={{ width: chartWidth, height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: legendFontSize }}>
        {t('no_data') || 'No data'}
      </div>
    );
  }

  return (
    <>
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: sideLegend ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sideLegend ? 0 : 4,
        width: chartWidth,
        height: chartHeight,
        overflow: 'hidden',
      }}>
        <svg
          width={chartSize}
          height={chartSize}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif', flexShrink: 0 }}
          onMouseLeave={() => setHovered(null)}
        >
          {slices.map((slice, idx) => (
            <g key={idx}>
              <path
                d={slice.path}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                style={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  opacity: hovered?.idx === idx ? 1 : (hovered != null ? 0.55 : 1),
                }}
                onMouseEnter={(e) => {
                  setHovered({ idx, x: e.clientX, y: e.clientY });
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.transformOrigin = `${centerX}px ${centerY}px`;
                }}
                onMouseLeave={(e) => {
                  setHovered(null);
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseMove={(e) => {
                  setHovered((prev) => (prev?.idx === idx ? { ...prev, x: e.clientX, y: e.clientY } : prev));
                }}
                onClick={() => handleSliceClick(slice)}
              />
              
              {showLabels && parseFloat(slice.percentage) > 5 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  fontSize={labelFontSize}
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
              fontSize={centerFontSize}
              fontWeight="800"
              fill="var(--text)"
            >
              {total}
            </text>
          )}
        </svg>

        {/* Legend — transparent overlay; does not steal layout space from pie */}
        {showLegend && (
          <div style={{
            position: sideLegend ? 'absolute' : 'relative',
            insetInlineEnd: sideLegend ? 0 : undefined,
            top: sideLegend ? '50%' : undefined,
            transform: sideLegend ? 'translateY(-50%)' : undefined,
            display: 'flex',
            flexDirection: 'column',
            flexWrap: sideLegend ? 'nowrap' : 'wrap',
            gap: '0.2rem',
            justifyContent: 'center',
            alignItems: sideLegend ? 'flex-start' : 'center',
            maxWidth: sideLegend ? legendWidth : chartWidth,
            maxHeight: sideLegend ? chartSize : (legendReserve || 64),
            overflow: 'auto',
            padding: sideLegend ? '4px 6px' : '0 0.15rem',
            background: 'transparent',
            zIndex: 2,
            pointerEvents: 'none',
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {slices.map((slice, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 4,
                  minWidth: 0,
                  pointerEvents: 'auto',
                  background: PIE_LEGEND_ITEM_BG,
                  borderRadius: 4,
                  padding: '2px 5px',
                }}
                title={`${slice.label}\n${slice.value} (${slice.percentage}%)`}
              >
                <div style={{ width: 10, height: 10, borderRadius: 2, background: slice.color, marginTop: 2, flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.8), 0 1px 3px rgba(255,255,255,0.6)' }} />
                <span style={{
                  ...PIE_LEGEND_TEXT_STYLE,
                  fontSize: legendFontSize,
                  whiteSpace: sideLegend ? 'nowrap' : 'normal',
                  wordBreak: 'break-word',
                }}>
                  {slice.label} ({slice.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {hovered != null && slices[hovered.idx] && createPortal(
        <div
          style={{
            position: 'fixed',
            left: hovered.x,
            top: hovered.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 10000,
            pointerEvents: 'none',
            background: 'var(--panel, #1f2937)',
            color: 'var(--text, #f9fafb)',
            border: '1px solid var(--border, #374151)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            lineHeight: 1.45,
            maxWidth: 280,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          }}
        >
          {getSliceLines(slices[hovered.idx]).map((line, i) => (
            <div key={i} style={{ fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'var(--text)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
              {line}
            </div>
          ))}
          <div style={{ marginTop: 4, fontWeight: 700, color: accentColor }}>
            {slices[hovered.idx].value} ({slices[hovered.idx].percentage}%)
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
