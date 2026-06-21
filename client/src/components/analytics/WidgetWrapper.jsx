import React, { useState, useCallback } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
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
  isMinimized = false,
  onMinimize,
  onEdit,
  onDelete,
  onDuplicate,
  onRefresh,
  isLoading = false,
  isRecentlyRefreshed = false,
  lastUpdatedAt,
  editLayout = false,
  children
}) => {
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toggleMaximize = useCallback(() => setIsMaximized(v => !v), []);

  // Helper to get localized date range label
  const getDateRangeLabel = useCallback((dateRange) => {
    const labels = {
      all: t('all_time') || 'All',
      today: t('today') || 'Today',
      last7: t('last_7_days') || 'Last 7 Days',
      last30: t('last_30_days') || 'Last 30 Days',
      last90: t('last_90_days') || 'Last 90 Days',
      custom: t('custom_range') || 'Custom'
    };
    return labels[dateRange] || dateRange;
  }, [t]);

  const headerActions = (
    <div
      className="widget-actions"
      style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.2s', flexShrink: 0 }}
    >
      {/* Refresh — local re-render only - HIDDEN FOR NOW */}
      {/* <ActionBtn
        title={isRefreshing ? (t('refreshing') || 'Refreshing...') : (t('refresh') || 'Refresh')}
        onClick={async () => {
          info('[WIDGET WRAPPER DEBUG] 🔄 Refresh button clicked in wrapper!');
          console.log('[WIDGET WRAPPER DEBUG] 📊 Widget title:', widget.title || 'Untitled');
          
          setIsRefreshing(true);
          try {
            await onRefresh();
          } finally {
            setIsRefreshing(false);
          }
        }}
        style={{ 
          color: isRefreshing ? 'var(--color-success, #10b981)' : (isRecentlyRefreshed ? 'var(--color-success, #10b981)' : 'var(--text)'),
          backgroundColor: isRefreshing ? 'var(--color-success-light, #bbf7d0)' : 'transparent',
          borderColor: isRefreshing ? 'var(--color-success, #10b981)' : 'var(--border)',
          boxShadow: isRefreshing ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
          animation: isRefreshing ? 'pulse 1.5s ease-in-out infinite' : 'none',
          transform: isRefreshing ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
        }}>
          {getThemedIcon('ui', 'rotate_cw', 14, theme)}
        </div>
      </ActionBtn> */}

      {/* Minimize / Restore — controlled */}
      <PortalTooltip content={isMinimized ? t('restore') : t('minimize')} position="top">
        <button
          onClick={onMinimize}
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
            color: isMinimized ? accentColor : 'var(--text)',
            flexShrink: 0
          }}
        >
          {getThemedIcon('ui', isMinimized ? 'chevron_down' : 'chevron_up', 14, theme)}
        </button>
      </PortalTooltip>

      {/* Maximize - Commented out */}
      {/* <ActionBtn title={t('maximize') || 'Maximize'} onClick={toggleMaximize}>
        {getThemedIcon('ui', 'maximize', 14, theme)}
      </ActionBtn> */}

      {/* Edit */}
      <PortalTooltip content={t('edit')} position="top">
        <button
          onClick={onEdit}
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
            flexShrink: 0
          }}
        >
          {getThemedIcon('ui', 'edit', 14, theme)}
        </button>
      </PortalTooltip>

      {/* Duplicate */}
      <PortalTooltip content={t('duplicate')} position="top">
        <button
          onClick={onDuplicate}
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
            flexShrink: 0
          }}
        >
          {getThemedIcon('ui', 'copy', 14, theme)}
        </button>
      </PortalTooltip>

      {/* Delete */}
      <PortalTooltip content={t('delete')} position="top">
        <button
          onClick={onDelete}
          style={{
            padding: '0.3rem',
            background: 'transparent',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            color: 'var(--color-danger, #ef4444)',
            flexShrink: 0
          }}
        >
          {getThemedIcon('ui', 'trash2', 14, theme)}
        </button>
      </PortalTooltip>
    </div>
  );

  return (
    <>
      {/* ── Card ── */}
      <div
        style={{
          padding: isMinimized ? '0.5rem 0.75rem' : '0.75rem 1rem',
          border: '1px solid var(--border)',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
            {editLayout && (
              <span
                className="drag-handle"
                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--muted)', flexShrink: 0 }}
              >
                {getThemedIcon('ui', 'grip_vertical', 18, theme)}
              </span>
            )}
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {(() => {
                  const titleFromKey = widget.titleKey ? t(widget.titleKey) : null;
                  const localized = lang === 'ar'
                    ? (widget.titleAr || widget.titleEn || widget.title)
                    : (widget.titleEn || widget.titleAr || widget.title);
                  return titleFromKey || localized || t('untitled') || 'Untitled';
                })()}
                {isRecentlyRefreshed && (
                  <span style={{ color: 'var(--color-success, #10b981)', fontSize: 11, marginInlineStart: 4 }}>✓</span>
                )}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {widget.dateRange && (
                  <span style={{ 
                    fontSize: 11, 
                    color: 'var(--muted)', 
                    fontWeight: 500 
                  }}>
                    {getDateRangeLabel(widget.dateRange)}
                  </span>
                )}
                <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.7, flexShrink: 0 }}>
                  {lastUpdatedAt
                    ? new Date(lastUpdatedAt).toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      }).replace(',', '')
                    : ''}
                </span>
              </div>
            </div>
          </div>
          {headerActions}
        </div>

        {/* Body — only rendered when NOT minimized */}
        {!isMinimized && (
          <div style={{ position: 'relative', flex: 1, minHeight: 0, marginTop: '0.5rem' }}>
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
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            style={{
              background: 'var(--panel)', borderRadius: 20, padding: '2rem',
              width: '96vw', height: '96vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, color: 'var(--text)', fontSize: 24, fontWeight: 700,
                  marginBottom: '0.25rem'
                }}>
                  {widget.title}
                </h2>
                <p style={{ 
                  margin: 0, color: 'var(--muted)', fontSize: 14,
                  opacity: 0.8
                }}>
                  {widget.dataSource} • {widget.chartType}
                </p>
              </div>
              <PortalTooltip content={t('close')} position="top">
              <button
                onClick={toggleMaximize}
                style={{
                  padding: '0.5rem', background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  color: 'var(--text)', transition: 'all 0.2s',
                  fontSize: 14, fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--hover)';
                  e.target.style.borderColor = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--bg)';
                  e.target.style.borderColor = 'var(--border)';
                }}
              >
                {getThemedIcon('ui', 'close', 18, theme)}
                <span style={{ marginLeft: '0.5rem' }}>{t('close')}</span>
              </button>
            </PortalTooltip>
            </div>
            
            {/* Modal Content */}
            <div style={{ 
              flex: 1, minHeight: 0, 
              background: 'var(--bg)',
              borderRadius: 12,
              padding: '1rem',
              overflow: 'auto'
            }}>
              <ChartSizer>{children}</ChartSizer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// Add CSS animation for spinning refresh icon
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }
    50% {
      transform: scale(1.1);
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }
  }
`;
if (!document.head.querySelector('style[data-widget-refresh]')) {
  style.setAttribute('data-widget-refresh', 'true');
  document.head.appendChild(style);
}
