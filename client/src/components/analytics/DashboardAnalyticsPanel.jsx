import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { DEFAULT_ACCENT, normalizeHexColor } from '@utils/color';
import DashboardEngine from '@components/analytics/DashboardEngine';
import {
  LayoutDashboard, BarChart3, LineChart, PieChart,
  HardDrive, GitBranch, Activity, History,
} from 'lucide-react';
import {
  DASHBOARD_ANALYTICS_DEFAULT_WIDGETS,
  DASHBOARD_ANALYTICS_STORAGE_KEY,
  DASHBOARD_ANALYTICS_MAX_WIDGETS,
  ANALYTICS_WIDGET_CATEGORIES,
  buildAnalyticsRawData,
} from '@constants/dashboardAnalyticsWidgets';

const CATEGORY_ICONS = {
  all: LayoutDashboard,
  drive: HardDrive,
  workflow: GitBranch,
  activity: Activity,
};

export default function DashboardAnalyticsPanel({ analyticsData, loading, onReload, lastUpdatedAt }) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const engineRef = useRef(null);
  const [editLayout, setEditLayout] = useState(false);
  const [widgetSearch, setWidgetSearch] = useState('');
  const [widgetCategory, setWidgetCategory] = useState('all');
  const accentColor = DEFAULT_ACCENT;

  const rawData = useMemo(
    () => buildAnalyticsRawData(analyticsData),
    [analyticsData],
  );

  const handleAddWidget = useCallback(() => {
    engineRef.current?.openBuilder?.();
  }, []);

  const iconBtnStyle = (color, active = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.35rem',
    width: 33,
    height: 33,
    fontSize: 'var(--font-size-sm)',
    borderRadius: '6px',
    border: `1px solid ${active ? color : (theme === 'dark' ? '#4b5563' : '#d1d5db')}`,
    background: active ? `${color}18` : (theme === 'dark' ? '#374151' : '#fff'),
    color: active ? color : (theme === 'dark' ? '#f3f4f6' : '#1f2937'),
    cursor: 'pointer',
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        {t('common.loading') || 'Loading analytics...'}
      </div>
    );
  }

  return (
    <div data-testid="dashboard-analytics-panel">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', flex: '1 1 240px' }}>
          <input
            type="search"
            value={widgetSearch}
            onChange={(e) => setWidgetSearch(e.target.value)}
            placeholder={t('search_widgets') || 'Search widgets…'}
            aria-label={t('search_widgets') || 'Search widgets'}
            data-testid="widget-search-input"
            style={{
              minWidth: 160,
              flex: '1 1 160px',
              maxWidth: 240,
              padding: '0.35rem 0.65rem',
              fontSize: 'var(--font-size-sm)',
              borderRadius: 6,
              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
              background: theme === 'dark' ? '#374151' : '#fff',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
            }}
          />
          {ANALYTICS_WIDGET_CATEGORIES.map((cat) => {
            const active = widgetCategory === cat.id;
            const Icon = CATEGORY_ICONS[cat.id] || BarChart3;
            const label = (lang === 'ar' ? cat.labelAr : cat.label) || cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setWidgetCategory(cat.id)}
                data-testid={`widget-cat-${cat.id}`}
                title={label}
                aria-label={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: 'var(--font-size-xs)',
                  borderRadius: 999,
                  border: `1px solid ${active ? accentColor : (theme === 'dark' ? '#4b5563' : '#d1d5db')}`,
                  background: active ? `${accentColor}18` : (theme === 'dark' ? '#374151' : '#fff'),
                  color: active ? accentColor : (theme === 'dark' ? '#e5e7eb' : '#374151'),
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={13} strokeWidth={2} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onReload} style={iconBtnStyle('#6b7280')} title={t('refresh')} aria-label={t('refresh')}>
            {getThemedIcon('ui', 'rotate_cw', 16, theme)}
          </button>
          <button
            type="button"
            onClick={() => setEditLayout((v) => !v)}
            style={iconBtnStyle(accentColor, editLayout)}
            title={t('edit_layout') || 'Edit layout'}
            aria-label={t('edit_layout') || 'Edit layout'}
          >
            {getThemedIcon('ui', 'layout_dashboard', 16, theme)}
          </button>
          <button
            type="button"
            onClick={handleAddWidget}
            style={iconBtnStyle(accentColor)}
            title={t('add_widget') || 'Add widget'}
            aria-label={t('add_widget') || 'Add widget'}
          >
            {getThemedIcon('ui', 'plus', 16, theme)}
          </button>
          <button
            type="button"
            onClick={() => engineRef.current?.resetToDefaults?.()}
            style={iconBtnStyle('#ef4444')}
            title={t('reset_to_system_default') || 'Reset to system default'}
            aria-label={t('reset_to_system_default') || 'Reset to system default'}
          >
            <History size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <DashboardEngine
        ref={engineRef}
        rawData={rawData}
        globalFilters={{}}
        accentColor={normalizeHexColor(accentColor)}
        editLayout={editLayout}
        defaultWidgets={DASHBOARD_ANALYTICS_DEFAULT_WIDGETS}
        storageKey={DASHBOARD_ANALYTICS_STORAGE_KEY}
        isLoading={loading}
        lastUpdatedAt={lastUpdatedAt}
        onSmartReload={onReload}
        widgetSearch={widgetSearch}
        widgetCategory={widgetCategory}
        widgetCategoryResolver="analytics"
        builderCategoryScope="analytics"
        maxWidgets={DASHBOARD_ANALYTICS_MAX_WIDGETS}
      />
    </div>
  );
}
