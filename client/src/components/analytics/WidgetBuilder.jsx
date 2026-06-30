import React, { useState, useMemo } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { Select, DateRangeSlider, PortalTooltip } from '@ui';
import {
  SOURCE_CATEGORIES,
  getCountMetricsForSource,
  getSourcesForChartType,
} from '@constants/widgetDataSources';

import { info, error, warn, debug } from '@services/utils/logger.js';

/** Re-export for backward compatibility */
export { DATA_SOURCES } from '@constants/widgetDataSources';

const GROUP_BY_KEYS = {
  status: 'gb_status', classId: 'gb_class', programId: 'gb_program',
  subjectId: 'gb_subject', userId: 'gb_user', date: 'gb_date',
  term: 'gb_term', year: 'gb_year', role: 'gb_role', difficulty: 'gb_difficulty',
  penaltyType: 'gb_penalty_type', absenceType: 'gb_absence_type',
  attendanceStatus: 'gb_status', attendanceType: 'gb_attendance_type', markType: 'gb_mark_type',
  studentId: 'gb_student', createdBy: 'Created By',
  instructorName: 'gb_instructor', instructorId: 'gb_instructor',
  classroomId: 'gb_classroom', roomName: 'gb_classroom',
  subjectName: 'gb_subject', className: 'gb_class', programName: 'gb_program',
  courseLabel: 'gb_course', breakType: 'gb_break_type', eventType: 'gb_event_type',
  usageType: 'gb_usage_type', dayOfWeek: 'gb_day_of_week', type: 'gb_type',
  startDate: 'gb_date', location: 'gb_location', primarySubject: 'gb_subject',
  coverageType: 'gb_coverage_type', recurrenceType: 'gb_recurrence_type', impactType: 'gb_impact_type',
  date: 'gb_date', markType: 'gb_mark_type', mimeType: 'gb_file_type',
  assigneeId: 'gb_assignee', studentId: 'gb_student', score: 'vf_score',
};

const AGGREGATION_KEYS = [
  { value: 'count',  key: 'agg_count' },
];

const NUMERIC_AGGREGATION_KEYS = [
  { value: 'count', key: 'agg_count' },
  { value: 'sum', key: 'agg_sum' },
  { value: 'average', key: 'agg_avg' },
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
  dataSource: 'activities,announcements,resources',
  groupBy: 'type',
  aggregation: 'count',
  filters: [],
  dateRange: 'all',
  customDateFrom: '',
  customDateTo: '',
  comparisonMode: false,
  comparisonPeriod: 'previous',
  layout: { isPinned: false, isMinimized: false, x: 0, y: 0, w: 6, h: 4 },
  listLimit: 50,
  listColumns: [],
};

