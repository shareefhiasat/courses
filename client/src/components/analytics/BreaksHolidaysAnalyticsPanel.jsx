import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { getThemedIcon } from '@constants/iconTypes';
import { DEFAULT_ACCENT, normalizeHexColor } from '@utils/color';
import DashboardEngine from '@components/analytics/DashboardEngine';
import { History } from 'lucide-react';

export default function BreaksHolidaysAnalyticsPanel({
  rawData,
  defaultWidgets,
  storageKey,
  maxWidgets,
  widgetCategoryResolver = 'scheduling',
  builderCategoryScope = 'scheduling',
  onReload,
  lastUpdatedAt,
}) {
  const { t } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();
  const engineRef = useRef(null);
  const [editLayout, setEditLayout] = useState(false);
  const [widgetSearch, setWidgetSearch] = useState('');
  const [widgetCategory, setWidgetCategory] = useState('all');
  const accentColor = DEFAULT_ACCENT;

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

  const categories = useMemo(() => [
    { id: 'all', label: t('widget_cat_all') || 'All' },
    { id: 'breaks', label: t('widget_cat_breaks') || 'Breaks' },
    { id: 'holidays', label: t('widget_cat_holidays') || 'Holidays' },
  ], [t]);

  return (
    <div data-testid="breaks-holidays-analytics-panel">
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
            data-testid="bh-widget-search-input"
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
          {categories.map((cat) => {
            const active = widgetCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setWidgetCategory(cat.id)}
                data-testid={`bh-widget-cat-${cat.id}`}
                title={cat.label}
                aria-label={cat.label}
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
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onReload} style={iconBtnStyle('#6b7280')} title={t('refresh') || 'Refresh'} aria-label={t('refresh') || 'Refresh'}>
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
        defaultWidgets={defaultWidgets}
        storageKey={storageKey}
        isLoading={false}
        lastUpdatedAt={lastUpdatedAt}
        onSmartReload={onReload}
        widgetSearch={widgetSearch}
        widgetCategory={widgetCategory}
        widgetCategoryResolver={widgetCategoryResolver}
        builderCategoryScope={builderCategoryScope}
        maxWidgets={maxWidgets}
      />
    </div>
  );
}
