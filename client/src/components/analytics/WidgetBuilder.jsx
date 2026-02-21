import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Select, DateRangeSlider } from '@ui';

/**
 * DATA_SOURCES
 * Single source of truth for all available collections and their valid groupBy fields.
 */
export const DATA_SOURCES = [
  // ── Merged / virtual sources ──────────────────────────────────────────────
  { value: 'activities,announcements,resources', labelKey: 'ds_all_activities', label: 'All Activities (merged)', groupBy: ['type', '_source', 'classId', 'programId', 'subjectId', 'userId', 'date'] },

  // ── Single collections ────────────────────────────────────────────────────
  { value: 'activities',              labelKey: 'ds_activities',               groupBy: ['type', 'classId', 'programId', 'subjectId', 'userId', 'date', 'semester', 'term'] },
  { value: 'announcements',           labelKey: 'ds_announcements',            groupBy: ['type', 'classId', 'programId', 'userId', 'date'] },
  { value: 'resources',               labelKey: 'ds_resources',                groupBy: ['type', 'classId', 'programId', 'subjectId', 'userId', 'date'] },
  { value: 'submissions',             labelKey: 'ds_submissions',              groupBy: ['status', 'classId', 'programId', 'subjectId', 'userId', 'date', 'semester', 'term', 'year'] },
  { value: 'attendance',              labelKey: 'ds_attendance',               groupBy: ['attendanceType', 'status', 'classId', 'programId', 'date', 'term', 'semester'] },
  { value: 'attendanceSessions',      labelKey: 'ds_attendance_sessions',      groupBy: ['status', 'classId', 'programId', 'date'] },
  { value: 'enrollments',             labelKey: 'ds_enrollments',              groupBy: ['status', 'classId', 'programId', 'subjectId', 'semester', 'year'] },
  { value: 'users',                   labelKey: 'ds_users',                    groupBy: ['role', 'status', 'programId', 'date'] },
  { value: 'classes',                 labelKey: 'ds_classes',                  groupBy: ['programId', 'term', 'year', 'semester', 'status'] },
  { value: 'programs',                labelKey: 'ds_programs',                 groupBy: ['status', 'type'] },
  { value: 'subjects',                labelKey: 'ds_subjects',                 groupBy: ['programId', 'semester', 'type'] },
  { value: 'courses',                 labelKey: 'ds_courses',                  groupBy: ['status', 'type', 'programId'] },
  { value: 'quizzes',                 labelKey: 'ds_quizzes',                  groupBy: ['type', 'difficulty', 'classId', 'programId', 'subjectId'] },
  { value: 'quizSubmissions',         labelKey: 'ds_quiz_submissions',         groupBy: ['status', 'classId', 'userId', 'date'] },
  { value: 'penalties',               labelKey: 'ds_penalties',                groupBy: ['penaltyType', 'classId', 'userId', 'date'] },
  { value: 'absences',                labelKey: 'ds_absences',                 groupBy: ['absenceType', 'classId', 'userId', 'date'] },
  { value: 'behaviors',               labelKey: 'ds_behaviors',                groupBy: ['type', 'classId', 'studentId', 'programId', 'subjectId', 'date'] },
  { value: 'participations',          labelKey: 'ds_participations',           groupBy: ['type', 'classId', 'studentId', 'programId', 'subjectId', 'date'] },
  { value: 'notifications',           labelKey: 'ds_notifications',            groupBy: ['type', 'status', 'date'] },
  { value: 'notificationLogs',        labelKey: 'ds_notification_logs',        groupBy: ['type', 'status', 'date'] },
  { value: 'activityLogs',            labelKey: 'ds_activity_logs',            groupBy: ['type', 'userId', 'date'] },
  { value: 'emailLogs',               labelKey: 'ds_email_logs',               groupBy: ['status', 'type', 'date'] },
  { value: 'studentMarks',            labelKey: 'ds_student_marks',            groupBy: ['markType', 'classId', 'userId', 'programId', 'subjectId'] },
  { value: 'studentProgress',         labelKey: 'ds_student_progress',         groupBy: ['status', 'classId', 'userId', 'programId', 'subjectId'] },
  { value: 'subjectMarksDistribution',labelKey: 'ds_marks_distribution',       groupBy: ['subjectId', 'programId', 'classId'] },
  { value: 'scheduledReports',        labelKey: 'ds_scheduled_reports',        groupBy: ['status', 'type', 'date'] },
];

