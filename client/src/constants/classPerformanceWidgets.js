/**
 * Class Performance Widgets Configuration
 * Defines widgets for class-level analytics in the Student Dashboard.
 * Follows the same pattern as studentPerformanceWidgets.js.
 */

export const CLASS_ANALYTICS_STORAGE_KEY = 'class_analytics';

// ── Widget factory helpers (same pattern as studentPerformanceWidgets) ──────
const countWidget = (id, dataSource, countMetric, statKey, titleEn, titleAr, layout, category) => ({
  id,
  titleEn,
  titleAr,
  title: titleEn,
  chartType: 'count',
  dataSource,
  countMetric,
  statKey,
  groupBy: '',
  aggregation: 'count',
  dateRange: 'current',
  filters: [],
  _category: category || 'overview',
  layout,
});

const chartWidget = (id, titleEn, titleAr, chartType, dataSource, groupBy, layout, extra = {}) => ({
  id,
  titleEn,
  titleAr,
  title: titleEn,
  chartType,
  dataSource,
  groupBy,
  aggregation: extra.aggregation || 'count',
  valueField: extra.valueField || 'recordCount',
  dateRange: extra.dateRange || 'current',
  filters: extra.filters || [],
  ...extra,
  layout,
});

// ── Default widgets for class analytics ────────────────────────────────────
export const CLASS_ANALYTICS_DEFAULT_WIDGETS = [
  // ═══ Overview ═══
  countWidget('ca_cnt_students', 'classOverviewStats', 'totalStudents', 'totalStudents', 'Total Students', 'إجمالي الطلاب', { x: 0, y: 0, w: 3, h: 3 }),
  countWidget('ca_cnt_att_rate', 'classOverviewStats', 'averageAttendance', 'averageAttendance', 'Avg Attendance %', 'متوسط الحضور %', { x: 3, y: 0, w: 3, h: 3 }),
  countWidget('ca_cnt_gpa', 'classOverviewStats', 'averageGPA', 'averageGPA', 'Average GPA', 'المعدل التراكمي', { x: 6, y: 0, w: 3, h: 3 }),
  countWidget('ca_cnt_enrollments', 'classOverviewStats', 'totalEnrollments', 'totalEnrollments', 'Total Enrollments', 'إجمالي التسجيلات', { x: 9, y: 0, w: 3, h: 3 }),
  countWidget('ca_cnt_att_records', 'classOverviewStats', 'totalAttendance', 'totalAttendance', 'Attendance Records', 'سجلات الحضور', { x: 0, y: 3, w: 3, h: 3 }),
  countWidget('ca_cnt_present', 'classOverviewStats', 'presentCount', 'presentCount', 'Present', 'حاضر', { x: 3, y: 3, w: 3, h: 3 }),
  countWidget('ca_cnt_absent', 'classOverviewStats', 'absentCount', 'absentCount', 'Absent', 'غائب', { x: 6, y: 3, w: 3, h: 3 }),
  countWidget('ca_cnt_late', 'classOverviewStats', 'lateCount', 'lateCount', 'Late', 'متأخر', { x: 9, y: 3, w: 3, h: 3 }),
  countWidget('ca_cnt_grade_a', 'classOverviewStats', 'gradeACount', 'gradeACount', 'Grade A', 'تقدير A', { x: 0, y: 6, w: 3, h: 3 }),
  countWidget('ca_cnt_grade_b', 'classOverviewStats', 'gradeBCount', 'gradeBCount', 'Grade B', 'تقدير B', { x: 3, y: 6, w: 3, h: 3 }),
  countWidget('ca_cnt_grade_c', 'classOverviewStats', 'gradeCCount', 'gradeCCount', 'Grade C', 'تقدير C', { x: 6, y: 6, w: 3, h: 3 }),
  countWidget('ca_cnt_grade_d', 'classOverviewStats', 'gradeDCount', 'gradeDCount', 'Grade D', 'تقدير D', { x: 9, y: 6, w: 3, h: 3 }),
  countWidget('ca_cnt_grade_f', 'classOverviewStats', 'gradeFCount', 'gradeFCount', 'Grade F', 'تقدير F', { x: 0, y: 9, w: 3, h: 3 }),
  countWidget('ca_cnt_penalties', 'classOverviewStats', 'totalPenalties', 'totalPenalties', 'Penalties', 'العقوبات', { x: 3, y: 9, w: 3, h: 3 }),
  countWidget('ca_cnt_behaviors', 'classOverviewStats', 'totalBehaviors', 'totalBehaviors', 'Behaviors', 'السلوكيات', { x: 6, y: 9, w: 3, h: 3 }),
  countWidget('ca_cnt_participations', 'classOverviewStats', 'totalParticipations', 'totalParticipations', 'Participations', 'المشاركات', { x: 9, y: 9, w: 3, h: 3 }),
  countWidget('ca_cnt_net_score', 'classOverviewStats', 'netScore', 'netScore', 'Net Score', 'النتيجة الصافية', { x: 0, y: 12, w: 3, h: 3 }),
  countWidget('ca_cnt_pen_points', 'classOverviewStats', 'penaltyPoints', 'penaltyPoints', 'Penalty Points', 'نقاط العقوبات', { x: 3, y: 12, w: 3, h: 3 }),
  countWidget('ca_cnt_par_points', 'classOverviewStats', 'participationPoints', 'participationPoints', 'Participation Points', 'نقاط المشاركة', { x: 6, y: 12, w: 3, h: 3 }),
  countWidget('ca_cnt_beh_points', 'classOverviewStats', 'behaviorPoints', 'behaviorPoints', 'Behavior Points', 'نقاط السلوك', { x: 9, y: 12, w: 3, h: 3 }),

  // ═══ Attendance (10 widgets) ═══
  countWidget('ca_att_cnt_records', 'classOverviewStats', 'totalAttendance', 'totalAttendance', 'Attendance Records', 'سجلات الحضور', { x: 0, y: 0, w: 3, h: 3 }, 'attendance'),
  countWidget('ca_att_cnt_present', 'classOverviewStats', 'presentCount', 'presentCount', 'Present', 'حاضر', { x: 3, y: 0, w: 3, h: 3 }, 'attendance'),
  countWidget('ca_att_cnt_absent', 'classOverviewStats', 'absentCount', 'absentCount', 'Absent', 'غائب', { x: 6, y: 0, w: 3, h: 3 }, 'attendance'),
  countWidget('ca_att_cnt_late', 'classOverviewStats', 'lateCount', 'lateCount', 'Late', 'متأخر', { x: 9, y: 0, w: 3, h: 3 }, 'attendance'),
  chartWidget('ca_att_status_pie', 'Attendance by Status', 'الحضور حسب الحالة', 'pie', 'attendance', 'status', { x: 0, y: 3, w: 6, h: 5 }),
  chartWidget('ca_att_status_donut', 'Attendance Status Distribution', 'توزيع حالة الحضور', 'donut', 'attendance', 'status', { x: 6, y: 3, w: 6, h: 5 }),
  chartWidget('ca_att_status_bar', 'Attendance Count by Status', 'عدد الحضور حسب الحالة', 'bar', 'attendance', 'status', { x: 0, y: 8, w: 6, h: 5 }),
  chartWidget('ca_att_timeline_bar', 'Attendance Records per Day', 'سجلات الحضور يومياً', 'bar', 'attendance', 'date', { x: 6, y: 8, w: 6, h: 5 }),
  chartWidget('ca_att_student_bar', 'Attendance by Student', 'الحضور حسب الطالب', 'bar', 'attendance', 'studentId', { x: 0, y: 13, w: 6, h: 5 }),
  chartWidget('ca_att_records_list', 'Attendance Detail', 'تفاصيل الحضور', 'list', 'attendance', '', { x: 0, y: 18, w: 12, h: 6 }, { listLimit: 100 }),

  // ═══ Penalties (10 widgets) ═══
  countWidget('ca_pen_cnt_total', 'classOverviewStats', 'totalPenalties', 'totalPenalties', 'Total Penalties', 'إجمالي العقوبات', { x: 0, y: 0, w: 3, h: 3 }, 'penalties'),
  countWidget('ca_pen_cnt_points', 'classOverviewStats', 'penaltyPoints', 'penaltyPoints', 'Penalty Points', 'نقاط العقوبات', { x: 3, y: 0, w: 3, h: 3 }, 'penalties'),
  countWidget('ca_pen_cnt_avg', 'classOverviewStats', 'avgPenaltyPoints', 'avgPenaltyPoints', 'Avg Penalty Points', 'متوسط نقاط العقوبات', { x: 6, y: 0, w: 3, h: 3 }, 'penalties'),
  countWidget('ca_pen_cnt_max', 'classOverviewStats', 'maxPenaltyPoints', 'maxPenaltyPoints', 'Max Penalty Points', 'أقصى نقاط العقوبات', { x: 9, y: 0, w: 3, h: 3 }, 'penalties'),
  chartWidget('ca_pen_type_donut', 'Penalties by Type', 'العقوبات حسب النوع', 'donut', 'penalties', 'penaltyType', { x: 0, y: 3, w: 6, h: 5 }),
  chartWidget('ca_pen_type_pie', 'Penalty Type Distribution', 'توزيع أنواع العقوبات', 'pie', 'penalties', 'penaltyType', { x: 6, y: 3, w: 6, h: 5 }),
  chartWidget('ca_pen_type_bar', 'Penalty Count by Type', 'عدد العقوبات حسب النوع', 'bar', 'penalties', 'penaltyType', { x: 0, y: 8, w: 6, h: 5 }),
  chartWidget('ca_pen_points_bar', 'Penalty Points by Type', 'نقاط العقوبات حسب النوع', 'bar', 'penalties', 'penaltyType', { x: 6, y: 8, w: 6, h: 5 }, { aggregation: 'sum', valueField: 'points' }),
  chartWidget('ca_pen_student_bar', 'Penalties by Student', 'العقوبات حسب الطالب', 'bar', 'penalties', 'studentId', { x: 0, y: 13, w: 6, h: 5 }),
  chartWidget('ca_pen_records_list', 'Penalty Records', 'سجلات العقوبات', 'list', 'penalties', '', { x: 0, y: 18, w: 12, h: 6 }, { listLimit: 100 }),

  // ═══ Behavior (10 widgets) ═══
  countWidget('ca_beh_cnt_total', 'classOverviewStats', 'totalBehaviors', 'totalBehaviors', 'Total Behaviors', 'إجمالي السلوكيات', { x: 0, y: 0, w: 3, h: 3 }, 'behavior'),
  countWidget('ca_beh_cnt_points', 'classOverviewStats', 'behaviorPoints', 'behaviorPoints', 'Behavior Points', 'نقاط السلوك', { x: 3, y: 0, w: 3, h: 3 }, 'behavior'),
  countWidget('ca_beh_cnt_positive', 'classOverviewStats', 'positiveBehaviorCount', 'positiveBehaviorCount', 'Positive Behaviors', 'السلوكيات الإيجابية', { x: 6, y: 0, w: 3, h: 3 }, 'behavior'),
  countWidget('ca_beh_cnt_negative', 'classOverviewStats', 'negativeBehaviorCount', 'negativeBehaviorCount', 'Negative Behaviors', 'السلوكيات السلبية', { x: 9, y: 0, w: 3, h: 3 }, 'behavior'),
  chartWidget('ca_beh_type_donut', 'Behaviors by Type', 'السلوكيات حسب النوع', 'donut', 'behaviors', 'behaviorType', { x: 0, y: 3, w: 6, h: 5 }),
  chartWidget('ca_beh_type_pie', 'Behavior Type Distribution', 'توزيع أنواع السلوك', 'pie', 'behaviors', 'behaviorType', { x: 6, y: 3, w: 6, h: 5 }),
  chartWidget('ca_beh_type_bar', 'Behavior Count by Type', 'عدد السلوكيات حسب النوع', 'bar', 'behaviors', 'behaviorType', { x: 0, y: 8, w: 6, h: 5 }),
  chartWidget('ca_beh_points_bar', 'Behavior Points by Type', 'نقاط السلوك حسب النوع', 'bar', 'behaviors', 'behaviorType', { x: 6, y: 8, w: 6, h: 5 }, { aggregation: 'sum', valueField: 'points' }),
  chartWidget('ca_beh_student_bar', 'Behaviors by Student', 'السلوكيات حسب الطالب', 'bar', 'behaviors', 'studentId', { x: 0, y: 13, w: 6, h: 5 }),
  chartWidget('ca_beh_records_list', 'Behavior Records', 'سجلات السلوك', 'list', 'behaviors', '', { x: 0, y: 18, w: 12, h: 6 }, { listLimit: 100 }),

  // ═══ Participation (10 widgets) ═══
  countWidget('ca_par_cnt_total', 'classOverviewStats', 'totalParticipations', 'totalParticipations', 'Total Participations', 'إجمالي المشاركات', { x: 0, y: 0, w: 3, h: 3 }, 'participation'),
  countWidget('ca_par_cnt_points', 'classOverviewStats', 'participationPoints', 'participationPoints', 'Participation Points', 'نقاط المشاركة', { x: 3, y: 0, w: 3, h: 3 }, 'participation'),
  countWidget('ca_par_cnt_avg', 'classOverviewStats', 'avgParticipationPoints', 'avgParticipationPoints', 'Avg Participation Points', 'متوسط نقاط المشاركة', { x: 6, y: 0, w: 3, h: 3 }, 'participation'),
  countWidget('ca_par_cnt_positive', 'classOverviewStats', 'positiveParticipationCount', 'positiveParticipationCount', 'Positive Participations', 'المشاركات الإيجابية', { x: 9, y: 0, w: 3, h: 3 }, 'participation'),
  chartWidget('ca_par_type_donut', 'Participations by Type', 'المشاركات حسب النوع', 'donut', 'participations', 'participationType', { x: 0, y: 3, w: 6, h: 5 }),
  chartWidget('ca_par_type_pie', 'Participation Type Distribution', 'توزيع أنواع المشاركة', 'pie', 'participations', 'participationType', { x: 6, y: 3, w: 6, h: 5 }),
  chartWidget('ca_par_type_bar', 'Participation Count by Type', 'عدد المشاركات حسب النوع', 'bar', 'participations', 'participationType', { x: 0, y: 8, w: 6, h: 5 }),
  chartWidget('ca_par_points_bar', 'Participation Points by Type', 'نقاط المشاركة حسب النوع', 'bar', 'participations', 'participationType', { x: 6, y: 8, w: 6, h: 5 }, { aggregation: 'sum', valueField: 'points' }),
  chartWidget('ca_par_student_bar', 'Participations by Student', 'المشاركات حسب الطالب', 'bar', 'participations', 'studentId', { x: 0, y: 13, w: 6, h: 5 }),
  chartWidget('ca_par_records_list', 'Participation Records', 'سجلات المشاركة', 'list', 'participations', '', { x: 0, y: 18, w: 12, h: 6 }, { listLimit: 100 }),
];

