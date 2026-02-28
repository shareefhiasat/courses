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
  { value: 'activities,announcements,resources', labelKey: 'all_activities', label: 'Activities (merged)', groupBy: ['classId', 'programId', 'subjectId', 'userId', 'createdBy', 'date'] },

  // ── Single collections ────────────────────────────────────────────────────
  { value: 'announcements',           labelKey: 'announcements',            groupBy: ['classId', 'programId', 'userId', 'createdBy', 'date'] },
  { value: 'resources',               labelKey: 'resources',                groupBy: ['classId', 'programId', 'subjectId', 'userId', 'createdBy', 'date'] },
  { value: 'attendance',              labelKey: 'attendance',               groupBy: ['attendanceType', 'classId', 'programId', 'studentId', 'createdBy', 'date'] },
  { value: 'enrollments',             labelKey: 'enrollments',              groupBy: ['classId', 'programId', 'subjectId', 'createdBy', 'date'] },
  { value: 'users',                   labelKey: 'users',                    groupBy: ['role', 'programId', 'createdBy', 'date'] },
  { value: 'classes',                 labelKey: 'classes',                  groupBy: ['programId', 'term', 'year', 'createdBy'] },
  { value: 'programs',                labelKey: 'programs',                 groupBy: ['createdBy'] },
  { value: 'subjects',                labelKey: 'subjects',                 groupBy: ['programId', 'createdBy'] },
  { value: 'penalties',               labelKey: 'penalties',                groupBy: ['penaltyType', 'classId', 'userId', 'createdBy', 'date'] },
  { value: 'absences',                labelKey: 'absences',                 groupBy: ['absenceType', 'classId', 'userId', 'createdBy', 'date'] },
  { value: 'behaviors',               labelKey: 'behaviors',                groupBy: ['classId', 'studentId', 'programId', 'subjectId', 'createdBy', 'date'] },
  { value: 'participations',          labelKey: 'participations',           groupBy: ['classId', 'studentId', 'programId', 'subjectId', 'createdBy', 'date'] },
  { value: 'activityLogs',            labelKey: 'activity_logs',            groupBy: ['userId', 'createdBy', 'date'] },
];

const GROUP_BY_KEYS = {
  status: 'gb_status', classId: 'gb_class', programId: 'gb_program',
  subjectId: 'gb_subject', userId: 'gb_user', date: 'gb_date',
  term: 'gb_term', year: 'gb_year', role: 'gb_role', difficulty: 'gb_difficulty',
  penaltyType: 'gb_penalty_type', absenceType: 'gb_absence_type',
  attendanceStatus: 'gb_status', attendanceType: 'gb_attendance_type', markType: 'gb_mark_type',
  studentId: 'gb_student', createdBy: 'Created By',
};

