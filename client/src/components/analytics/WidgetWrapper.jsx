import React, { useState, useCallback } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';

/**
 * WidgetWrapper
 * Universal UI shell for every analytics widget.
 *
 * isMinimized / onMinimize are CONTROLLED by DashboardEngine so the grid row
 * can collapse to header height when minimized.
 *
 * Props:
 *   widget              - Widget config object
 *   accentColor         - Accent hex string
 *   isPinned            - bool
 *   isMinimized         - bool (controlled)
 *   onPin               - () => void
 *   onMinimize          - () => void  (controlled toggle)
 *   onEdit              - () => void
 *   onDelete            - () => void
 *   onRefresh           - () => void  (local re-render, no Firebase)
 *   isLoading           - bool
 *   isRecentlyRefreshed - bool
 *   lastUpdatedAt       - timestamp ms
 *   editLayout          - bool
 *   children            - render prop: (size: { width, height }) => ReactNode
 */
const WidgetWrapper = ({
  widget,
  accentColor,
  isPinned = false,
  isMinimized = false,
  onPin,
  onMinimize,
  onEdit,
  onDelete,
  onRefresh,
  isLoading = false,
  isRecentlyRefreshed = false,
  lastUpdatedAt,
  editLayout = false,
  children
}) => {
  const { theme } = useTheme();
  const { t } = useLang();
  const [isMaximized, setIsMaximized] = useState(false);
  const toggleMaximize = useCallback(() => setIsMaximized(v => !v), []);

  // Helper to get localized date range label
  const getDateRangeLabel = useCallback((dateRange) => {
    const labels = {
      all: t('all_time') || 'All Time',
      today: t('today') || 'Today',
      last7: t('last_7_days') || 'Last 7 Days',
      last30: t('last_30_days') || 'Last 30 Days',
      last90: t('last_90_days') || 'Last 90 Days',
      custom: t('custom_range') || 'Custom Range'
    };
    return labels[dateRange] || dateRange;
  }, [t]);

  const headerActions = (
    <div
      className="widget-actions"
      style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.2s', flexShrink: 0 }}
    >
      {/* Refresh — local re-render only */}
      <ActionBtn
        title={t('refresh') || 'Refresh'}
        onClick={onRefresh}
        style={{ color: isRecentlyRefreshed ? '#10b981' : 'var(--text)' }}
      >
        {getThemedIcon('ui', 'rotate_cw', 14, theme)}
      </ActionBtn>

      {/* Pin */}
      <ActionBtn
        title={isPinned ? (t('unpin') || 'Unpin') : (t('pin') || 'Pin')}
        onClick={onPin}
        style={{ color: isPinned ? accentColor : 'var(--text)', borderColor: isPinned ? accentColor : undefined }}
      >
        {getThemedIcon('ui', 'pin', 14, theme)}
      </ActionBtn>

      {/* Minimize / Restore — controlled */}
      <ActionBtn
        title={isMinimized ? (t('restore') || 'Restore') : (t('minimize') || 'Minimize')}
        onClick={onMinimize}
        style={{ color: isMinimized ? accentColor : 'var(--text)' }}
      >
        {getThemedIcon('ui', isMinimized ? 'chevron_down' : 'chevron_up', 14, theme)}
      </ActionBtn>

      {/* Maximize */}
      <ActionBtn title={t('maximize') || 'Maximize'} onClick={toggleMaximize}>
        {getThemedIcon('ui', 'maximize', 14, theme)}
      </ActionBtn>

      {/* Edit */}
      <ActionBtn title={t('edit') || 'Edit'} onClick={onEdit}>
        {getThemedIcon('ui', 'edit', 14, theme)}
      </ActionBtn>

      {/* Delete */}
      <ActionBtn
        title={t('delete') || 'Delete'}
        onClick={onDelete}
        style={{ color: '#ef4444', borderColor: '#ef4444' }}
      >
        {getThemedIcon('ui', 'trash2', 14, theme)}
      </ActionBtn>
    </div>
  );

  return (
    <>
      {/* ── Card ── */}
      <div
        style={{
          padding: isMinimized ? '0.75rem 1.25rem' : '1.25rem 1.5rem',
          border: isPinned ? `2px solid ${accentColor}` : '1px solid var(--border)',
          borderRadius: 16,
          background: 'var(--panel)',
          boxShadow: editLayout ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, padding 0.15s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {editLayout && (
              <span
                className="drag-handle"
                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--muted)', flexShrink: 0 }}
              >
                {getThemedIcon('ui', 'grip_vertical', 18, theme)}
              </span>
            )}
            {isPinned && (
              <span style={{ color: accentColor, display: 'flex', flexShrink: 0 }}>
                {getThemedIcon('ui', 'pin', 12, theme)}
              </span>
            )}
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {widget.title}
              {widget.dateRange && (
                <span style={{ 
                  fontSize: 12, 
                  color: 'var(--muted)', 
                  fontWeight: 500, 
                  marginInlineStart: 6 
                }}>
                  ({getDateRangeLabel(widget.dateRange)})
                </span>
              )}
              {isRecentlyRefreshed && (
                <span style={{ color: '#10b981', fontSize: 13, marginInlineStart: 6 }}>✓</span>
              )}
            </h3>
            <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.7, flexShrink: 0 }}>
              {lastUpdatedAt
                ? new Date(lastUpdatedAt).toLocaleString('en-GB', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  }).replace(',', '')
                : ''}
            </span>
          </div>
          {headerActions}
        </div>

        {/* Body — only rendered when NOT minimized */}
        {!isMinimized && (
          <div style={{ position: 'relative', flex: 1, minHeight: 0, marginTop: '0.75rem' }}>
            {isLoading && (
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(var(--panel-rgb,255,255,255),0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 5, borderRadius: 8
                }}
              >
                <div
                  className="animate-spin rounded-full h-6 w-6 border-2"
                  style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
                />
              </div>
            )}
            <ChartSizer>{children}</ChartSizer>
          </div>
        )}
      </div>

      {/* ── Maximize Modal ── */}
      {isMaximized && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={toggleMaximize}
        >
          <div
            style={{
              background: 'var(--panel)', borderRadius: 16, padding: '1.5rem',
              width: '90vw', height: '85vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 20, fontWeight: 700 }}>{widget.title}</h2>
              <button
                onClick={toggleMaximize}
                style={{
                  padding: '0.4rem', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 6,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text)'
                }}
              >
                {getThemedIcon('ui', 'close', 20, theme)}
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ChartSizer>{children}</ChartSizer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ActionBtn({ children, title, onClick, style = {} }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '0.3rem',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 4,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        color: 'var(--text)',
        flexShrink: 0,
        ...style
      }}
    >
      {children}
    </button>
  );
}

function ChartSizer({ children }) {
  const ref = React.useRef(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      setSize({ width: cr.width, height: cr.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0 }}>
      {typeof children === 'function' ? children(size) : children}
    </div>
  );
}

export default WidgetWrapper;
