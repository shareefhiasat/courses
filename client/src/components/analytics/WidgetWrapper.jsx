import React, { useState, useCallback, useRef } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import PortalTooltip from '@ui/PortalTooltip';
import { CircleHelp, Info, ChevronUp, ChevronDown, Pencil, Copy, Download, Trash2, GripVertical } from 'lucide-react';
import { getSchedulingWidgetHelp } from '@constants/schedulingSummaryWidgets';
import { getSourceByValue } from '@constants/widgetDataSources';


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
  const [isHovered, setIsHovered] = useState(false);
  const widgetRef = useRef(null);
  const toggleMaximize = useCallback(() => setIsMaximized(v => !v), []);

  const getWidgetTitle = useCallback(() => {
    const titleFromKey = widget.titleKey ? t(widget.titleKey) : null;
    const localized = lang === 'ar'
      ? (widget.titleAr || widget.titleEn || widget.title)
      : (widget.titleEn || widget.titleAr || widget.title);
    return titleFromKey || localized || t('untitled') || 'Untitled';
  }, [widget, t, lang]);

  const downloadWidgetSvg = useCallback(() => {
    const svg = widgetRef.current?.querySelector('svg');
    if (!svg) return;
    const cloned = svg.cloneNode(true);
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([new XMLSerializer().serializeToString(cloned)], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getWidgetTitle().replace(/[^\w\u0600-\u06FF]+/g, '_') || 'widget'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getWidgetTitle]);

  // Helper to get localized date range label
  const getDateRangeLabel = useCallback((dateRange) => {
    const labels = {
      all: t('all_time') || 'All',
      current: t('current_period') || 'Current period',
      today: t('today') || 'Today',
      last7: t('last_7_days') || 'Last 7 Days',
      last30: t('last_30_days') || 'Last 30 Days',
      last90: t('last_90_days') || 'Last 90 Days',
      custom: t('custom_range') || 'Custom'
    };
    return labels[dateRange] || dateRange;
  }, [t]);

  const helpText = widget.dataSource?.startsWith('scheduling')
    ? getSchedulingWidgetHelp(widget, t)
    : '';
  const sourceDef = getSourceByValue(widget.dataSource);
  const sourceLabel = sourceDef ? (t(sourceDef.labelKey) || sourceDef.labelKey) : widget.dataSource;
  const chartTypeLabel = {
    bar: t('bar'),
    line: t('line'),
    pie: t('pie'),
    donut: t('donut'),
    list: t('list'),
    count: t('count'),
  }[widget.chartType] || widget.chartType;
  const metaTooltip = [
    widget.dateRange && widget.dateRange !== 'current'
      ? `${t('period') || 'Period'}: ${getDateRangeLabel(widget.dateRange)}`
      : null,
    lastUpdatedAt
      ? `${t('updated') || 'Updated'}: ${new Date(lastUpdatedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}`
      : null,
  ].filter(Boolean).join('\n');

  const tinyBtn = {
    padding: 2,
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    color: 'var(--text)',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  };

  const ActionIcon = ({ children }) => (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
      {children}
    </span>
  );

  const headerActions = (
    <div
      className="widget-actions"
      style={{
        display: 'flex',
        gap: 2,
        opacity: isHovered ? 1 : 0,
        pointerEvents: isHovered ? 'auto' : 'none',
        transition: 'opacity 0.15s ease',
        flexShrink: 0,
        background: 'var(--panel)',
        borderRadius: 6,
        padding: 2,
        boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
      }}
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
        <button type="button" onClick={onMinimize} style={{ ...tinyBtn, color: isMinimized ? accentColor : 'var(--text)' }}>
          <ActionIcon>{isMinimized ? <ChevronDown size={11} /> : <ChevronUp size={11} />}</ActionIcon>
        </button>
      </PortalTooltip>

      <PortalTooltip content={t('edit')} position="top">
        <button type="button" onClick={onEdit} style={tinyBtn}>
          <ActionIcon><Pencil size={11} /></ActionIcon>
        </button>
      </PortalTooltip>

      <PortalTooltip content={t('duplicate')} position="top">
        <button type="button" onClick={onDuplicate} style={tinyBtn}>
          <ActionIcon><Copy size={11} /></ActionIcon>
        </button>
      </PortalTooltip>

      {widget.chartType !== 'list' && widget.chartType !== 'count' && (
        <PortalTooltip content={t('download') || 'Download'} position="top">
          <button type="button" onClick={downloadWidgetSvg} style={tinyBtn}>
            <ActionIcon><Download size={11} /></ActionIcon>
          </button>
        </PortalTooltip>
      )}

      <PortalTooltip content={t('delete')} position="top">
        <button type="button" onClick={onDelete} style={{ ...tinyBtn, borderColor: 'var(--color-danger, #ef4444)', color: 'var(--color-danger, #ef4444)' }}>
          <ActionIcon><Trash2 size={11} /></ActionIcon>
        </button>
      </PortalTooltip>
    </div>
  );

  return (
    <>
      {/* ── Card ── */}
      <div
        ref={widgetRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={isMinimized ? onMinimize : undefined}
        style={{
          padding: isMinimized ? '0.5rem 0.75rem' : '0.75rem 1rem',
          border: `1px solid ${isHovered ? `${accentColor}60` : 'var(--border)'}`,
          borderRadius: 16,
          background: isMinimized && isHovered ? 'var(--hover, var(--panel))' : 'var(--panel)',
          boxShadow: isHovered
            ? `0 4px 16px ${accentColor}35, 0 2px 6px rgba(0,0,0,0.1)`
            : (editLayout ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)'),
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, padding 0.15s ease, background 0.15s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          cursor: isMinimized ? 'pointer' : 'default',
        }}
      >
        {/* Header */}
        <div style={{ position: 'relative', marginBottom: isMinimized ? 0 : '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, position: 'relative' }}>
            {editLayout && (
              <span className="drag-handle" style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--muted)', flexShrink: 0, marginTop: 2 }}>
                <GripVertical size={14} />
              </span>
            )}
            {helpText && (
              <PortalTooltip content={helpText} position="top">
                <span
                  style={{ display: 'flex', color: 'var(--muted)', cursor: 'help', marginTop: 2, flexShrink: 0 }}
                  aria-label={t('widget_help') || 'What does this show?'}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CircleHelp size={12} />
                </span>
              </PortalTooltip>
            )}
            {metaTooltip && (
              <PortalTooltip content={metaTooltip} position="top">
                <span
                  style={{ display: 'flex', color: 'var(--muted)', cursor: 'help', marginTop: 2, flexShrink: 0 }}
                  aria-label={t('widget_meta') || 'Widget info'}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Info size={12} />
                </span>
              </PortalTooltip>
            )}
            <h3
              style={{
                margin: 0,
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text)',
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {getWidgetTitle()}
              {isRecentlyRefreshed && (
                <span style={{ color: 'var(--color-success, #10b981)', fontSize: 11, marginInlineStart: 4 }}>✓</span>
              )}
              {isMinimized && (
                <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 400, marginInlineStart: 6 }}>
                  — {t('click_to_expand') || 'click to expand'}
                </span>
              )}
            </h3>
          </div>
          <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 5 }} onClick={(e) => e.stopPropagation()}>{headerActions}</div>
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
                  {sourceLabel} • {chartTypeLabel}
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