const AGGREGATION_KEYS = [
  { value: 'count',  key: 'agg_count' },
  // TODO: Add other aggregations when needed
  // { value: 'sum',    key: 'agg_sum' },
  // { value: 'avg',    key: 'agg_avg' },
  // { value: 'min',    key: 'agg_min' },
  // { value: 'max',    key: 'agg_max' },
  // { value: 'median', key: 'agg_median' },
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

  const getInputStyle = () => ({
    width: '100%',
    padding: '0.7rem 0.9rem',
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--input-bg)',
    color: theme === 'dark' ? '#ffffff' : '#212529',
    fontSize: 14,
    boxSizing: 'border-box'
  });

  if (!isOpen) return null;

  const isListWidget = config.chartType === 'list';

  // Restrict data sources for list widgets
  const LIST_ALLOWED_SOURCES = [
    'activities,announcements,resources',
    'activities',
    'participations',
    'penalties',
    'behaviors',
    'users',
    'enrollments',
    'attendance'
  ];

  const availableDataSources = isListWidget
    ? DATA_SOURCES.filter(s => LIST_ALLOWED_SOURCES.includes(s.value))
    : DATA_SOURCES;

  const currentSource = availableDataSources.find(s => s.value === config.dataSource) || availableDataSources[0];
  const groupByOptions = currentSource.groupBy.map(v => ({ value: v, label: t(GROUP_BY_KEYS[v]) || v }));

  const set = (partial) => onChange(partial);

  const CHART_TYPES = [
    { type: 'bar',  icon: getThemedIcon('ui', 'bar_chart3', 20, theme),   label: t('bar')  || 'Bar' },
    { type: 'line', icon: getThemedIcon('ui', 'line_chart', 20, theme),   label: t('line') || 'Line' },
    { type: 'pie',  icon: getThemedIcon('ui', 'pie_chart', 20, theme),    label: t('pie')  || 'Pie' },
    { type: 'donut', icon: getThemedIcon('ui', 'pie_chart', 20, theme),  label: t('donut') || 'Donut' },
    { type: 'list', icon: getThemedIcon('ui', 'list', 20, theme),        label: t('list') || 'List' },
    { type: 'count', icon: getThemedIcon('ui', 'hash', 20, theme),       label: t('count') || 'Count' },
  ];

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}
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
              style={getInputStyle()}
            />
          </Field>

          {/* Bilingual Titles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t('title_en') || 'Title (English)'}>
              <input
                type="text"
                value={config.titleEn || ''}
                onChange={e => set({ titleEn: e.target.value })}
                placeholder={t('widget_title_en_placeholder') || 'e.g., Attendance by Type'}
                style={getInputStyle()}
                dir="ltr"
              />
            </Field>
            <Field label={t('title_ar') || 'Title (Arabic)'}>
              <input
                type="text"
                value={config.titleAr || ''}
                onChange={e => set({ titleAr: e.target.value })}
                placeholder={t('widget_title_ar_placeholder') || 'مثال: الحضور حسب النوع'}
                style={getInputStyle()}
                dir="rtl"
              />
            </Field>
          </div>

          {/* Chart Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {CHART_TYPES.map(({ type, icon, label }) => (
              <div
                key={type}
                onClick={() => set({ chartType: type })}
                style={{
                  padding: '12px 8px',
                  border: config.chartType === type ? `2px solid ${accentColor}` : '1px solid var(--border)',
                  borderRadius: 8,
                  background: config.chartType === type 
                    ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                    : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s ease',
                  transform: config.chartType === type ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: config.chartType === type ? `0 1px 4px ${accentColor}20` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (config.chartType !== type) {
                    e.target.style.background = 'var(--hover)';
                    e.target.style.transform = 'scale(1.01)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (config.chartType !== type) {
                    e.target.style.background = 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
              >
                <span style={{ color: config.chartType === type ? accentColor : 'var(--text)' }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: config.chartType === type ? accentColor : 'var(--text)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Data Source */}
          <Select
            value={config.dataSource}
            onChange={e => {
              const newDataSource = e.target.value;
              const source = availableDataSources.find(s => s.value === newDataSource);
              // Only set groupBy if chart type is not count
              const newGroupBy = config.chartType === 'count' ? '' : (source?.groupBy[0] || 'status');
              set({ dataSource: newDataSource, groupBy: newGroupBy });
            }}
            options={availableDataSources.map(s => ({ value: s.value, label: t(s.labelKey) || s.label || s.value }))}
            fullWidth
          />

          {/* Group By + Aggregation */}
          <div style={{ display: 'grid', gridTemplateColumns: isListWidget ? '1fr' : '1fr 1fr', gap: 12 }}>
            {/* Group By - Hide for count charts */}
            {!isListWidget && config.chartType !== 'count' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                {/* First Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* None option */}
                  <div
                    key="none"
                    onClick={() => set({ groupBy: '' })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: !config.groupBy || config.groupBy === '' ? `2px solid ${accentColor}` : '1px solid var(--border)',
                      background: !config.groupBy || config.groupBy === '' 
                        ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                        : 'transparent',
                      fontSize: 12,
                      fontWeight: 400,
                      color: !config.groupBy || config.groupBy === '' ? accentColor : 'var(--text)',
                      textAlign: 'center',
                      transform: !config.groupBy || config.groupBy === '' ? 'scale(1.01)' : 'scale(1)',
                      boxShadow: !config.groupBy || config.groupBy === '' ? `0 1px 4px ${accentColor}20` : 'none',
                      opacity: config.chartType === 'count' ? 0.5 : 1,
                      pointerEvents: config.chartType === 'count' ? 'none' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      if (config.groupBy && config.chartType !== 'count') {
                        e.target.style.background = 'var(--hover)';
                        e.target.style.transform = 'scale(1.005)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (config.groupBy && config.chartType !== 'count') {
                        e.target.style.background = 'transparent';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {t('none') || 'None'}
                  </div>
                  
                  {/* Program */}
                  {groupByOptions.find(o => o.value === 'programId') && (
                    <div
                      key="programId"
                      onClick={() => set({ groupBy: 'programId' })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: config.groupBy === 'programId' ? `2px solid ${accentColor}` : '1px solid var(--border)',
                        background: config.groupBy === 'programId' 
                          ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                          : 'transparent',
                        fontSize: 12,
                        fontWeight: 400,
                        color: config.groupBy === 'programId' ? accentColor : 'var(--text)',
                        textAlign: 'center',
                        transform: config.groupBy === 'programId' ? 'scale(1.01)' : 'scale(1)',
                        boxShadow: config.groupBy === 'programId' ? `0 1px 4px ${accentColor}20` : 'none',
                        opacity: config.chartType === 'count' ? 0.5 : 1,
                        pointerEvents: config.chartType === 'count' ? 'none' : 'auto'
                      }}
                      onMouseEnter={(e) => {
                        if (config.groupBy !== 'programId' && config.chartType !== 'count') {
                          e.target.style.background = 'var(--hover)';
                          e.target.style.transform = 'scale(1.005)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (config.groupBy !== 'programId' && config.chartType !== 'count') {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {groupByOptions.find(o => o.value === 'programId')?.label || 'Program'}
                    </div>
                  )}
                  
                  {/* Subject */}
                  {groupByOptions.find(o => o.value === 'subjectId') && (
                    <div
                      key="subjectId"
                      onClick={() => set({ groupBy: 'subjectId' })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: config.groupBy === 'subjectId' ? `2px solid ${accentColor}` : '1px solid var(--border)',
                        background: config.groupBy === 'subjectId' 
                          ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                          : 'transparent',
                        fontSize: 12,
                        fontWeight: 400,
                        color: config.groupBy === 'subjectId' ? accentColor : 'var(--text)',
                        textAlign: 'center',
                        transform: config.groupBy === 'subjectId' ? 'scale(1.01)' : 'scale(1)',
                        boxShadow: config.groupBy === 'subjectId' ? `0 1px 4px ${accentColor}20` : 'none',
                        opacity: config.chartType === 'count' ? 0.5 : 1,
                        pointerEvents: config.chartType === 'count' ? 'none' : 'auto'
                      }}
                      onMouseEnter={(e) => {
                        if (config.groupBy !== 'subjectId' && config.chartType !== 'count') {
                          e.target.style.background = 'var(--hover)';
                          e.target.style.transform = 'scale(1.005)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (config.groupBy !== 'subjectId' && config.chartType !== 'count') {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {groupByOptions.find(o => o.value === 'subjectId')?.label || 'Subject'}
                    </div>
                  )}
                  
                  {/* Class */}
                  {groupByOptions.find(o => o.value === 'classId') && (
                    <div
                      key="classId"
                      onClick={() => set({ groupBy: 'classId' })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: config.groupBy === 'classId' ? `2px solid ${accentColor}` : '1px solid var(--border)',
                        background: config.groupBy === 'classId' 
                          ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                          : 'transparent',
                        fontSize: 12,
                        fontWeight: 400,
                        color: config.groupBy === 'classId' ? accentColor : 'var(--text)',
                        textAlign: 'center',
                        transform: config.groupBy === 'classId' ? 'scale(1.01)' : 'scale(1)',
                        boxShadow: config.groupBy === 'classId' ? `0 1px 4px ${accentColor}20` : 'none',
                        opacity: config.chartType === 'count' ? 0.5 : 1,
                        pointerEvents: config.chartType === 'count' ? 'none' : 'auto'
                      }}
                      onMouseEnter={(e) => {
                        if (config.groupBy !== 'classId' && config.chartType !== 'count') {
                          e.target.style.background = 'var(--hover)';
                          e.target.style.transform = 'scale(1.005)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (config.groupBy !== 'classId' && config.chartType !== 'count') {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {groupByOptions.find(o => o.value === 'classId')?.label || 'Class'}
                    </div>
                  )}
                </div>
                
                {/* Second Column - Other options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Activity Type option */}
                  <div
                    key="type"
                    onClick={() => set({ groupBy: 'type' })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: config.groupBy === 'type' ? `2px solid ${accentColor}` : '1px solid var(--border)',
                      background: config.groupBy === 'type' 
                        ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                        : 'transparent',
                      fontSize: 12,
                      fontWeight: 400,
                      color: config.groupBy === 'type' ? accentColor : 'var(--text)',
                      textAlign: 'center',
                      transform: config.groupBy === 'type' ? 'scale(1.01)' : 'scale(1)',
                      boxShadow: config.groupBy === 'type' ? `0 1px 4px ${accentColor}20` : 'none',
                      opacity: config.chartType === 'count' ? 0.5 : 1,
                      pointerEvents: config.chartType === 'count' ? 'none' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      if (config.groupBy !== 'type' && config.chartType !== 'count') {
                        e.target.style.background = 'var(--hover)';
                        e.target.style.transform = 'scale(1.005)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (config.groupBy !== 'type' && config.chartType !== 'count') {
                        e.target.style.background = 'transparent';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {t('type') || 'Type'}
                  </div>
                  
                  {groupByOptions
                    .filter(option => !['programId', 'subjectId', 'classId', 'type'].includes(option.value))
                    .map(option => (
                      <div
                        key={option.value}
                        onClick={() => set({ groupBy: option.value })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: config.groupBy === option.value ? `2px solid ${accentColor}` : '1px solid var(--border)',
                          background: config.groupBy === option.value 
                            ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                            : 'transparent',
                          fontSize: 12,
                          fontWeight: 400,
                          color: config.groupBy === option.value ? accentColor : 'var(--text)',
                          textAlign: 'center',
                          transform: config.groupBy === option.value ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: config.groupBy === option.value ? `0 1px 4px ${accentColor}20` : 'none',
                          opacity: config.chartType === 'count' ? 0.5 : 1,
                          pointerEvents: config.chartType === 'count' ? 'none' : 'auto'
                        }}
                        onMouseEnter={(e) => {
                          if (config.groupBy !== option.value && config.chartType !== 'count') {
                            e.target.style.background = 'var(--hover)';
                            e.target.style.transform = 'scale(1.005)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (config.groupBy !== option.value && config.chartType !== 'count') {
                            e.target.style.background = 'transparent';
                            e.target.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Aggregation */}
            {!isListWidget && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                gap: 6,
                marginTop: 4
              }}>
                {AGGREGATION_KEYS.map(a => (
                  <div
                    key={a.value}
                    onClick={() => {
                      set({ aggregation: a.value });
                      // Only clear groupBy when switching to count chart type, not just count aggregation
                      if (config.chartType === 'count') {
                        set({ groupBy: '' });
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: config.aggregation === a.value ? `2px solid ${accentColor}` : '1px solid var(--border)',
                      background: config.aggregation === a.value 
                        ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                        : 'transparent',
                      fontSize: 12,
                      fontWeight: 400,
                      color: config.aggregation === a.value ? accentColor : 'var(--text)',
                      textAlign: 'center',
                      transform: config.aggregation === a.value ? 'scale(1.01)' : 'scale(1)',
                      boxShadow: config.aggregation === a.value ? `0 1px 4px ${accentColor}20` : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (config.aggregation !== a.value) {
                        e.target.style.background = 'var(--hover)';
                        e.target.style.transform = 'scale(1.005)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (config.aggregation !== a.value) {
                        e.target.style.background = 'transparent';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {t(a.key) || a.value}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: 8,
            marginTop: 4
          }}>
            {DATE_RANGE_KEYS.map(r => (
              <div
                key={r.value}
                onClick={() => set({ dateRange: r.value, customDateFrom: '', customDateTo: '' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: config.dateRange === r.value ? `2px solid ${accentColor}` : '1px solid var(--border)',
                  background: config.dateRange === r.value 
                    ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                    : 'transparent',
                  fontSize: 13,
                  fontWeight: 400,
                  color: config.dateRange === r.value ? accentColor : 'var(--text)',
                  textAlign: 'center',
                  transform: config.dateRange === r.value ? 'scale(1.01)' : 'scale(1)',
                  boxShadow: config.dateRange === r.value ? `0 1px 4px ${accentColor}20` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (config.dateRange !== r.value) {
                    e.target.style.background = 'var(--hover)';
                    e.target.style.transform = 'scale(1.005)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (config.dateRange !== r.value) {
                    e.target.style.background = 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
              >
                {t(r.key) || r.value}
              </div>
            ))}
          </div>
            {config.dateRange === 'custom' && (
              <div style={{ marginTop: 16 }}>
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

          {/* Comparison Mode - Deprecated */}
          {/* <Field label="">
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
          </Field> */}

          {/* Grid Size hint */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t('width_columns') || 'Width (columns 1–12)'}>
              <input
                type="number"
                min={2} max={12}
                value={config.layout?.w ?? 6}
                onChange={e => set({ layout: { ...(config.layout || {}), w: Number(e.target.value) } })}
                style={getInputStyle()}
              />
            </Field>
            <Field label={t('height_rows') || 'Height (rows)'}>
              <input
                type="number"
                min={2} max={12}
                value={config.layout?.h ?? 4}
                onChange={e => set({ layout: { ...(config.layout || {}), h: Number(e.target.value) } })}
                style={getInputStyle()}
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
            {getThemedIcon('ui', 'save', 16, 'white')}
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

export default WidgetBuilder;
