import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { normalizeHexColor, DEFAULT_ACCENT } from '../utils/color';
import { getUserById } from '@services/business/userService';
import { Select, YearSelect, SimpleLoading } from '@ui';
import useAnalyticsData, { processWidgetData } from '@hooks/useAnalyticsData';
import DashboardEngine from './analytics/DashboardEngine';
import logger from '@utils/logger';

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
    chartType: 'bar',
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
    chartType: 'bar',
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
    title: 'Enrollments by Program',
    chartType: 'bar',
    dataSource: 'enrollments',
    groupBy: 'programId',
    aggregation: 'count',
    dateRange: 'all',
    filters: [],
    comparisonMode: false,
    layout: { x: 6, y: 5, w: 6, h: 5 }
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
  const { t } = useLang();
  const { theme } = useTheme();
  const { user } = useAuth();

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
  const { rawData, loading, permErrors, reload } = useAnalyticsData();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());

  const handleReload = useCallback(async () => {
    await reload();
    setLastUpdatedAt(Date.now());
  }, [reload]);

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
        const data = processWidgetData(w, rawData, mergedFilters);
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
  }, [rawData, mergedFilters, storageKey, processWidgetData]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return <SimpleLoading loading fullscreen type="brand" size="lg" />;
  }

  return (
    <div style={{ padding: '1.5rem 2rem', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
        {title && (
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{title}</h1>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginInlineStart: 'auto' }}>

          {/* Auto-refresh selector */}
          <Select
            value={autoRefreshMs}
            onChange={e => setAutoRefreshMs(Number(e.target.value))}
            options={[
              { value: 0,       label: t('auto_refresh_off') || 'Auto Refresh: Off' },
              { value: 60000,   label: '1 min' },
              { value: 300000,  label: '5 min' },
              { value: 900000,  label: '15 min' },
              { value: 1800000, label: '30 min' },
              { value: 3600000, label: '60 min' }
            ]}
            size="small"
          />

          {/* Auto-refresh progress bar */}
          {autoRefreshMs > 0 && (
            <div
              title={t('next_auto_refresh') || 'Next auto refresh'}
              style={{ width: 120, height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}
            >
              <div style={{
                height: '100%',
                width: `${Math.min(100, ((nowTick - lastUpdatedAt) % autoRefreshMs) / autoRefreshMs * 100)}%`,
                background: accentColor,
                transition: 'width 0.25s linear'
              }} />
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={handleReload}
            style={btnStyle('#6b7280')}
          >
            {getThemedIcon('ui', 'rotate_cw', 16, theme)}
            {t('refresh') || 'Refresh'}
          </button>

          {/* Edit Layout toggle */}
          <button
            onClick={() => setEditLayout(v => !v)}
            style={btnStyle(editLayout ? '#ef4444' : '#f97316')}
          >
            {getThemedIcon('ui', editLayout ? 'lock' : 'layout_grid', 16, theme)}
            {editLayout ? (t('exit_edit_layout') || 'Exit Edit') : (t('edit_layout') || 'Edit Layout')}
          </button>

          {/* Export */}
          <button onClick={handleExport} style={btnStyle('#10b981')}>
            {getThemedIcon('ui', 'download', 16, theme)}
            {t('export') || 'Export'}
          </button>

          {/* Schedule Report */}
          <button
            onClick={() => window.location.href = '/scheduled-reports'}
            style={btnStyle(accentColor)}
          >
            {getThemedIcon('ui', 'calendar', 16, theme)}
            {t('schedule_report') || 'Schedule Report'}
          </button>
        </div>
      </div>

      {/* ── Permission warnings ── */}
      {Object.keys(permErrors).length > 0 && (
        <div style={{
          marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 8,
          border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.08)', color: '#92400e'
        }}>
          <strong>{t('some_data_not_loaded_permissions') || 'Some collections could not be loaded (permissions):'}</strong>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(permErrors).map(key => (
              <span key={key} style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', fontSize: 12 }}>
                {key}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Global Filters (hidden when externalFilters lock them) ── */}
      {!externalFilters.studentId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
          <Select
            value={localFilters.programId}
            onChange={e => setLocalFilters(f => ({ ...f, programId: e.target.value, subjectId: '' }))}
            options={[
              { value: '', label: t('all_programs') || 'All Programs' },
              ...(rawData.programs || []).map(p => ({ value: p.docId || p.id, label: p.name_en || p.name || p.code || p.docId }))
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
                .map(s => ({ value: s.docId || s.id, label: `${s.code || ''} - ${s.name_en || s.name || s.docId}`.trim() }))
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
                const label = c?.title || c?.name_en || c?.name || c?.code || `Class ${id.slice(0, 6)}`;
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
              }).filter(Boolean))).map(v => ({ value: v, label: v }))
            ]}
            searchable
            fullWidth
          />
          <Select
            value={localFilters.semester}
            onChange={e => setLocalFilters(f => ({ ...f, semester: e.target.value }))}
            options={[
              { value: '', label: t('all_semesters') || 'All Semesters' },
              ...Array.from(new Set((rawData.subjects || []).map(s => s.semester).filter(Boolean))).map(v => ({ value: v, label: v }))
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
          />
          <Select
            value={localFilters.studentId}
            onChange={e => setLocalFilters(f => ({ ...f, studentId: e.target.value }))}
            options={[
              { value: '', label: t('all_students') || 'All Students' },
              ...(rawData.users || [])
                .filter(u => u.isStudent)
                .map(u => ({ value: u.id, label: u.realName || u.displayName || u.email || u.id }))
            ]}
            searchable
            fullWidth
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
        rawData={rawData}
        globalFilters={mergedFilters}
        accentColor={accentColor}
        editLayout={editLayout}
        defaultWidgets={defaultWidgets}
        storageKey={storageKey}
        isLoading={loading}
        lastUpdatedAt={lastUpdatedAt}
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
