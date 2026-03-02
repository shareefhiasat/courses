import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { normalizeHexColor, DEFAULT_ACCENT } from '../utils/color';
import { getUserById } from '@services/business/userService';
import { Select, YearSelect, SimpleLoading, UserSelect } from '@ui';
import { ROLE_STRINGS } from '@utils/userUtils';
import useAnalyticsData, { processWidgetData } from '@hooks/useAnalyticsData';
import DashboardEngine from './analytics/DashboardEngine';
import logger from '@utils/logger';
import PortalTooltip from '@ui/PortalTooltip';

/**
 * DEFAULT_WIDGETS
 * Seed widgets shown when no saved layout exists.
 * Each entry is a full widget config (JSON schema).
 */
const DEFAULT_WIDGETS = [
  {
    id: 'w1',
    title: 'Submissions by Status',
    chartType: 'pie',
    dataSource: 'submissions',
    groupBy: 'status',
    aggregation: 'count',
    dateRange: 'all',
    filters: [],
    comparisonMode: false,
    layout: { x: 0, y: 0, w: 4, h: 5 }
  },
  {
    id: 'w2',
    title: 'Activity Types',
    chartType: 'pie',
    dataSource: 'activities,announcements,resources',
    groupBy: 'type',
    aggregation: 'count',
    dateRange: 'all',
    filters: [],
    comparisonMode: false,
    layout: { x: 4, y: 0, w: 4, h: 5 }
  },
  {
    id: 'w3',
    title: 'User Activity Trend (30d)',
    chartType: 'line',
    dataSource: 'activityLogs',
    groupBy: 'date',
    aggregation: 'count',
    dateRange: 'last30',
    filters: [],
    comparisonMode: false,
    layout: { x: 8, y: 0, w: 4, h: 5 }
  },
  {
    id: 'w4',
    title: 'Attendance by Status',
    chartType: 'pie',
    dataSource: 'attendance',
    groupBy: 'status',
    aggregation: 'count',
    dateRange: 'all',
    filters: [],
    comparisonMode: false,
    layout: { x: 0, y: 5, w: 6, h: 5 }
  },
  {
    id: 'w5',
    title: 'Recent Activities',
    chartType: 'list',
    dataSource: 'activities,announcements,resources',
    groupBy: 'type',
    aggregation: 'list',
    dateRange: 'last30',
    filters: [],
    comparisonMode: false,
    layout: { x: 6, y: 5, w: 6, h: 6 }
  },
  {
    id: 'w6',
    title: 'Enrollments by Program',
    chartType: 'bar',
    dataSource: 'enrollments',
    groupBy: 'programId',
    aggregation: 'count',
    dateRange: 'all',
    filters: [],
    comparisonMode: false,
    layout: { x: 0, y: 10, w: 6, h: 5 }
  }
];

/**
 * AdvancedAnalytics
 * Plug-and-play analytics dashboard.
 *
 * Props:
 *   globalFilters - optional external filter overrides
 *                   e.g. { studentId: '123' } from StudentDashboard
 *                   e.g. { classId: 'abc' }   from ClassPage
 *   storageKey    - optional localStorage key for per-page widget persistence
 *   defaultWidgets - optional seed widget list (overrides DEFAULT_WIDGETS)
 *   title         - optional page title
 */
