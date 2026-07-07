import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import styles from './DraggableFab.module.css';

const DEFAULT_MARGIN = 24;

export default function DraggableFab({
  actions = [],
  mainIcon,
  openIcon,
  ariaLabel = 'FAB',
  storageKey = 'draggable-fab-position',
  direction = 'up',
  sx,
  onAction,
}) {
  const theme = useTheme();
  const isRTL = theme.direction === 'rtl';
  const wrapperRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origLeft: 0, origTop: 0, moved: false });
  const [open, setOpen] = useState(false);
  const [activeParent, setActiveParent] = useState(null);
  const actionRefs = useRef({});
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      left: isRTL ? DEFAULT_MARGIN : undefined,
      right: isRTL ? undefined : DEFAULT_MARGIN,
      bottom: DEFAULT_MARGIN,
      top: undefined,
    };
  });

  const clampToViewport = useCallback((left, top) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = 56;
    return {
      left: Math.max(8, Math.min(left, w - size - 8)),
      top: Math.max(8, Math.min(top, h - size - 8)),
    };
  }, []);

  const persistPos = useCallback((left, top) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ left, top }));
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    const handleResize = () => {
      if (pos.top != null && pos.left != null) {
        const clamped = clampToViewport(pos.left, pos.top);
        setPos(clamped);
        persistPos(clamped.left, clamped.top);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pos, clampToViewport, persistPos]);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      moved: false,
    };
    e.preventDefault();
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragState.current.moved = true;
      setOpen(false);
      const newLeft = dragState.current.origLeft + dx;
      const newTop = dragState.current.origTop + dy;
      const clamped = clampToViewport(newLeft, newTop);
      setPos({ left: clamped.left, top: clamped.top, right: undefined, bottom: undefined });
    }
  }, [clampToViewport]);

  const handlePointerUp = useCallback(() => {
    if (dragState.current.dragging && dragState.current.moved) {
      if (pos.left != null && pos.top != null) {
        persistPos(pos.left, pos.top);
      }
    }
    dragState.current.dragging = false;
  }, [pos, persistPos]);

  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleOpen = useCallback(() => {
    if (!dragState.current.moved) setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setActiveParent(null);
  }, []);

  const handleActionClick = useCallback((e, action) => {
    e.preventDefault();
    e.stopPropagation();
    if (action.disabled) return;

    if (action.children && action.children.length > 0) {
      setActiveParent((prev) => (prev?.id === action.id ? null : action));
    } else {
      onAction?.(action);
      action.onClick?.();
    }
  }, [onAction]);

  const handleChildActionClick = useCallback((child) => {
    onAction?.(child);
    child.onClick?.();
    setActiveParent(null);
    setOpen(false);
  }, [onAction]);

  const handleMainClose = useCallback(() => {
    setOpen(false);
    setActiveParent(null);
  }, []);

  const nestedTop = useMemo(() => {
    if (!activeParent) return 0;
    const el = actionRefs.current[activeParent.id];
    if (!el || !wrapperRef.current) return 0;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return elRect.top - wrapperRect.top + elRect.height / 2;
  }, [activeParent]);

  const wrapperStyle = {
    left: pos.left != null ? `${pos.left}px` : undefined,
    top: pos.top != null ? `${pos.top}px` : undefined,
    right: pos.right != null ? `${pos.right}px` : undefined,
    bottom: pos.bottom != null ? `${pos.bottom}px` : undefined,
  };

  return (
    <div
      ref={wrapperRef}
      className={styles.fabWrapper}
      style={wrapperStyle}
      onPointerDown={handlePointerDown}
    >
      <SpeedDial
        ariaLabel={ariaLabel}
        direction={direction}
        open={open}
        onOpen={handleOpen}
        onClose={handleMainClose}
        icon={<SpeedDialIcon icon={mainIcon} openIcon={openIcon} />}
        FabProps={{
          onPointerDown: (e) => e.stopPropagation(),
        }}
        sx={sx}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.id || action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen={false}
            disabled={action.disabled}
            FabProps={{
              ref: (el) => { actionRefs.current[action.id] = el; },
            }}
            onClick={(e) => handleActionClick(e, action)}
          />
        ))}
      </SpeedDial>

      {activeParent && activeParent.children && (
        <div
          className={styles.nestedFab}
          style={{
            position: 'absolute',
            [isRTL ? 'right' : 'left']: '100%',
            top: nestedTop,
            transform: 'translateY(-50%)',
            marginInline: '12px',
            zIndex: 1301,
            display: 'flex',
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {activeParent.children.map((child) => (
            <Tooltip
              key={child.id || child.name}
              title={child.name}
              placement={isRTL ? 'left' : 'right'}
              arrow
            >
              <span>
                <Fab
                  size="small"
                  color="inherit"
                  disabled={child.disabled}
                  onClick={() => handleChildActionClick(child)}
                  sx={{ boxShadow: 3, bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  {child.icon}
                </Fab>
              </span>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}
