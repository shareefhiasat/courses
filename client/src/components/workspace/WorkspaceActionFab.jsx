import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './workspaceActionFab.module.css';

const STORAGE_KEY = 'workspace_fab_position';

function loadPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { x: null, y: null };
}

const WorkspaceActionFab = ({ actions = [] }) => {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const saved = loadPosition();

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(saved);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const resolvePosition = useCallback(() => {
    if (position.x != null && position.y != null) {
      return { x: position.x, y: position.y };
    }
    return {
      x: Math.max(16, window.innerWidth - 72),
      y: Math.max(16, window.innerHeight - 160),
    };
  }, [position]);

  const [coords, setCoords] = useState(resolvePosition);

  useEffect(() => {
    setCoords(resolvePosition());
  }, [resolvePosition]);

  useEffect(() => {
    if (!isDragging) return undefined;

    const onMove = (e) => {
      didDrag.current = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const next = {
        x: Math.min(window.innerWidth - 56, Math.max(8, clientX - startPos.current.x)),
        y: Math.min(window.innerHeight - 56, Math.max(8, clientY - startPos.current.y)),
      };
      setCoords(next);
    };

    const onUp = () => {
      setIsDragging(false);
      setPosition(coords);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, coords]);

  const handlePointerDown = (e) => {
    if (e.target.closest(`.${styles.menu}`)) return;
    didDrag.current = false;
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX - coords.x, y: clientY - coords.y };
  };

  const handleToggle = () => {
    if (didDrag.current) return;
    setOpen((v) => !v);
  };

  if (!actions.length) return null;

  return (
    <div
      ref={dragRef}
      className={`${styles.fabRoot} ${isDark ? styles.fabRootDark : ''}`}
      style={{ left: coords.x, top: coords.y }}
      data-testid="workspace-action-fab"
    >
      {open && (
        <div className={styles.menu}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={styles.menuItem}
              disabled={action.loading}
              onClick={() => {
                action.onClick?.();
                setOpen(false);
              }}
              data-testid={`workspace-fab-${action.id}`}
            >
              {action.icon}
              <span>{action.loading ? t('exporting') : action.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`${styles.fabButton} ${open ? styles.fabButtonOpen : ''}`}
        aria-label={t('workspace_actions')}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onClick={handleToggle}
      >
        {getThemedIcon('ui', open ? 'close' : 'menu', 22, 'inverse')}
      </button>
    </div>
  );
};

export default WorkspaceActionFab;
