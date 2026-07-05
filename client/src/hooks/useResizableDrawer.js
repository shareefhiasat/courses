import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Reusable hook for making right-side (or left-side in RTL) drawers resizable.
 * Mirrors the pattern used by SideDrawer: mousedown → mousemove → mouseup with localStorage persistence.
 *
 * @param {Object} options
 * @param {string} options.storageKey     - localStorage key for persisting width
 * @param {number} options.defaultWidth   - initial width if nothing stored (default 480)
 * @param {number} options.minWidth       - minimum width (default 320)
 * @param {number} options.maxWidth       - maximum width (default 800)
 * @param {boolean} options.isRTL         - whether the drawer slides from the left (RTL)
 * @param {number} options.maxVwPercent   - cap width at this percentage of viewport (default 90)
 * @returns {{ width:number, setWidth:Function, handleResizeMouseDown:Function, resizeHandleProps:Object }}
 */
export default function useResizableDrawer({
  storageKey = 'drawer_width',
  defaultWidth = 480,
  minWidth = 320,
  maxWidth = 800,
  isRTL = false,
  maxVwPercent = 90,
} = {}) {
  const [width, setWidth] = useState(() => {
    try {
      const parsed = parseInt(localStorage.getItem(storageKey), 10);
      if (Number.isFinite(parsed)) {
        const capped = Math.min(maxWidth, Math.max(minWidth, parsed));
        return capped;
      }
    } catch {}
    return defaultWidth;
  });

  const widthRef = useRef(width);
  widthRef.current = width;

  // Clamp to viewport on mount / resize
  useEffect(() => {
    const clamp = () => {
      const vwMax = Math.floor(window.innerWidth * (maxVwPercent / 100));
      setWidth((w) => {
        const capped = Math.min(w, vwMax);
        if (capped < minWidth) return minWidth;
        return capped;
      });
    };
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [minWidth, maxVwPercent]);

  const persist = useCallback((w) => {
    try { localStorage.setItem(storageKey, String(w)); } catch {}
  }, [storageKey]);

  const handleResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widthRef.current;

    const onMove = (ev) => {
      const delta = isRTL ? (ev.clientX - startX) : (startX - ev.clientX);
      const vwMax = Math.floor(window.innerWidth * (maxVwPercent / 100));
      const newW = Math.min(Math.min(maxWidth, vwMax), Math.max(minWidth, startW + delta));
      setWidth(newW);
    };

    const onUp = () => {
      persist(widthRef.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isRTL, minWidth, maxWidth, maxVwPercent, persist]);

  // Props you can spread onto the resize handle div
  // For LTR (right-side drawer): handle on LEFT edge (inner, facing content)
  // For RTL (left-side drawer): handle on RIGHT edge (inner, facing content)
  const resizeHandleProps = {
    onMouseDown: handleResizeMouseDown,
    style: {
      position: 'absolute',
      top: 0,
      [isRTL ? 'right' : 'left']: 0,
      width: 6,
      height: '100%',
      cursor: 'ew-resize',
      zIndex: 99999,
      background: 'rgba(128,128,128,0.25)',
      transition: 'background 0.15s',
    },
    onMouseEnter: (e) => { e.currentTarget.style.background = 'rgba(128,128,128,0.5)'; },
    onMouseLeave: (e) => { e.currentTarget.style.background = 'rgba(128,128,128,0.25)'; },
  };

  return { width, setWidth, handleResizeMouseDown, resizeHandleProps };
}
