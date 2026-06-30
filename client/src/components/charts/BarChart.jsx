import React, { memo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '@contexts/LangContext';
import { getAcademicTermLabel, isValidAcademicTerm } from '@constants/academicTerms';
import { getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
import ChartBrushControls, { CHART_BRUSH_RESERVE, brushCompactDate } from './ChartBrushControls';
import { useChartBrush, downsampleChartData, CHART_MAX_POINTS } from './useChartBrush';
import { CHART_LABEL_SHADOW, CHART_LABEL_FILL } from './chartLabelStyles';

const getLocalizedName = (item, lang) => {
  if (!item) return '';
  if (lang === 'ar') {
    return item.localize || item.nameAr || item.titleAr || item.name || item.title || item.code || item.docId || '';
  }
  return item.nameEn || item.name || item.title || item.code || item.docId || '';
};

const localizeLine = (line, lang) => {
  if (!line) return '';
  if (isValidAcademicTerm(line)) return getAcademicTermLabel(line, lang);
  return String(line);
};

const getLabelLines = (item, lang) => {
  if (Array.isArray(item.labelLines) && item.labelLines.length > 0) {
    return item.labelLines.filter(Boolean).map((l) => localizeLine(l, lang));
  }
  let primary = getLocalizedName(item, lang) || item.label;
  if (primary) {
    const statusKey = String(primary).toUpperCase().replace(/-/g, '_');
    const localizedStatus = getLocalizedAttendanceLabel(statusKey, lang);
    if (localizedStatus && localizedStatus !== statusKey) primary = localizedStatus;
  }
  if (!primary || primary === '—') return [];
  const lines = [localizeLine(primary, lang)];
  if (item.term) lines.push(getAcademicTermLabel(item.term, lang));
  if (item.year) lines.push(String(item.year));
  if (item.instructorName && item.instructorName !== '—') lines.push(String(item.instructorName));
  return lines;
};

const LABEL_SHADOW = CHART_LABEL_SHADOW;
const VERTICAL_LABEL_CHAR_RATIO = 0.56;

function estimateVerticalLabelHeight(text, fontSize) {
  return String(text || '').length * fontSize * VERTICAL_LABEL_CHAR_RATIO;
}

function isTimelineData(items) {
  if (!items?.length) return false;
  const sample = items.slice(0, 3).map((d) => String(d.label || d.date || ''));
  return sample.some((s) => /^\d{4}-\d{2}-\d{2}/.test(s));
}

function BarChart({ data = [], size = { width: 400, height: 300 }, horizontal = false, showValues = true, showGrid = true, accentColor = '#800020' }) {
  const { t, lang, isRTL } = useLang();
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  let width;
  let height;
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

  const hideTooltip = useCallback(() => setHovered(null), []);

  const baseData = downsampleChartData(data, CHART_MAX_POINTS);
  const {
    needsBrush, range, visibleData, resetRange,
    startDrag, updateDrag, endDrag, downloadSvg, isZoomed,
  } = useChartBrush(baseData);

  const brushReserve = needsBrush ? CHART_BRUSH_RESERVE : 0;
  const chartHeight = height - brushReserve;

  if (!baseData || baseData.length === 0) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        {t('no_data') || 'No data'}
      </div>
    );
  }

  const isTimeline = isTimelineData(visibleData);
  const showXLabels = !needsBrush || isZoomed;
  const labelStep = isZoomed && visibleData.length <= 24
    ? 1
    : visibleData.length > 16
      ? Math.ceil(visibleData.length / 8)
      : visibleData.length > 8
        ? 2
        : 1;

  const padding = {
    top: 18,
    right: isRTL ? 48 : 18,
    bottom: showXLabels ? 12 : 20,
    left: isRTL ? 18 : 48,
  };
  const plotW = width - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;
  const axisY = padding.top + plotH;
  const yAxisX = isRTL ? padding.left + plotW : padding.left;
  const yLabelX = isRTL ? yAxisX + 10 : yAxisX - 10;
  const yLabelAnchor = isRTL ? 'start' : 'end';
  const axisFontSize = Math.max(8, Math.min(12, Math.min(width, chartHeight) / 25));
  const valueFontSize = Math.max(9, Math.min(14, Math.min(width, chartHeight) / 20));
  const labelFontSize = Math.max(8, Math.min(11, Math.min(width, chartHeight) / 28));

  const maxValue = Math.max(...visibleData.map((d) => d.value || 0), 1);
  const barWidth = horizontal ? plotH / visibleData.length : plotW / visibleData.length;
  const barGap = barWidth * 0.2;
  const actualBarWidth = barWidth - barGap;
  const palette = [accentColor, '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#14b8a6'];

  const barGeometries = visibleData.map((item, idx) => {
    const value = item.value || 0;
    const barH = (value / maxValue) * plotH;
    const x = padding.left + idx * barWidth + barGap / 2;
    const y = padding.top + plotH - barH;
    const labelLines = getLabelLines(item, lang).filter((l) => l && l !== '—');
    return {
      idx,
      item,
      value,
      x,
      y,
      barHeight: barH,
      color: item.color || palette[idx % palette.length],
      labelLines,
      primary: labelLines[0] || '',
      labelX: x + actualBarWidth / 2,
    };
  });

  const tooltip = hovered && createPortal(
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
        padding: '8px 10px',
        fontSize: 'var(--font-size-xs)',
        lineHeight: 1.45,
        maxWidth: 260,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}
    >
      {hovered.lines.map((line, i) => (
        <div key={i} style={{ fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'var(--text)' : 'var(--muted, #9ca3af)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {line}
        </div>
      ))}
      <div style={{ marginTop: 4, fontWeight: 700, color: accentColor }}>{hovered.value}</div>
    </div>,
    document.body,
  );

  return (
    <div style={{ width, height, overflow: 'visible' }}>
      <svg ref={svgRef} width={width} height={chartHeight} style={{ fontFamily: 'var(--font-family-sans)', display: 'block', overflow: 'visible' }} onMouseLeave={hideTooltip}>
        {showGrid && (
          <g>
            {(() => {
              const steps = 5;
              const stepSize = maxValue / (steps - 1);
              const yLabels = [];
              for (let i = 0; i < steps; i++) {
                const value = Math.round(stepSize * i);
                if (!yLabels.includes(value)) yLabels.push(value);
              }
              if (!yLabels.includes(maxValue)) yLabels.push(maxValue);
              return yLabels.map((value, i) => {
                const ratio = value / maxValue;
                const y = padding.top + plotH * (1 - ratio);
                return (
                  <g key={i}>
                    <line x1={padding.left} y1={y} x2={padding.left + plotW} y2={y} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4,4" />
                    <text x={yLabelX} y={y + 4} textAnchor={yLabelAnchor} fontSize={axisFontSize} fontWeight="bold" fill="#6b7280">{value}</text>
                  </g>
                );
              });
            })()}
          </g>
        )}

        {barGeometries.map((bar) => (
          <g key={bar.idx}>
            <rect
              x={bar.x}
              y={bar.y}
              width={actualBarWidth}
              height={Math.max(bar.barHeight, 0)}
              fill={bar.color}
              opacity={hovered?.idx === bar.idx ? 0.95 : 0.72}
              rx="4"
              style={{ transition: 'opacity 0.15s ease', cursor: 'pointer' }}
              onMouseEnter={(e) => {
                const hoverLines = bar.labelLines.length > 0 ? bar.labelLines : [t('not_specified') || 'Unspecified'];
                setHovered({ idx: bar.idx, x: e.clientX, y: e.clientY, lines: hoverLines, value: bar.value });
              }}
              onMouseMove={(e) => {
                setHovered((prev) => (prev?.idx === bar.idx ? { ...prev, x: e.clientX, y: e.clientY } : prev));
              }}
            />
            {showValues && bar.value > 0 && (
              <text x={bar.x + actualBarWidth / 2} y={bar.y - 5} textAnchor="middle" fontSize={valueFontSize} fontWeight="600" fill={CHART_LABEL_FILL} style={LABEL_SHADOW}>
                {bar.value}
              </text>
            )}
          </g>
        ))}

        <line x1={padding.left} y1={axisY} x2={padding.left + plotW} y2={axisY} stroke="#9ca3af" strokeWidth="2" />
        <line x1={yAxisX} y1={padding.top} x2={yAxisX} y2={axisY} stroke="#9ca3af" strokeWidth="2" />

        {showXLabels && (
          <g style={{ pointerEvents: 'none' }}>
            {barGeometries.map((bar, i) => {
              if (!bar.primary) return null;
              if (i % labelStep !== 0 && i !== barGeometries.length - 1) return null;

              const displayText = isTimeline && isZoomed ? brushCompactDate(bar.primary) : bar.primary;
              const labelHeight = estimateVerticalLabelHeight(displayText, labelFontSize);
              const centeredY = bar.y + (bar.barHeight + labelHeight) / 2;
              const labelY = Math.min(axisY - 6, Math.max(bar.y + labelHeight + 4, centeredY));

              return (
                <text
                  key={`lbl-${bar.idx}`}
                  x={bar.labelX}
                  y={labelY}
                  textAnchor="start"
                  fontSize={labelFontSize}
                  fontWeight="600"
                  fontStyle="italic"
                  fill={CHART_LABEL_FILL}
                  style={{ ...LABEL_SHADOW, direction: 'ltr', unicodeBidi: 'plaintext' }}
                  transform={`rotate(-90, ${bar.labelX}, ${labelY})`}
                >
                  <title>{bar.primary}</title>
                  {displayText}
                </text>
              );
            })}
          </g>
        )}
      </svg>

      <ChartBrushControls
        data={baseData}
        range={range}
        needsBrush={needsBrush}
        isZoomed={isZoomed}
        accentColor={accentColor}
        chartWidth={width}
        onStartDrag={startDrag}
        onUpdateDrag={updateDrag}
        onEndDrag={endDrag}
        onReset={resetRange}
        onDownload={() => downloadSvg(svgRef.current, 'bar-chart.svg')}
      />
      {tooltip}
    </div>
  );
}

const BarChartMemo = memo(BarChart);
BarChartMemo.displayName = 'BarChart';
export default BarChartMemo;