const GROUP_BY_KEYS = {
  status: 'gb_status', type: 'gb_type', classId: 'gb_class', programId: 'gb_program',
  subjectId: 'gb_subject', userId: 'gb_user', date: 'gb_date', semester: 'gb_semester',
  term: 'gb_term', year: 'gb_year', role: 'gb_role', difficulty: 'gb_difficulty',
  penaltyType: 'gb_penalty_type', absenceType: 'gb_absence_type',
  attendanceStatus: 'gb_status', attendanceType: 'gb_attendance_type', markType: 'gb_mark_type',
  studentId: 'gb_student', _source: 'gb_source',
};

const AGGREGATION_KEYS = [
  { value: 'count',  key: 'agg_count' },
  { value: 'sum',    key: 'agg_sum' },
  { value: 'avg',    key: 'agg_avg' },
  { value: 'min',    key: 'agg_min' },
  { value: 'max',    key: 'agg_max' },
  { value: 'median', key: 'agg_median' },
];

const DATE_RANGE_KEYS = [
  { value: 'all',    key: 'all_time' },
  { value: 'today',  key: 'today' },
  { value: 'last7',  key: 'last_7_days' },
  { value: 'last30', key: 'last_30_days' },
  { value: 'last90', key: 'last_90_days' },
  { value: 'custom', key: 'custom_range' },
];

/**
 * DEFAULT_WIDGET_CONFIG
 * The canonical JSON schema for a widget.
 */
export const DEFAULT_WIDGET_CONFIG = {
  id: null,
  title: '',
  title_en: '',
  title_ar: '',
  chartType: 'bar',
  dataSource: 'submissions',
  groupBy: 'status',
  aggregation: 'count',
  filters: [],
  dateRange: 'all',
  customDateFrom: '',
  customDateTo: '',
  comparisonMode: false,
  comparisonPeriod: 'previous',
  layout: { isPinned: false, isMinimized: false, x: 0, y: 0, w: 6, h: 4 }
};

/**
 * WidgetBuilder
 * Modal form that produces a widget config object matching DEFAULT_WIDGET_CONFIG.
 *
 * Props:
 *   isOpen        - bool
 *   config        - current widgetConfig state
 *   onChange      - (partial) => void  (merges into config)
 *   onSave        - () => void
 *   onCancel      - () => void
 *   isEditing     - bool
 *   accentColor   - hex string
 */
