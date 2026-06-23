import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { DEFAULT_ACCENT, normalizeHexColor } from '@utils/color';
import DashboardEngine from '@components/analytics/DashboardEngine';
import {
  LayoutDashboard, BarChart3, LineChart, ClipboardList, AlertTriangle,
  User, Award, BookOpen, GraduationCap, History,
} from 'lucide-react';
import StudentDashboardExport from '../StudentDashboardExport';
import {
  STUDENT_PERFORMANCE_DEFAULT_WIDGETS,
  STUDENT_PERFORMANCE_STORAGE_KEY,
  STUDENT_PERFORMANCE_MAX_WIDGETS,
  STUDENT_WIDGET_CATEGORIES,
  buildStudentPerformanceRawData,
} from '@constants/studentPerformanceWidgets';

const CATEGORY_ICONS = {
  overview: LayoutDashboard,
  attendance: ClipboardList,
  marks: GraduationCap,
  penalties: AlertTriangle,
  behaviors: User,
  participations: Award,
  enrollments: BookOpen,
};

export default function PerformanceAnalytics({
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

  const storageKey = STUDENT_PERFORMANCE_STORAGE_KEY;

  const rawData = useMemo(
    () => buildStudentPerformanceRawData(dashData, lookupData, isRTL),
    [dashData, lookupData, isRTL],
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
    fontSize: '0.8125rem',
    borderRadius: '6px',
    border: `1px solid ${active ? color : (theme === 'dark' ? '#4b5563' : '#d1d5db')}`,
    background: active ? `${color}18` : (theme === 'dark' ? '#374151' : '#fff'),
    color: active ? color : (theme === 'dark' ? '#f3f4f6' : '#1f2937'),
    cursor: 'pointer',
  });

  return (
    <div data-testid="student-performance-analytics">
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
              fontSize: '0.8125rem',
              borderRadius: 6,
              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`,
              background: theme === 'dark' ? '#374151' : '#fff',
              color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
            }}
          />
          {STUDENT_WIDGET_CATEGORIES.map((cat) => {
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
                  fontSize: '0.75rem',
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
          <StudentDashboardExport dashData={dashData} lookupData={lookupData} isRTL={isRTL} />
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
        defaultWidgets={STUDENT_PERFORMANCE_DEFAULT_WIDGETS}
        storageKey={storageKey}
        isLoading={false}
        lastUpdatedAt={lastUpdatedAt}
        onSmartReload={onReload}
        widgetSearch={widgetSearch}
        widgetCategory={widgetCategory}
        widgetCategoryResolver="student"
        builderCategoryScope="student"
        maxWidgets={STUDENT_PERFORMANCE_MAX_WIDGETS}
      />
    </div>
  );
}
