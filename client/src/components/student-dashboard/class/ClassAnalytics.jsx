import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { DEFAULT_ACCENT, normalizeHexColor } from '@utils/color';
import DashboardEngine from '@components/analytics/DashboardEngine';
import {
  LayoutDashboard, BarChart3, LineChart, ClipboardList, AlertTriangle,
  User, Award, BookOpen, GraduationCap, History, Shield,
} from 'lucide-react';
import {
  CLASS_ANALYTICS_DEFAULT_WIDGETS,
  CLASS_ANALYTICS_STORAGE_KEY,
  CLASS_ANALYTICS_MAX_WIDGETS,
  CLASS_WIDGET_CATEGORIES,
  buildClassPerformanceRawData,
} from '@constants/classPerformanceWidgets';
import { info, error } from '@services/utils/logger.js';

const CATEGORY_ICONS = {
  overview: LayoutDashboard,
  attendance: ClipboardList,
  penalties: AlertTriangle,
  behavior: Shield,
  participation: Award,
};

/**
 * ClassAnalytics - Displays class-level performance metrics using DashboardEngine.
 * Shows widgets for attendance, marks, GPA, penalties, behaviors, participations.
 * Follows the same pattern as OverviewAnalytics.
 */
export default function ClassAnalytics({
  classId,
  classMetrics,
  classRawData,
  dashData,
  lookupData,
  isRTL,
  onReload,
  lastUpdatedAt,
}) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const engineRef = useRef(null);
  const [editLayout, setEditLayout] = useState(false);
  const [widgetSearch, setWidgetSearch] = useState('');
  const [widgetCategory, setWidgetCategory] = useState('overview');
  const accentColor = DEFAULT_ACCENT;

  const storageKey = CLASS_ANALYTICS_STORAGE_KEY;

  // Build raw data for DashboardEngine from class metrics + raw arrays
  const rawData = useMemo(() => {
    try {
      const data = buildClassPerformanceRawData(classMetrics, classRawData, lookupData, isRTL);
      info('[ClassAnalytics] Raw data built:', Object.keys(data).length, 'keys');
      return data;
    } catch (err) {
      error('[ClassAnalytics] Error building raw data:', err);
      return {};
    }
  }, [classMetrics, classRawData, lookupData, isRTL]);

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

  return (
    <div data-testid="class-analytics">
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
          {CLASS_WIDGET_CATEGORIES.map((cat) => {
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
        defaultWidgets={CLASS_ANALYTICS_DEFAULT_WIDGETS}
        storageKey={storageKey}
        isLoading={false}
        lastUpdatedAt={lastUpdatedAt}
        onSmartReload={onReload}
        widgetSearch={widgetSearch}
        widgetCategory={widgetCategory}
        widgetCategoryResolver="class"
        builderCategoryScope="student"
        maxWidgets={CLASS_ANALYTICS_MAX_WIDGETS}
      />
    </div>
  );
}
