import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { Box } from '@mui/material';
import { GripVertical } from 'lucide-react';

const DEFAULT_POS = { top: 48, left: 8 };
const EDGE_MARGIN = 8;
const Z_INDEX = 1450;
const BORDER_RADIUS = '9999px';
const BOX_SHADOW = '0 4px 18px rgba(0,0,0,0.18)';
const BACKDROP_FILTER = 'saturate(150%) blur(8px)';
const COLORS = {
  darkBg: 'rgba(15,23,42,0.88)',
  lightBg: 'rgba(255,255,255,0.92)',
  darkBorder: 'rgba(255,255,255,0.12)',
  lightBorder: 'rgba(0,0,0,0.08)',
  darkHandle: '#94a3b8',
  lightHandle: '#64748b',
  darkHandleBg: 'rgba(255,255,255,0.06)',
  lightHandleBg: 'rgba(0,0,0,0.04)',
};

export default function DraggableFloatingPanel({
  children,
  storageKey,
  defaultPos = DEFAULT_POS,
  isDark = false,
}) {
  const ref = useRef(null);
  const hasSavedRef = useRef(false);
  const centeredRef = useRef(false);
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    origLeft: 0,
    origTop: 0,
    moved: false,
    lastPos: defaultPos,
  });
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        hasSavedRef.current = true;
        return JSON.parse(saved);
      }
    } catch { /* ignore */ }
    return defaultPos;
  });

  const clamp = useCallback((left, top) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rect = ref.current?.getBoundingClientRect();
    const width = rect?.width || 300;
    const height = rect?.height || 40;
    return {
      left: Math.max(EDGE_MARGIN, Math.min(left, w - width - EDGE_MARGIN)),
      top: Math.max(EDGE_MARGIN, Math.min(top, h - height - EDGE_MARGIN)),
    };
  }, []);

  const persist = useCallback((p) => {
    try { localStorage.setItem(storageKey, JSON.stringify(p)); } catch { /* ignore */ }
  }, [storageKey]);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      ...dragRef.current,
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      moved: false,
      lastPos: { left: rect.left, top: rect.top },
    };
    e.preventDefault();
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
    const newLeft = dragRef.current.origLeft + dx;
    const newTop = dragRef.current.origTop + dy;
    const clamped = clamp(newLeft, newTop);
    setPos(clamped);
    dragRef.current.lastPos = clamped;
  }, [clamp]);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current.dragging && dragRef.current.moved) {
      persist(dragRef.current.lastPos);
    }
    dragRef.current.dragging = false;
  }, [persist]);

  useEffect(() => {
    const onMove = (e) => handlePointerMove(e);
    const onUp = () => handlePointerUp();
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const onResize = () => setPos((prev) => clamp(prev.left, prev.top));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clamp]);

  useLayoutEffect(() => {
    if (hasSavedRef.current || centeredRef.current) return;
    const rect = ref.current?.getBoundingClientRect();
    const width = rect?.width || 300;
    const top = defaultPos?.top ?? DEFAULT_POS.top;
    const centeredLeft = Math.round((window.innerWidth - width) / 2);
    setPos(clamp(centeredLeft, top));
    centeredRef.current = true;
  }, [clamp, defaultPos.top]);

  return (
    <Box
      ref={ref}
      sx={{
        position: 'fixed',
        zIndex: Z_INDEX,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        maxWidth: 'calc(100vw - 16px)',
        borderRadius: BORDER_RADIUS,
        bgcolor: isDark ? COLORS.darkBg : COLORS.lightBg,
        border: `1px solid ${isDark ? COLORS.darkBorder : COLORS.lightBorder}`,
        boxShadow: BOX_SHADOW,
        backdropFilter: BACKDROP_FILTER,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      style={{ left: pos.left, top: pos.top }}
    >
      <Box
        onPointerDown={handlePointerDown}
        sx={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.25,
          mx: -0.25,
          borderRadius: '8px',
          color: isDark ? COLORS.darkHandle : COLORS.lightHandle,
          bgcolor: isDark ? COLORS.darkHandleBg : COLORS.lightHandleBg,
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <GripVertical size={14} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
}
