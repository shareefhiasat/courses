import React, { memo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import ChartBrushControls, { CHART_BRUSH_RESERVE, brushCompactDate } from './ChartBrushControls';
import { CHART_LABEL_SHADOW, CHART_LABEL_FILL } from './chartLabelStyles';
import { useChartBrush, downsampleChartData, CHART_MAX_POINTS } from './useChartBrush';

const getLocalizedName = (item, lang) => {
  if (!item) return '';
  if (lang === 'ar') {
    return item.localize || item.nameAr || item.titleAr || item.name || item.title || item.code || item.docId || '';
  }
  return item.nameEn || item.name || item.title || item.code || item.docId || '';
};

function LineChart({ data = [], size = { width: 400, height: 300 }, accentColor = '#800020', showArea = true, showPoints = true, showGrid = true }) {
  const { t, lang } = useLang();
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

  const padding = { top: 20, right: 20, bottom: needsBrush && !isZoomed ? 8 : 38, left: 48 };
  const plotW = width - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;
  const axisFontSize = Math.max(9, Math.min(13, Math.min(width, chartHeight) / 22));
  const labelFontSize = Math.max(8, Math.min(11, Math.min(width, chartHeight) / 28));
  const showXLabels = !needsBrush || isZoomed;
  const labelStep = visibleData.length > 20 ? Math.ceil(visibleData.length / 10) : visibleData.length > 12 ? 2 : 1;

  const maxValue = Math.max(...visibleData.map((d) => d.value || 0), 1);
  const minValue = Math.min(...visibleData.map((d) => d.value || 0), 0);
  const rangeVal = maxValue - minValue || 1;
  const stepX = plotW / (visibleData.length - 1 || 1);

  const points = visibleData.map((item, idx) => {
    const x = padding.left + idx * stepX;
    const y = padding.top + plotH - ((item.value - minValue) / rangeVal) * plotH;
    const localizedLabel = getLocalizedName(item, lang) || item.label;
    return { x, y, label: localizedLabel, value: item.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = showArea
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + plotH} L ${padding.left} ${padding.top + plotH} Z`
    : '';

  const gridLines = (() => {
    const r = maxValue - minValue;
    const lines = [];
    if (r <= 3) {
      for (let i = Math.floor(minValue); i <= Math.ceil(maxValue); i++) lines.push(i);
    } else if (r <= 10) {
      const step = r > 6 ? 2 : 1;
      const start = Math.floor(minValue / step) * step;
      for (let i = start; i <= Math.ceil(maxValue); i += step) lines.push(i);
    } else {
      const step = Math.ceil(r / 5);
      const start = Math.floor(minValue / step) * step;
      for (let i = start; i <= Math.ceil(maxValue); i += step) lines.push(i);
    }
    return lines;
  })();

  return (
    <div style={{ width, height }}>
      <svg ref={svgRef} width={width} height={chartHeight} style={{ fontFamily: 'var(--font-family-sans)', display: 'block', overflow: 'hidden' }}>
        <defs>
          <clipPath id="line-plot-clip">
            <rect x={padding.left} y={padding.top} width={plotW} height={plotH + 4} />
          </clipPath>
        </defs>
        {showGrid && gridLines.map((value, i) => {
          const ratio = rangeVal > 0 ? (value - minValue) / rangeVal : 0;
          const y = padding.top + plotH * (1 - ratio);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={padding.left + plotW} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={axisFontSize} fontWeight="bold" fill="#6b7280">{value}</text>
            </g>
          );
        })}

        {showArea && <path d={areaPath} fill={accentColor} fillOpacity="0.2" />}
        <path d={linePath} fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {showPoints && points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={accentColor} strokeWidth="2.5">
              <title>{`${p.label}: ${p.value}`}</title>
            </circle>
            {showXLabels && (idx % labelStep === 0 || idx === points.length - 1) && (
              <text
                x={p.x}
                y={padding.top + plotH + 20}
                textAnchor="end"
                fontSize={labelFontSize}
                fontWeight="600"
                fill={CHART_LABEL_FILL}
                style={CHART_LABEL_SHADOW}
                transform={`rotate(-40, ${p.x}, ${padding.top + plotH + 20})`}
              >
                {/^\d{4}-\d{2}-\d{2}/.test(String(p.label || '')) ? brushCompactDate(p.label) : p.label}
              </text>
            )}
          </g>
        ))}

        <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#374151" strokeWidth="2" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#374151" strokeWidth="2" />
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
        onDownload={() => downloadSvg(svgRef.current, 'line-chart.svg')}
      />
    </div>
  );
}

const LineChartMemo = memo(LineChart);
LineChartMemo.displayName = 'LineChart';
export default LineChartMemo;