export const CLASS_ANALYTICS_MAX_WIDGETS = CLASS_ANALYTICS_DEFAULT_WIDGETS.length;

// ── Category definitions ───────────────────────────────────────────────────
const CLASS_SOURCE_FILTER_MAP = {
  classOverviewStats: 'overview',
  attendance: 'attendance',
  penalties: 'penalties',
  behaviors: 'behavior',
  participations: 'participation',
};

export function inferClassWidgetCategory(widget) {
  if (widget?._category) return widget._category;
  if (widget?.chartType === 'count') return 'overview';
  return CLASS_SOURCE_FILTER_MAP[widget?.dataSource] || 'overview';
}

export const CLASS_WIDGET_CATEGORIES = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: 'layout_dashboard' },
  { id: 'attendance', label: 'Attendance', labelAr: 'الحضور', icon: 'clipboard_list' },
  { id: 'penalties', label: 'Penalties', labelAr: 'العقوبات', icon: 'alert_triangle' },
  { id: 'behavior', label: 'Behavior', labelAr: 'السلوك', icon: 'shield' },
  { id: 'participation', label: 'Participation', labelAr: 'المشاركة', icon: 'award' },
];

// ── Display title helper ───────────────────────────────────────────────────
export function getClassWidgetDisplayTitle(widget, t, lang = 'en') {
  const localized = lang === 'ar'
    ? (widget?.titleAr || widget?.titleEn || widget?.title)
    : (widget?.titleEn || widget?.titleAr || widget?.title);
  return localized || t?.('untitled') || 'Untitled';
}

