import React from 'react';
import { useLang } from '@contexts/LangContext';

export const CHART_BRUSH_RESERVE = 50;
const BRUSH_H = 28;
const DATE_ROW_H = 16;
const HORIZ_LABEL_MIN_SLOT = 38;

/** Brush strip always uses compact MM-DD — full dates belong on the main chart only. */
export function brushCompactDate(label) {
  const s = String(label || '');
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(5);
  return s.length > 10 ? `${s.slice(0, 9)}…` : s;
}

function IconDownload({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconReset({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4v6h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 20v-6h-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 17A8 8 0 0 0 18 9.5l1-1.5M17.5 7A8 8 0 0 0 6 14.5l-1 1.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Mini brush strip: histogram + icons on one row, compact date labels below.
 */
export default function ChartBrushControls({
  data = [],
  range,
  needsBrush,
  isZoomed,
  accentColor = '#800020',
  chartWidth,
  onStartDrag,
  onUpdateDrag,
  onEndDrag,
  onReset,
  onDownload,
}) {
  const { t } = useLang();
  if (!needsBrush || !data.length) return null;

  const iconCount = isZoomed ? 2 : 1;
  const iconColW = iconCount * 24 + (iconCount - 1) * 4;
  const brushSvgW = Math.max(80, chartWidth - iconColW - 4);
  const brushPad = 4;
  const innerW = brushSvgW - brushPad * 2;
  const maxVal = Math.max(...data.map((d) => d.value || 0), 1);
  const slotW = innerW / data.length;
  const dateInnerW = chartWidth - brushPad * 2;
  const dateSlotW = dateInnerW / data.length;

  const selStart = range ? Math.min(range[0], range[1]) : 0;
  const selEnd = range ? Math.max(range[0], range[1]) : data.length - 1;
  const selX = brushPad + selStart * slotW;
  const selW = Math.max(slotW, (selEnd - selStart + 1) * slotW);

  const indexAtX = (clientX, rect, svgWidth) => {
    const w = svgWidth - brushPad * 2;
    const sw = w / data.length;
    const x = clientX - rect.left - brushPad;
    return Math.max(0, Math.min(data.length - 1, Math.floor(x / sw)));
  };

  const labelIndices = (() => {
    const start = isZoomed ? selStart : 0;
    const end = isZoomed ? selEnd : data.length - 1;
    const count = end - start + 1;
    const rangeW = isZoomed ? count * dateSlotW : dateInnerW;
    const maxLabels = Math.max(2, Math.floor(rangeW / HORIZ_LABEL_MIN_SLOT));
    const step = Math.max(1, Math.ceil(count / maxLabels));
    const indices = [];
    for (let i = start; i <= end; i += step) indices.push(i);
    if (indices[indices.length - 1] !== end) indices.push(end);
    return indices;
  })();

  const labelIndexSet = new Set(labelIndices);

  const iconBtn = (active = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    padding: 0,
    border: `1px solid ${active ? accentColor : 'var(--border)'}`,
    borderRadius: 5,
    background: active ? `${accentColor}12` : 'var(--bg)',
    cursor: 'pointer',
    flexShrink: 0,
  });

  const makeBrushHandlers = (svgWidth) => ({
    onMouseLeave: onEndDrag,
    onMouseUp: onEndDrag,
    onDoubleClick: onReset,
    onMouseDown: (e) => {
      const idx = indexAtX(e.clientX, e.currentTarget.getBoundingClientRect(), svgWidth);
      onStartDrag(idx);
    },
    onMouseMove: (e) => {
      if (e.buttons !== 1) return;
      const idx = indexAtX(e.clientX, e.currentTarget.getBoundingClientRect(), svgWidth);
      onUpdateDrag(idx);
    },
  });

  return (
    <div style={{ width: chartWidth, marginTop: 2, overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg
          width={brushSvgW}
          height={BRUSH_H}
          style={{ display: 'block', cursor: 'crosshair', userSelect: 'none', flex: '1 1 auto', minWidth: 0 }}
          {...makeBrushHandlers(brushSvgW)}
        >
          <rect x={0} y={0} width={brushSvgW} height={BRUSH_H} fill="var(--bg)" rx={4} />
          <line x1={brushPad} y1={BRUSH_H - 1} x2={brushSvgW - brushPad} y2={BRUSH_H - 1} stroke="var(--border)" strokeWidth="1" />

          {data.map((d, i) => {
            const barW = Math.max(1.5, slotW * 0.72);
            const h = Math.max(2, ((d.value || 0) / maxVal) * (BRUSH_H - 8));
            const x = brushPad + i * slotW + (slotW - barW) / 2;
            return (
              <rect
                key={i}
                x={x}
                y={BRUSH_H - h - 2}
                width={barW}
                height={h}
                fill={accentColor}
                opacity={isZoomed && (i < selStart || i > selEnd) ? 0.18 : 0.55}
                rx={1}
              />
            );
          })}

          {isZoomed && (
            <rect
              x={selX}
              y={1}
              width={selW}
              height={BRUSH_H - 2}
              fill={`${accentColor}12`}
              stroke={accentColor}
              strokeWidth={1.5}
              rx={3}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {isZoomed && (
            <button type="button" onClick={onReset} title={t('chart_reset_zoom') || 'Reset zoom'} style={iconBtn(false)}>
              <IconReset size={14} color="var(--text)" />
            </button>
          )}
          <button
            type="button"
            onClick={onDownload}
            title={t('chart_download_svg') || 'Download SVG'}
            style={iconBtn(true)}
          >
            <IconDownload size={14} color={accentColor} />
          </button>
        </div>
      </div>

      <svg
        width={chartWidth}
        height={DATE_ROW_H}
        style={{ display: 'block', cursor: 'crosshair', userSelect: 'none', overflow: 'visible' }}
        {...makeBrushHandlers(chartWidth)}
      >
        {data.map((d, i) => {
          const label = d.label || d.date || '';
          if (!label || !labelIndexSet.has(i)) return null;
          const x = brushPad + i * dateSlotW + dateSlotW / 2;
          return (
            <text
              key={i}
              x={x}
              y={DATE_ROW_H - 3}
              textAnchor="middle"
              fontSize={9}
              fontWeight="500"
              fill="var(--text)"
              opacity={isZoomed && (i < selStart || i > selEnd) ? 0.35 : 1}
            >
              {brushCompactDate(label)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