const LIST_LIMIT_OPTIONS = [10, 25, 50, 100, 200];

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
const WidgetBuilder = ({ isOpen, config, onChange, onSave, onCancel, isEditing = false, accentColor, categoryScope = null }) => {
  const { theme } = useTheme();
  const { t } = useLang();
  const categoryTabs = useMemo(() => {
    if (categoryScope) {
      return SOURCE_CATEGORIES.filter((c) => c.id === categoryScope);
    }
    return SOURCE_CATEGORIES.filter((c) => c.id !== 'all');
  }, [categoryScope]);
  const [sourceCategory, setSourceCategory] = useState(categoryScope || categoryTabs[0]?.id || 'academic');

  const isListWidget = config.chartType === 'list';
  const isCountWidget = config.chartType === 'count';

  const availableDataSources = useMemo(
    () => getSourcesForChartType(config.chartType, sourceCategory),
    [config.chartType, sourceCategory],
  );

  const currentSource = useMemo(() => (
    availableDataSources.find((s) => s.value === config.dataSource)
      || getSourcesForChartType(config.chartType, 'all').find((s) => s.value === config.dataSource)
      || availableDataSources[0]
  ), [availableDataSources, config.chartType, config.dataSource]);

  const countOptions = useMemo(
    () => getCountMetricsForSource(config.dataSource),
    [config.dataSource],
  );
  const showCountMetricPicker = isCountWidget && countOptions.length > 0;

  const groupByOptions = useMemo(
    () => (currentSource?.groupBy || []).map((v) => ({ value: v, label: t(GROUP_BY_KEYS[v]) || v })),
    [currentSource?.groupBy, t],
  );

  const valueFieldOptions = useMemo(
    () => (currentSource?.valueFields || ['sessionCount', 'teachingHours']).map((v) => ({
      value: v,
      label: t(`vf_${v}`) || v,
    })),
    [currentSource?.valueFields, t],
  );

  const aggregationOptions = currentSource?.valueFields?.length
    ? NUMERIC_AGGREGATION_KEYS
    : AGGREGATION_KEYS;

  const getInputStyle = () => ({
    width: '100%',
    padding: '0.7rem 0.9rem',
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--input-bg)',
    color: theme === 'dark' ? '#ffffff' : '#212529',
    fontSize: 'var(--font-size-sm)',
    boxSizing: 'border-box'
  });

  if (!isOpen) return null;

  const set = (partial) => onChange(partial);
  const getInitialCountPatch = (source) => {
    const metric = getCountMetricsForSource(source?.value)?.[0];
    if (!metric) return {};
    return {
      countMetric: metric.value,
      statKey: metric.statKey,
      titleKey: metric.labelKey,
      aggregation: 'count',
    };
  };

  const CHART_TYPES = [
    { type: 'bar',  icon: getThemedIcon('ui', 'bar_chart3', 16, theme),   label: t('bar')  || 'Bar' },
    { type: 'line', icon: getThemedIcon('ui', 'line_chart', 16, theme),   label: t('line') || 'Line' },
    { type: 'pie',  icon: getThemedIcon('ui', 'pie_chart', 16, theme),    label: t('pie')  || 'Pie' },
    { type: 'donut', icon: getThemedIcon('ui', 'pie_chart', 16, theme),  label: t('donut') || 'Donut' },
    { type: 'list', icon: getThemedIcon('ui', 'list', 16, theme),        label: t('list') || 'List' },
    { type: 'count', icon: getThemedIcon('ui', 'hash', 16, theme),       label: t('count') || 'Count' },
  ];

  return (
    <div
      data-tour="widget-builder-modal"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              {isEditing ? (t('edit_widget') || 'Edit Widget') : (t('create_new_widget') || 'Create New Widget')}
            </h2>
            <PortalTooltip content={t('widget_builder_help') || 'Choose the chart type, data source, grouping, date range, and layout size. Only options compatible with the selected source are enabled.'} position="top">
              <span
                style={{ display: 'flex', color: 'var(--muted)', cursor: 'help' }}
                aria-label={t('widget_builder_help') || 'Widget builder help'}
              >
                {getThemedIcon('ui', 'help_circle', 16, theme)}
              </span>
            </PortalTooltip>
          </div>
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
          <div data-tour="widget-builder-chart-types" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {CHART_TYPES.map(({ type, icon, label }) => {
                const hasCompatibleSources = getSourcesForChartType(type, sourceCategory).length > 0;
                return (
              <div
                key={type}
                onClick={() => {
                  if (!hasCompatibleSources) return;
                  const nextSources = getSourcesForChartType(type, sourceCategory);
                  const stillValid = nextSources.some(s => s.value === config.dataSource);
                  const patch = { chartType: type };
                  if (!stillValid && nextSources[0]) {
                    patch.dataSource = nextSources[0].value;
                    patch.groupBy = type === 'count' ? '' : (nextSources[0].groupBy?.[0] || '');
                    if (type === 'count') {
                      Object.assign(patch, getInitialCountPatch(nextSources[0]));
                    }
                  }
                  if (type === 'count') {
                    patch.groupBy = '';
                    patch.aggregation = 'count';
                    if (stillValid) {
                      Object.assign(patch, getInitialCountPatch(currentSource));
                    }
                  }
                  set(patch);
                }}
                style={{
                  padding: '6px 4px',
                  border: config.chartType === type ? `2px solid ${accentColor}` : '1px solid var(--border)',
                  borderRadius: 6,
                  background: config.chartType === type 
                    ? `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)` 
                    : 'transparent',
                  cursor: hasCompatibleSources ? 'pointer' : 'not-allowed',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  transition: 'all 0.2s ease',
                  opacity: hasCompatibleSources ? 1 : 0.35,
                }}
              >
                <span style={{ color: config.chartType === type ? accentColor : 'var(--text)' }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: config.chartType === type ? accentColor : 'var(--text)' }}>{label}</span>
              </div>
            );})}
          </div>

          {/* Data source */}
          <div data-tour="widget-builder-data-source">
          <Field label={t('data_source') || 'Data Source'}>
            {categoryTabs.length > 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {categoryTabs.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSourceCategory(cat.id);
                    const nextSources = getSourcesForChartType(config.chartType, cat.id);
                    const stillValid = nextSources.some((source) => source.value === config.dataSource);
                    if (!stillValid && nextSources[0]) {
                      const patch = {
                        dataSource: nextSources[0].value,
                        groupBy: isCountWidget ? '' : (nextSources[0].groupBy?.[0] || ''),
                      };
                      if (isCountWidget) {
                        Object.assign(patch, getInitialCountPatch(nextSources[0]));
                      }
                      set(patch);
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer',
                    border: sourceCategory === cat.id ? `2px solid ${accentColor}` : '1px solid var(--border)',
                    background: sourceCategory === cat.id ? `${accentColor}15` : 'transparent',
                    color: sourceCategory === cat.id ? accentColor : 'var(--text)',
                    fontWeight: sourceCategory === cat.id ? 600 : 400,
                  }}
                >
                  {t(cat.labelKey) || cat.id}
                </div>
              ))}
            </div>
            )}
            <Select
              value={config.dataSource}
              onChange={e => {
                const newDataSource = e.target.value;
                const allSources = getSourcesForChartType(config.chartType, 'all');
                const source = allSources.find(s => s.value === newDataSource);
                const patch = { dataSource: newDataSource };
                if (isCountWidget) {
                  patch.groupBy = '';
                  Object.assign(patch, getInitialCountPatch(source));
                } else {
                  patch.groupBy = source?.groupBy?.[0] || 'status';
                }
                if (source?.valueFields?.length) {
                  patch.valueField = source.valueFields[0];
                }
                set(patch);
              }}
              options={availableDataSources.map(s => ({ value: s.value, label: t(s.labelKey) || s.label || s.value }))}
              placeholder={t('select_data_source') || 'Select a data source'}
              fullWidth
            />
          </Field>
          </div>

          {/* Count metric picker */}
          {showCountMetricPicker && (
            <Field label={t('what_to_count') || t('metric') || 'What to count'}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {countOptions.map((stat) => {
                  const selectedMetric = config.countMetric || config.statKey;
                  return (
                  <div
                    key={stat.value}
                    onClick={() => set({
                      countMetric: stat.value,
                      statKey: stat.statKey,
                      titleKey: stat.labelKey,
                      aggregation: 'count',
                      groupBy: '',
                    })}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)',
                      textAlign: 'center',
                      border: selectedMetric === stat.value ? `2px solid ${accentColor}` : '1px solid var(--border)',
                      background: selectedMetric === stat.value ? `${accentColor}15` : 'transparent',
                      color: selectedMetric === stat.value ? accentColor : 'var(--text)',
                    }}
                  >
                    {t(stat.labelKey) || stat.value}
                  </div>
                );})}
              </div>
            </Field>
          )}

          {/* Value field for sum aggregation on scheduling sources */}
          {!isListWidget && !isCountWidget && currentSource?.valueFields?.length > 0 && (
            <Field label={t('measure_field') || 'Measure'}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {valueFieldOptions.map((vf) => (
                  <div
                    key={vf.value}
                    onClick={() => set({ valueField: vf.value, aggregation: 'sum' })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)',
                      border: (config.valueField || 'sessionCount') === vf.value ? `2px solid ${accentColor}` : '1px solid var(--border)',
                      background: (config.valueField || 'sessionCount') === vf.value ? `${accentColor}15` : 'transparent',
                      color: (config.valueField || 'sessionCount') === vf.value ? accentColor : 'var(--text)',
                    }}
                  >
                    {vf.label}
                  </div>
                ))}
              </div>
            </Field>
          )}

          {/* List row limit */}
          {isListWidget && (
            <Field label={t('list_row_limit') || 'Row limit'}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {LIST_LIMIT_OPTIONS.map((limit) => (
                  <div
                    key={limit}
                    onClick={() => set({ listLimit: limit })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)',
                      border: (config.listLimit ?? 50) === limit ? `2px solid ${accentColor}` : '1px solid var(--border)',
                      background: (config.listLimit ?? 50) === limit ? `${accentColor}15` : 'transparent',
                      color: (config.listLimit ?? 50) === limit ? accentColor : 'var(--text)',
                    }}
                  >
                    {limit}
                  </div>
                ))}
              </div>
            </Field>
          )}

          {/* Group By + Aggregation */}
          <div style={{ display: 'grid', gridTemplateColumns: isListWidget ? '1fr' : '1fr 1fr', gap: 12 }}>
            {!isListWidget && !isCountWidget && (
              <Field label={t('group_by') || 'Group By'}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginTop: 4 }}>
                  {[{ value: '', label: t('none') || 'None' }, ...groupByOptions].map((option) => {
                    const selected = (config.groupBy || '') === option.value;
                    return (
                      <div
                        key={option.value || 'none'}
                        onClick={() => set({ groupBy: option.value })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-xs)',
                          textAlign: 'center',
                          border: selected ? `2px solid ${accentColor}` : '1px solid var(--border)',
                          background: selected ? `${accentColor}15` : 'transparent',
                          color: selected ? accentColor : 'var(--text)',
                        }}
                      >
                        {option.label}
                      </div>
                    );
                  })}
                </div>
              </Field>
            )}

            {/* Aggregation — only for sources without numeric measure fields */}
            {!isListWidget && !isCountWidget && !currentSource?.valueFields?.length && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                gap: 6,
                marginTop: 4
              }}>
                {aggregationOptions.map(a => (
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
                      fontSize: 'var(--font-size-xs)',
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
          <div data-tour="widget-builder-date-range">
          <Field label={t('date_range') || 'Date Range'}>
          <div style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: 6,
            overflowX: 'auto',
            marginTop: 4,
            paddingBottom: 2,
          }}>
            {DATE_RANGE_KEYS.map(r => (
              <div
                key={r.value}
                onClick={() => set({ dateRange: r.value, customDateFrom: '', customDateTo: '' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                  border: config.dateRange === r.value ? `2px solid ${accentColor}` : '1px solid var(--border)',
                  background: config.dateRange === r.value ? `${accentColor}15` : 'transparent',
                  fontSize: 'var(--font-size-xs)',
                  color: config.dateRange === r.value ? accentColor : 'var(--text)',
                }}
              >
                {t(r.key) || r.value}
              </div>
            ))}
          </div>
          </Field>
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
          </div>

          {/* Comparison Mode - Deprecated */}
          {/* <Field label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
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
          <div data-tour="widget-builder-size" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text)' }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export default WidgetBuilder;