// ── Drill-down list widget resolver ────────────────────────────────────────
export function resolveClassDrillDownListWidget(widget, dataPoint, t, lang) {
  const sliceLabel = dataPoint?.label || dataPoint?.lines?.[0] || '';
  if (!sliceLabel || !widget?.groupBy) return null;

  const listSource = widget.dataSource;
  const parentTitle = getClassWidgetDisplayTitle(widget, t, lang);
  const newTitle = `${parentTitle} - ${sliceLabel}`;

  return {
    id: `list-${Date.now()}`,
    title: newTitle,
    titleEn: newTitle,
    titleAr: newTitle,
    chartType: 'list',
    dataSource: listSource,
    groupBy: widget.groupBy,
    filterValue: sliceLabel,
    aggregation: 'list',
    dateRange: widget.dateRange,
    filters: widget.filters || [],
    comparisonMode: false,
    listLimit: 100,
    layout: {
      x: widget.layout?.x || 0,
      y: (widget.layout?.y || 0) + (widget.layout?.h || 4),
      w: widget.layout?.w || 6,
      h: 6,
    },
  };
}

// ── Widget help keys ───────────────────────────────────────────────────────
const CLASS_WIDGET_HELP_KEYS = {
  attendance: 'widget_help_attendance',
  penalties: 'widget_help_penalties',
  behaviors: 'widget_help_behaviors',
  participations: 'widget_help_participations',
};

