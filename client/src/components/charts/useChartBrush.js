import { useState, useMemo, useCallback, useRef } from 'react';

export const CHART_BRUSH_THRESHOLD = 14;
export const CHART_MAX_POINTS = 120;

/**
 * Slice + optional downsample for dense time-series charts.
 */
export function downsampleChartData(data, maxPoints = CHART_MAX_POINTS) {
  if (!data?.length || data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  const sampled = [];
  for (let i = 0; i < data.length; i += step) sampled.push(data[i]);
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }
  return sampled;
}

export function useChartBrush(data = [], threshold = CHART_BRUSH_THRESHOLD) {
  const [range, setRange] = useState(null);
  const dragRef = useRef(null);

  const needsBrush = data.length > threshold;

  const visibleData = useMemo(() => {
    if (!needsBrush || !range) return data;
    const [a, b] = range;
    return data.slice(Math.min(a, b), Math.max(a, b) + 1);
  }, [data, range, needsBrush]);

  const resetRange = useCallback(() => setRange(null), []);

  const startDrag = useCallback((index) => {
    dragRef.current = { anchor: index, current: index };
    setRange([index, index]);
  }, []);

  const updateDrag = useCallback((index) => {
    if (!dragRef.current) return;
    dragRef.current.current = index;
    const { anchor } = dragRef.current;
    setRange([Math.min(anchor, index), Math.max(anchor, index)]);
  }, []);

  const endDrag = useCallback(() => {
    if (!dragRef.current) return;
    const { anchor, current } = dragRef.current;
    dragRef.current = null;
    if (anchor === current) setRange(null);
  }, []);

  const downloadSvg = useCallback((svgEl, filename = 'chart.svg') => {
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    needsBrush,
    range,
    visibleData,
    resetRange,
    startDrag,
    updateDrag,
    endDrag,
    downloadSvg,
    isZoomed: Boolean(range),
  };
}