const WidgetBuilder = ({ isOpen, config, onChange, onSave, onCancel, isEditing = false, accentColor }) => {
  const { theme } = useTheme();
  const { t } = useLang();

  if (!isOpen) return null;

  const currentSource = DATA_SOURCES.find(s => s.value === config.dataSource) || DATA_SOURCES[0];
  const groupByOptions = currentSource.groupBy.map(v => ({ value: v, label: t(GROUP_BY_KEYS[v]) || v }));

  const set = (partial) => onChange(partial);

  const CHART_TYPES = [
    { type: 'bar',  icon: getThemedIcon('ui', 'bar_chart3', 20, theme),   label: t('bar')  || 'Bar' },
    { type: 'line', icon: getThemedIcon('ui', 'line_chart', 20, theme),   label: t('line') || 'Line' },
    { type: 'pie',  icon: getThemedIcon('ui', 'pie_chart', 20, theme),    label: t('pie')  || 'Pie' },
    { type: 'area', icon: getThemedIcon('ui', 'trending_up', 20, theme),  label: t('area') || 'Area' },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--panel)', color: 'var(--text)',
          padding: '2rem', borderRadius: 16,
          minWidth: 560, maxWidth: '92vw', maxHeight: '90vh',
          overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            {isEditing ? (t('edit_widget') || 'Edit Widget') : (t('create_new_widget') || 'Create New Widget')}
          </h2>
          <button
            onClick={onCancel}
            style={{ padding: '0.35rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', display: 'flex', color: 'var(--text)' }}
          >
            {getThemedIcon('ui', 'close', 18, theme)}
          </button>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>

          {/* Widget Title */}
          <Field label={t('title') || 'Title'}>
            <input
              type="text"
              value={config.title}
              onChange={e => set({ title: e.target.value })}
              placeholder={t('widget_title_placeholder') || 'e.g., Submissions by Status'}
              style={inputStyle}
            />
          </Field>

          {/* Bilingual Titles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t('title_en') || 'Title (English)'}>
              <input
                type="text"
                value={config.title_en || ''}
                onChange={e => set({ title_en: e.target.value })}
                placeholder="e.g., Attendance by Type"
                style={inputStyle}
                dir="ltr"
              />
            </Field>
            <Field label={t('title_ar') || 'Title (Arabic)'}>
              <input
                type="text"
                value={config.title_ar || ''}
                onChange={e => set({ title_ar: e.target.value })}
                placeholder="مثال: الحضور حسب النوع"
                style={inputStyle}
                dir="rtl"
              />
            </Field>
          </div>

          {/* Chart Type */}
          <Field label={t('chart_type') || 'Chart Type'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {CHART_TYPES.map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => set({ chartType: type })}
                  style={{
                    padding: '0.85rem 0.5rem',
                    border: config.chartType === type ? `2px solid ${accentColor}` : '1px solid var(--border)',
                    borderRadius: 8,
                    background: config.chartType === type ? `${accentColor}18` : 'transparent',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                  }}
                >
                  <span style={{ color: config.chartType === type ? accentColor : 'var(--text)' }}>{icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: config.chartType === type ? accentColor : 'var(--text)' }}>{label}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Data Source */}
          <Field label={t('data_source') || 'Data Source'}>
            <Select
              value={config.dataSource}
              onChange={e => set({ dataSource: e.target.value, groupBy: DATA_SOURCES.find(s => s.value === e.target.value)?.groupBy[0] || 'status' })}
              options={DATA_SOURCES.map(s => ({ value: s.value, label: t(s.labelKey) || s.label || s.value }))}
              fullWidth
            />
          </Field>

          {/* Group By + Aggregation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t('group_by') || 'Group By'}>
              <Select
                value={config.groupBy}
                onChange={e => set({ groupBy: e.target.value })}
                options={groupByOptions}
                fullWidth
              />
            </Field>
            <Field label={t('aggregation') || 'Aggregation'}>
              <Select
                value={config.aggregation}
                onChange={e => set({ aggregation: e.target.value })}
                options={AGGREGATION_KEYS.map(a => ({ value: a.value, label: t(a.key) || a.value }))}
                fullWidth
              />
            </Field>
          </div>

          {/* Date Range */}
          <Field label={t('date_range') || 'Date Range'}>
            <Select
              value={config.dateRange}
              onChange={e => set({ dateRange: e.target.value, customDateFrom: '', customDateTo: '' })}
              options={DATE_RANGE_KEYS.map(r => ({ value: r.value, label: t(r.key) || r.value }))}
              fullWidth
            />
            {config.dateRange === 'custom' && (
              <div style={{ marginTop: 10 }}>
                <DateRangeSlider
                  fromDate={config.customDateFrom}
                  toDate={config.customDateTo}
                  onChange={({ fromDate, toDate }) => set({ customDateFrom: fromDate, customDateTo: toDate })}
                  placeholderFrom={t('from_date') || 'From Date'}
                  placeholderTo={t('to_date') || 'To Date'}
                  fullWidth
                />
              </div>
            )}
          </Field>

          {/* Comparison Mode */}
          <Field label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={config.comparisonMode}
                onChange={e => set({ comparisonMode: e.target.checked })}
                style={{ width: 16, height: 16, accentColor }}
              />
              {t('comparison_mode') || 'Comparison Mode'}
            </label>
            {config.comparisonMode && (
              <div style={{ marginTop: 10 }}>
                <Select
                  value={config.comparisonPeriod}
                  onChange={e => set({ comparisonPeriod: e.target.value })}
                  options={[
                    { value: 'previous', label: t('vs_previous_period') || 'vs Previous Period' },
                    { value: 'lastYear', label: t('vs_last_year') || 'vs Last Year' },
                  ]}
                  fullWidth
                />
              </div>
            )}
          </Field>

          {/* Grid Size hint */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t('width_columns') || 'Width (columns 1–12)'}>
              <input
                type="number"
                min={2} max={12}
                value={config.layout?.w ?? 6}
                onChange={e => set({ layout: { ...(config.layout || {}), w: Number(e.target.value) } })}
                style={inputStyle}
              />
            </Field>
            <Field label={t('height_rows') || 'Height (rows)'}>
              <input
                type="number"
                min={2} max={12}
                value={config.layout?.h ?? 4}
                onChange={e => set({ layout: { ...(config.layout || {}), h: Number(e.target.value) } })}
                style={inputStyle}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 12, marginTop: '2rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '0.7rem 1.4rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={onSave}
            style={{ padding: '0.7rem 1.4rem', background: accentColor, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {getThemedIcon('ui', 'save', 16, theme)}
            {isEditing ? (t('update') || 'Update') : (t('create') || 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      {label && (
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--input-bg)',
  color: 'var(--text)',
  fontSize: 14,
  boxSizing: 'border-box'
};

export default WidgetBuilder;