export function getClassWidgetHelp(widget, t) {
  const key = CLASS_WIDGET_HELP_KEYS[widget?.dataSource];
  if (key && t) return t(key);
  if (widget?.chartType === 'count') return t?.('widget_help_count') || '';
  return t?.('widget_help_generic') || '';
}

/**
 * Build rawData for DashboardEngine from class-level metrics and raw data.
 *
 * @param {object} classMetrics - Computed metrics from useClassLevelMetrics
 * @param {object} rawData - Raw data arrays from useClassLevelMetrics { enrollments, attendance, penalties, behaviors, participations }
 * @param {object} lookupData - { programs, subjects, classes } for label resolution
 * @param {boolean} isRTL - RTL flag
 * @returns {object} rawData object for DashboardEngine
 */
export function buildClassPerformanceRawData(classMetrics, rawData = {}, lookupData = {}, isRTL = false) {
  const {
    enrollments = [],
    attendance = [],
    penalties = [],
    behaviors = [],
    participations = [],
  } = rawData || {};

  const { programs = [], subjects = [], classes = [] } = lookupData;

  // Build lookup maps
  const classMap = new Map();
  for (const c of classes) {
    const id = c.id || c.docId || c._id;
    if (id) classMap.set(String(id), c);
  }
  const subjectMap = new Map();
  for (const s of subjects) {
    const id = s.id || s.docId || s._id;
    if (id) subjectMap.set(String(id), s);
  }

  // Helpers
  const resolveSubjectLabel = (subjectId) => {
    if (!subjectId) return 'Unknown';
    const sub = subjectMap.get(String(subjectId));
    if (!sub) return String(subjectId);
    return isRTL ? (sub.nameAr || sub.name || sub.nameEn || String(subjectId))
                 : (sub.nameEn || sub.name || sub.nameAr || String(subjectId));
  };

  // Enrich attendance
  const enrichedAttendance = attendance.map(a => ({
    ...a,
    subjectName: resolveSubjectLabel(a.subjectId),
  }));

  // Enrich penalties
  const enrichedPenalties = penalties.map(p => ({
    ...p,
    subjectName: resolveSubjectLabel(p.subjectId),
  }));

  // Enrich behaviors
  const enrichedBehaviors = behaviors.map(b => ({
    ...b,
    subjectName: resolveSubjectLabel(b.subjectId),
  }));

  // Enrich participations
  const enrichedParticipations = participations.map(p => ({
    ...p,
    subjectName: resolveSubjectLabel(p.subjectId),
  }));

  // Calculate grade distribution from enrollments
  const classDistribution = enrollments.reduce((dist, e) => {
    const grade = e.grade || 'N/A';
    dist[grade] = (dist[grade] || 0) + 1;
    return dist;
  }, {});

  // Calculate attendance counts
  const getAttendanceStatus = (a) => {
    if (typeof a.status === 'string') return a.status.toLowerCase();
    if (a.status?.code) return a.status.code.toLowerCase();
    if (a.status?.nameEn) return a.status.nameEn.toLowerCase();
    if (a.statusId === 1) return 'present';
    if (a.statusId === 2) return 'absent';
    if (a.statusId === 3) return 'late';
    return 'unknown';
  };
  const presentCount = attendance.filter(a => getAttendanceStatus(a) === 'present').length;
  const absentCount = attendance.filter(a => getAttendanceStatus(a) === 'absent').length;
  const lateCount = attendance.filter(a => getAttendanceStatus(a) === 'late').length;

  // Calculate penalty points
  const penaltyPoints = penalties.reduce((s, p) => s + (Number(p.points) || 0), 0);
  const participationPoints = participations.reduce((s, p) => s + (Number(p.points) || 0), 0);
  const behaviorPoints = behaviors.reduce((s, b) => s + (Number(b.points) || 0), 0);
  const netScore = participationPoints - penaltyPoints;

  // Additional stats for per-category count widgets
  const avgPenaltyPoints = penalties.length > 0 ? parseFloat((penaltyPoints / penalties.length).toFixed(1)) : 0;
  const maxPenaltyPoints = penalties.length > 0 ? Math.max(...penalties.map(p => Number(p.points) || 0)) : 0;
  const avgParticipationPoints = participations.length > 0 ? parseFloat((participationPoints / participations.length).toFixed(1)) : 0;
  const positiveBehaviorCount = behaviors.filter(b => (Number(b.points) || 0) > 0).length;
  const negativeBehaviorCount = behaviors.filter(b => (Number(b.points) || 0) < 0).length;
  const positiveParticipationCount = participations.filter(p => (Number(p.points) || 0) > 0).length;

  // Build overview stats object for count widgets
  const classOverviewStats = {
    totalStudents: classMetrics?.totalStudents || enrollments.length || 0,
    totalEnrollments: enrollments.length || 0,
    averageAttendance: classMetrics?.averageAttendance || 0,
    averageGPA: classMetrics?.averageGPA || 0,
    totalAttendance: attendance.length,
    presentCount,
    absentCount,
    lateCount,
    totalPenalties: penalties.length,
    penaltyPoints,
    avgPenaltyPoints,
    maxPenaltyPoints,
    totalBehaviors: behaviors.length,
    behaviorPoints,
    positiveBehaviorCount,
    negativeBehaviorCount,
    totalParticipations: participations.length,
    participationPoints,
    avgParticipationPoints,
    positiveParticipationCount,
    netScore,
    gradeACount: classDistribution['A'] || classDistribution['a'] || 0,
    gradeBCount: classDistribution['B'] || classDistribution['b'] || 0,
    gradeCCount: classDistribution['C'] || classDistribution['c'] || 0,
    gradeDCount: classDistribution['D'] || classDistribution['d'] || 0,
    gradeFCount: classDistribution['F'] || classDistribution['f'] || 0,
  };

  return {
    classOverviewStats,
    attendance: enrichedAttendance,
    penalties: enrichedPenalties,
    behaviors: enrichedBehaviors,
    participations: enrichedParticipations,
    // Include lookup arrays for label resolution
    classes: classes || [],
    subjects: subjects || [],
    programs: programs || [],
  };
}

// Keep backward-compatible export name
export const CLASS_ANALYTICS_DEFAULTS = CLASS_ANALYTICS_DEFAULT_WIDGETS;