export default function AdvancedAnalytics({
  globalFilters: externalFilters = {},
  storageKey = 'analytics_widgets',
  defaultWidgets = DEFAULT_WIDGETS,
  title
}) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Helper function to get localized name
  const getLocalizedName = (item, fallbackField = 'name') => {
    if (!item) return '';
    
    // Check for Arabic name first
    if (lang === 'ar') {
      return item.nameAr || item.titleAr || item[fallbackField] || item.nameEn || item.name || item.title || item.code || item.docId || '';
    }
    
    // Default to English
    return item.nameEn || item[fallbackField] || item.name || item.title || item.code || item.docId || '';
  };

  // Helper function to get localized term
  const getLocalizedTerm = (term) => {
    if (!term) return '';
    
    const termKey = term.toLowerCase();
    const termTranslations = {
      'spring': t('schedules_spring') || 'Spring',
      'summer': t('schedules_summer') || 'Summer', 
      'fall': t('schedules_fall') || 'Fall',
      'winter': t('schedules_winter') || 'Winter'
    };
    
    return termTranslations[termKey] || term;
  };

  // ── Accent color ──────────────────────────────────────────────────────────
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    if (!user?.uid) { setAccentColor(DEFAULT_ACCENT); return; }
    try {
      const cached = localStorage.getItem(`accent_color_${user.uid}`);
      if (cached) setAccentColor(normalizeHexColor(cached, DEFAULT_ACCENT));
    } catch {}
    getUserById(user.uid).then(res => {
      if (res.success) {
        const c = normalizeHexColor(res.data.messageColor, DEFAULT_ACCENT);
        setAccentColor(c);
        try { localStorage.setItem(`accent_color_${user.uid}`, c); } catch {}
      }
    }).catch(e => logger.warn('[AdvancedAnalytics] accent color load failed:', e));

    const handler = (e) => {
      if (e?.detail?.color) {
        const c = normalizeHexColor(e.detail.color, DEFAULT_ACCENT);
        setAccentColor(c);
        try { localStorage.setItem(`accent_color_${user.uid}`, c); } catch {}
      }
    };
    window.addEventListener('accent-color-changed', handler);
    return () => window.removeEventListener('accent-color-changed', handler);
  }, [user]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { rawData, loading, permErrors, reload, smartReload } = useAnalyticsData();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());

  const handleReload = useCallback(async () => {
    console.log('[WIDGET DEBUG] 🔄 Refresh button clicked on analytics dashboard!');
    console.log('[WIDGET DEBUG] 🕐 Timestamp:', new Date().toISOString());
    console.log('[WIDGET DEBUG] 📊 Current lastUpdatedAt:', new Date(lastUpdatedAt).toISOString());
    await reload();
    setLastUpdatedAt(Date.now());
    console.log('[WIDGET DEBUG] ✅ Reload completed, new lastUpdatedAt:', new Date(Date.now()).toISOString());
  }, [reload, lastUpdatedAt]);

  // ── Widget Builder Reference ─────────────────────────────────────────────────
  const dashboardEngineRef = React.useRef(null);

  const handleAddWidget = useCallback((widget = null) => {
    if (dashboardEngineRef.current && dashboardEngineRef.current.openBuilder) {
      dashboardEngineRef.current.openBuilder(widget);
    }
  }, []);

  // ── Local global filters (merged with externalFilters) ────────────────────
  const [localFilters, setLocalFilters] = useState({
    classId: '', term: '', year: '', programId: '', subjectId: '', semester: '', studentId: '', instructorId: ''
  });

  const mergedFilters = { ...localFilters, ...externalFilters };

  // ── Layout edit mode ──────────────────────────────────────────────────────
  const [editLayout, setEditLayout] = useState(false);

  // ── Auto-refresh ──────────────────────────────────────────────────────────
  const [autoRefreshMs, setAutoRefreshMs] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (!autoRefreshMs) return;
    const id = setInterval(() => { handleReload(); setLastUpdatedAt(Date.now()); }, autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs, handleReload]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const csv = saved.map(w => {
        const data = processWidgetData(w, rawData, mergedFilters, 0, t, lang);
        return `\n${w.title}\n${data.map(d => `${d.label},${d.value}`).join('\n')}`;
      }).join('\n\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.warn('[AdvancedAnalytics] export failed:', e);
    }
  }, [rawData, mergedFilters, storageKey, processWidgetData, t, lang]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return <SimpleLoading loading fullscreen type="brand" size="lg" />;
  }

  return (
    <div className="advanced-analytics-container" style={{ padding: '1.5rem 2rem', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
        {title && (
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{title}</h1>
        )}

        <div style={{ 
          display: 'flex', 
          gap: 10, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>

          {/* Auto-refresh selector */}
          <Select
            value={autoRefreshMs}
            onChange={e => setAutoRefreshMs(Number(e.target.value))}
            options={[
              { value: 0,       label: t('auto_refresh_off') || 'Auto Refresh: Off' },
              { value: 60000,   label: `1 ${t('minute') || 'min'}` },
              { value: 300000,  label: `5 ${t('minutes') || 'min'}` },
              { value: 900000,  label: `15 ${t('minutes') || 'min'}` },
              { value: 1800000, label: `30 ${t('minutes') || 'min'}` },
              { value: 3600000, label: `60 ${t('minutes') || 'min'}` }
            ]}
            size="small"
          />

          {/* Auto-refresh progress bar */}
          {autoRefreshMs > 0 && (
            <PortalTooltip content={t('next_auto_refresh')} position="top">
            <div
              style={{ width: 120, height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}
            >
              <div style={{
                height: '100%',
                width: `${Math.min(100, ((nowTick - lastUpdatedAt) % autoRefreshMs) / autoRefreshMs * 100)}%`,
                background: accentColor,
                transition: 'width 0.25s linear'
              }} />
            </div>
            </PortalTooltip>
          )}

          {/* Refresh */}
          <button
            onClick={handleReload}
            style={btnStyle('var(--text-muted, #6b7280)')}
          >
            {getThemedIcon('ui', 'rotate_cw', 16, 'white')}
            {t('refresh') || 'Refresh'}
          </button>

          {/* Edit Layout toggle */}
          <button
            onClick={() => setEditLayout(v => !v)}
            style={btnStyle(editLayout ? 'var(--color-danger, #ef4444)' : 'var(--color-warning, #f97316)')}
          >
            {getThemedIcon('ui', editLayout ? 'lock' : 'layout_grid', 16, 'white')}
            {editLayout ? (t('exit_edit_layout') || 'Exit Edit') : (t('edit_layout') || 'Edit Layout')}
          </button>

          {/* Add Widget */}
          <button
            onClick={() => handleAddWidget()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.55rem 1rem',
              background: accentColor,
              color: 'white', border: 'none', borderRadius: 8,
              cursor: 'pointer', fontWeight: 600, fontSize: 13,
              whiteSpace: 'nowrap'
            }}
          >
            {getThemedIcon('ui', 'plus', 16, 'white')}
            {t('add_widget') || 'Add Widget'}
          </button>

          {/* Export */}
          <button onClick={handleExport} style={btnStyle('var(--color-success, #10b981)')}>
            {getThemedIcon('ui', 'download', 16, 'white')}
            {t('export') || 'Export'}
          </button>

          {/* Schedule Report */}
          <button
            onClick={() => window.location.href = '/scheduled-reports'}
            style={btnStyle(accentColor)}
          >
            {getThemedIcon('ui', 'calendar', 16, 'white')}
            {t('schedule_report') || 'Schedule Report'}
          </button>
        </div>
      </div>

      {/* ── Permission warnings ── */}
      {Object.keys(permErrors).length > 0 && (
        <div style={{
          marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 8,
          border: '1px solid var(--color-warning, #F59E0B)', background: 'var(--color-warning-light, rgba(245,158,11,0.08))', color: 'var(--color-warning-dark, #92400e)'
        }}>
          <strong>{t('some_data_not_loaded_permissions') || 'Some collections could not be loaded (permissions):'}</strong>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(permErrors).map(key => (
              <span key={key} style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--color-warning-surface, rgba(245,158,11,0.15))', border: '1px solid var(--color-warning-border, rgba(245,158,11,0.4))', fontSize: 12 }}>
                {key}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Global Filters (hidden when externalFilters lock them) ── */}
      {!externalFilters.studentId && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: 10, 
          marginBottom: '1.25rem',
          ...(lang === 'ar' ? { direction: 'rtl' } : { direction: 'ltr' })
        }}>
          <Select
            value={localFilters.programId}
            onChange={e => setLocalFilters(f => ({ ...f, programId: e.target.value, subjectId: '' }))}
            options={[
              { value: '', label: t('all_programs') || 'All Programs' },
              ...(rawData.programs || []).map(p => ({ value: p.docId || p.id, label: getLocalizedName(p) }))
            ]}
            searchable
            fullWidth
          />
          <Select
            value={localFilters.subjectId}
            onChange={e => setLocalFilters(f => ({ ...f, subjectId: e.target.value }))}
            options={[
              { value: '', label: t('all_subjects') || 'All Subjects' },
              ...(rawData.subjects || [])
                .filter(s => !localFilters.programId || s.programId === localFilters.programId)
                .map(s => ({ value: s.docId || s.id, label: `${s.code || ''} - ${getLocalizedName(s)}`.trim() }))
            ]}
            searchable
            fullWidth
          />
          <Select
            value={localFilters.classId}
            onChange={e => setLocalFilters(f => ({ ...f, classId: e.target.value }))}
            options={[
              { value: '', label: t('all_classes') || 'All Classes' },
              ...(rawData.classes || []).map((c, idx) => {
                const id = c?.id || c?.docId || `idx_${idx}`;
                const label = getLocalizedName(c, 'title') || `Class ${id.slice(0, 6)}`;
                return { value: id, label };
              })
            ]}
            searchable
            fullWidth
          />
          <Select
            value={localFilters.term}
            onChange={e => setLocalFilters(f => ({ ...f, term: e.target.value }))}
            options={[
              { value: '', label: t('all_terms') || 'All Terms' },
              ...Array.from(new Set((rawData.classes || []).map(c => {
                const m = /^(Spring|Summer|Fall|Winter)/i.exec((c?.term || '').toString());
                return m ? `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}` : '';
              }).filter(Boolean))).map(v => ({ value: v, label: getLocalizedTerm(v) }))
            ]}
            searchable
            fullWidth
          />
          <YearSelect
            value={localFilters.year}
            onChange={e => setLocalFilters(f => ({ ...f, year: e.target.value }))}
            startYear={2024}
            yearsAhead={5}
            includeAll
            allValue=""
            allLabel={t('all_years') || 'All Years'}
            searchable
            fullWidth
            label=""
          />
          <UserSelect
            users={(rawData.users || []).filter(u => 
              u.role === ROLE_STRINGS.STUDENT || u.isStudent
            )}
            enrollments={rawData.enrollments || []}
            value={localFilters.studentId}
            onChange={e => setLocalFilters(f => ({ ...f, studentId: e.target.value }))}
            placeholder={t('all_students') || 'All Students'}
            includeAll={true}
            showStatus={true}
            showEnrollments={false}
            searchable={true}
            fullWidth={true}
            theme={theme}
          />
          <Select
            value={localFilters.instructorId}
            onChange={e => setLocalFilters(f => ({ ...f, instructorId: e.target.value }))}
            options={[
              { value: '', label: t('all_instructors') || 'All Instructors' },
              ...(rawData.users || [])
                .filter(u => u.isInstructor)
                .map(u => ({ value: u.id, label: u.realName || u.displayName || u.email || u.id }))
            ]}
            searchable
            fullWidth
          />
        </div>
      )}

      {/* ── Dashboard Engine ── */}
      <DashboardEngine
        ref={dashboardEngineRef}
        rawData={rawData}
        globalFilters={mergedFilters}
        accentColor={accentColor}
        editLayout={editLayout}
        defaultWidgets={defaultWidgets}
        storageKey={storageKey}
        isLoading={loading}
        lastUpdatedAt={lastUpdatedAt}
        onSmartReload={smartReload}
      />
    </div>
  );
}

// ── Tiny helper ───────────────────────────────────────────────────────────────
function btnStyle(bg) {
  return {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '0.55rem 1rem',
    background: bg, color: 'white',
    border: 'none', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
    whiteSpace: 'nowrap'
  };
}
