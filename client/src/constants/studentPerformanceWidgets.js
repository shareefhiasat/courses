/**
 * Default widget layout for the student performance dashboard.
 * Persisted per-user in PostgreSQL (user_preferences.settings.dashboards.student_performance)
 */

export const STUDENT_PERFORMANCE_STORAGE_KEY = 'student_performance';
export const STUDENT_OVERVIEW_STORAGE_KEY = 'student_overview';

const COUNT_TITLE_AR = {
  sp_cnt_enrollments: 'إجمالي التسجيلات',
  sp_cnt_attendance: 'إجمالي سجلات الحضور',
  sp_cnt_present: 'سجلات الحضور (حاضر)',
  sp_cnt_absent: 'سجلات الغياب',
  sp_cnt_late: 'سجلات التأخير',
  sp_cnt_penalties: 'إجمالي العقوبات',
  sp_cnt_penalty_points: 'إجمالي نقاط العقوبات',
  sp_cnt_behaviors: 'إجمالي السلوكيات',
  sp_cnt_participations: 'إجمالي المشاركات',
  sp_cnt_participation_points: 'إجمالي نقاط المشاركات',
  sp_cnt_marks: 'إجمالي الدرجات',
  sp_cnt_gpa: 'المعدل التراكمي',
  sp_cnt_net_score: 'النتيجة الصافية',
  sp_cnt_courses: 'إجمالي المواد',
  sp_cnt_repeated: 'المواد المعادة',
};

const countWidget = (id, dataSource, countMetric, statKey, titleEn, titleAr, layout) => ({
  id,
  titleEn,
  titleAr: titleAr || COUNT_TITLE_AR[id] || titleEn,
  title: titleEn,
  chartType: 'count',
  dataSource,
  countMetric,
  statKey,
  groupBy: '',
  aggregation: 'count',
  dateRange: 'current',
  filters: [],
  layout,
});

const chartWidget = (id, titleEn, titleAr, chartType, dataSource, groupBy, layout, extra = {}) => ({
  id,
  titleEn,
  titleAr,
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

// ── Performance tab default widgets (20+) ──────────────────────────────────
export const STUDENT_PERFORMANCE_DEFAULT_WIDGETS = [
  // Count widgets — overview stats
  countWidget('sp_cnt_enrollments', 'spOverviewStats', 'totalEnrollments', 'totalEnrollments', 'Total Enrollments', 'إجمالي التسجيلات', { x: 0, y: 0, w: 3, h: 3 }),
  countWidget('sp_cnt_attendance', 'spOverviewStats', 'totalAttendance', 'totalAttendance', 'Total Attendance Records', 'إجمالي سجلات الحضور', { x: 3, y: 0, w: 3, h: 3 }),
  countWidget('sp_cnt_present', 'spOverviewStats', 'presentCount', 'presentCount', 'Present Count', 'سجلات الحضور (حاضر)', { x: 6, y: 0, w: 3, h: 3 }),
  countWidget('sp_cnt_absent', 'spOverviewStats', 'absentCount', 'absentCount', 'Absent Count', 'سجلات الغياب', { x: 9, y: 0, w: 3, h: 3 }),

  countWidget('sp_cnt_late', 'spOverviewStats', 'lateCount', 'lateCount', 'Late Count', 'سجلات التأخير', { x: 0, y: 3, w: 3, h: 3 }),
  countWidget('sp_cnt_penalties', 'spOverviewStats', 'totalPenalties', 'totalPenalties', 'Total Penalties', 'إجمالي العقوبات', { x: 3, y: 3, w: 3, h: 3 }),
  countWidget('sp_cnt_penalty_points', 'spOverviewStats', 'penaltyPoints', 'penaltyPoints', 'Penalty Points', 'إجمالي نقاط العقوبات', { x: 6, y: 3, w: 3, h: 3 }),
  countWidget('sp_cnt_behaviors', 'spOverviewStats', 'totalBehaviors', 'totalBehaviors', 'Total Behaviors', 'إجمالي السلوكيات', { x: 9, y: 3, w: 3, h: 3 }),

  countWidget('sp_cnt_participations', 'spOverviewStats', 'totalParticipations', 'totalParticipations', 'Total Participations', 'إجمالي المشاركات', { x: 0, y: 6, w: 3, h: 3 }),
  countWidget('sp_cnt_participation_points', 'spOverviewStats', 'participationPoints', 'participationPoints', 'Participation Points', 'إجمالي نقاط المشاركات', { x: 3, y: 6, w: 3, h: 3 }),
  countWidget('sp_cnt_net_score', 'spOverviewStats', 'netScore', 'netScore', 'Net Score', 'النتيجة الصافية', { x: 6, y: 6, w: 3, h: 3 }),
  countWidget('sp_cnt_gpa', 'spOverviewStats', 'gpa', 'gpa', 'GPA', 'المعدل التراكمي', { x: 9, y: 6, w: 3, h: 3 }),

  // Attendance charts
  chartWidget('sp_att_status_pie', 'Attendance by Status', 'الحضور حسب الحالة', 'pie', 'attendance', 'status', { x: 0, y: 9, w: 6, h: 5 }),
  chartWidget('sp_att_status_donut', 'Attendance by Status', 'الحضور حسب الحالة', 'donut', 'attendance', 'status', { x: 6, y: 9, w: 6, h: 5 }),
  chartWidget('sp_att_status_bar', 'Attendance Count by Status', 'عدد الحضور حسب الحالة', 'bar', 'attendance', 'status', { x: 0, y: 14, w: 6, h: 5 }),
  chartWidget('sp_att_timeline_line', 'Attendance Records per Day', 'سجلات الحضور يومياً', 'line', 'attendance', 'date', { x: 6, y: 14, w: 6, h: 5 }),
  chartWidget('sp_att_timeline_bar', 'Attendance Records per Day', 'سجلات الحضور يومياً', 'bar', 'attendance', 'date', { x: 0, y: 19, w: 12, h: 4 }),
  chartWidget('sp_att_class_bar', 'Attendance by Class', 'الحضور حسب الصف', 'bar', 'attendance', 'classId', { x: 0, y: 23, w: 6, h: 5 }),

  // Penalty charts
  chartWidget('sp_pen_type_pie', 'Penalties by Type', 'العقوبات حسب النوع', 'pie', 'penalties', 'penaltyType', { x: 6, y: 23, w: 6, h: 5 }),
  chartWidget('sp_pen_type_bar', 'Penalties by Type', 'العقوبات حسب النوع', 'bar', 'penalties', 'penaltyType', { x: 0, y: 28, w: 6, h: 5 }),
  chartWidget('sp_pen_timeline_line', 'Penalties per Day', 'العقوبات يومياً', 'line', 'penalties', 'date', { x: 6, y: 28, w: 6, h: 5 }),

  // Behavior charts
  chartWidget('sp_beh_type_pie', 'Behaviors by Type', 'السلوكيات حسب النوع', 'pie', 'behaviors', 'type', { x: 0, y: 33, w: 6, h: 5 }),
  chartWidget('sp_beh_type_bar', 'Behaviors by Type', 'السلوكيات حسب النوع', 'bar', 'behaviors', 'type', { x: 6, y: 33, w: 6, h: 5 }),
  chartWidget('sp_beh_subject_bar', 'Behaviors by Subject', 'السلوكيات حسب المادة', 'bar', 'behaviors', 'subjectId', { x: 0, y: 38, w: 6, h: 5 }),

  // Participation charts
  chartWidget('sp_par_type_pie', 'Participations by Type', 'المشاركات حسب النوع', 'pie', 'participations', 'type', { x: 6, y: 38, w: 6, h: 5 }),
  chartWidget('sp_par_type_bar', 'Participations by Type', 'المشاركات حسب النوع', 'bar', 'participations', 'type', { x: 0, y: 43, w: 6, h: 5 }),
  chartWidget('sp_par_subject_bar', 'Participations by Subject', 'المشاركات حسب المادة', 'bar', 'participations', 'subjectId', { x: 6, y: 43, w: 6, h: 5 }),
  chartWidget('sp_par_points_bar', 'Participation Points by Subject', 'نقاط المشاركة حسب المادة', 'bar', 'participations', 'subjectId', { x: 0, y: 48, w: 6, h: 5 }, { aggregation: 'sum', valueField: 'points' }),

  // Marks charts
  chartWidget('sp_mk_subject_bar', 'Marks by Subject', 'الدرجات حسب المادة', 'bar', 'studentMarks', 'subjectId', { x: 6, y: 48, w: 6, h: 5 }, { aggregation: 'average', valueField: 'totalMarks' }),
  chartWidget('sp_mk_subject_line', 'Marks Trend by Subject', 'اتجاه الدرجات حسب المادة', 'line', 'studentMarks', 'subjectId', { x: 0, y: 53, w: 6, h: 5 }, { aggregation: 'average', valueField: 'totalMarks' }),
  chartWidget('sp_mk_semester_bar', 'Average Marks by Semester', 'متوسط الدرجات حسب الفصل', 'bar', 'studentMarks', 'semester', { x: 6, y: 53, w: 6, h: 5 }, { aggregation: 'average', valueField: 'totalMarks' }),
  chartWidget('sp_mk_year_line', 'Marks Trend by Year', 'اتجاه الدرجات حسب السنة', 'line', 'studentMarks', 'year', { x: 0, y: 58, w: 6, h: 5 }, { aggregation: 'average', valueField: 'totalMarks' }),

  // List widgets
  chartWidget('sp_att_records_list', 'Attendance Records Detail', 'تفاصيل سجلات الحضور', 'list', 'attendance', '', { x: 0, y: 63, w: 12, h: 6 }, { listLimit: 200 }),
  chartWidget('sp_pen_records_list', 'Penalty Records Detail', 'تفاصيل سجلات العقوبات', 'list', 'penalties', '', { x: 0, y: 69, w: 6, h: 6 }, { listLimit: 100 }),
  chartWidget('sp_beh_records_list', 'Behavior Records Detail', 'تفاصيل سجلات السلوك', 'list', 'behaviors', '', { x: 6, y: 69, w: 6, h: 6 }, { listLimit: 100 }),
  chartWidget('sp_par_records_list', 'Participation Records Detail', 'تفاصيل سجلات المشاركة', 'list', 'participations', '', { x: 0, y: 75, w: 6, h: 6 }, { listLimit: 100 }),
  chartWidget('sp_mk_records_list', 'Marks Records Detail', 'تفاصيل سجلات الدرجات', 'list', 'studentMarks', '', { x: 6, y: 75, w: 6, h: 6 }, { listLimit: 100 }),
];

export const STUDENT_PERFORMANCE_MAX_WIDGETS = STUDENT_PERFORMANCE_DEFAULT_WIDGETS.length;

// ── Overview tab default widgets (20+) ─────────────────────────────────────
export const STUDENT_OVERVIEW_DEFAULT_WIDGETS = [
  countWidget('so_cnt_enrollments', 'spOverviewStats', 'totalEnrollments', 'totalEnrollments', 'Total Enrollments', 'إجمالي التسجيلات', { x: 0, y: 0, w: 3, h: 3 }),
  countWidget('so_cnt_courses', 'spOverviewStats', 'totalCourses', 'totalCourses', 'Total Courses', 'إجمالي المواد', { x: 3, y: 0, w: 3, h: 3 }),
  countWidget('so_cnt_repeated', 'spOverviewStats', 'repeatedCount', 'repeatedCount', 'Repeated Courses', 'المواد المعادة', { x: 6, y: 0, w: 3, h: 3 }),
  countWidget('so_cnt_gpa', 'spOverviewStats', 'gpa', 'gpa', 'GPA', 'المعدل التراكمي', { x: 9, y: 0, w: 3, h: 3 }),

  countWidget('so_cnt_attendance', 'spOverviewStats', 'totalAttendance', 'totalAttendance', 'Total Attendance', 'إجمالي الحضور', { x: 0, y: 3, w: 3, h: 3 }),
  countWidget('so_cnt_present', 'spOverviewStats', 'presentCount', 'presentCount', 'Present', 'حاضر', { x: 3, y: 3, w: 3, h: 3 }),
  countWidget('so_cnt_absent', 'spOverviewStats', 'absentCount', 'absentCount', 'Absent', 'غائب', { x: 6, y: 3, w: 3, h: 3 }),
  countWidget('so_cnt_late', 'spOverviewStats', 'lateCount', 'lateCount', 'Late', 'متأخر', { x: 9, y: 3, w: 3, h: 3 }),

  countWidget('so_cnt_penalties', 'spOverviewStats', 'totalPenalties', 'totalPenalties', 'Penalties', 'العقوبات', { x: 0, y: 6, w: 3, h: 3 }),
  countWidget('so_cnt_participations', 'spOverviewStats', 'totalParticipations', 'totalParticipations', 'Participations', 'المشاركات', { x: 3, y: 6, w: 3, h: 3 }),
  countWidget('so_cnt_behaviors', 'spOverviewStats', 'totalBehaviors', 'totalBehaviors', 'Behaviors', 'السلوكيات', { x: 6, y: 6, w: 3, h: 3 }),
  countWidget('so_cnt_net_score', 'spOverviewStats', 'netScore', 'netScore', 'Net Score', 'النتيجة الصافية', { x: 9, y: 6, w: 3, h: 3 }),

  // Charts
  chartWidget('so_att_status_pie', 'Attendance Distribution', 'توزيع الحضور', 'pie', 'attendance', 'status', { x: 0, y: 9, w: 6, h: 5 }),
  chartWidget('so_att_status_bar', 'Attendance by Status', 'الحضور حسب الحالة', 'bar', 'attendance', 'status', { x: 6, y: 9, w: 6, h: 5 }),
  chartWidget('so_att_timeline_line', 'Attendance Timeline', 'الخط الزمني للحضور', 'line', 'attendance', 'date', { x: 0, y: 14, w: 12, h: 4 }),
  chartWidget('so_mk_subject_bar', 'Marks by Subject', 'الدرجات حسب المادة', 'bar', 'studentMarks', 'subjectId', { x: 0, y: 18, w: 6, h: 5 }, { aggregation: 'average', valueField: 'totalMarks' }),
  chartWidget('so_mk_semester_bar', 'GPA by Semester', 'المعدل حسب الفصل', 'bar', 'studentMarks', 'semester', { x: 6, y: 18, w: 6, h: 5 }, { aggregation: 'average', valueField: 'totalMarks' }),
  chartWidget('so_mk_year_line', 'Marks Trend by Year', 'اتجاه الدرجات حسب السنة', 'line', 'studentMarks', 'year', { x: 0, y: 23, w: 6, h: 5 }, { aggregation: 'average', valueField: 'totalMarks' }),
  chartWidget('so_enroll_semester_bar', 'Enrollments by Semester', 'التسجيلات حسب الفصل', 'bar', 'enrollments', 'semester', { x: 6, y: 23, w: 6, h: 5 }),
  chartWidget('so_enroll_year_bar', 'Enrollments by Year', 'التسجيلات حسب السنة', 'bar', 'enrollments', 'academicYear', { x: 0, y: 28, w: 6, h: 5 }),
  chartWidget('so_pen_type_pie', 'Penalties by Type', 'العقوبات حسب النوع', 'pie', 'penalties', 'penaltyType', { x: 6, y: 28, w: 6, h: 5 }),
  chartWidget('so_par_type_donut', 'Participations by Type', 'المشاركات حسب النوع', 'donut', 'participations', 'type', { x: 0, y: 33, w: 6, h: 5 }),
  chartWidget('so_beh_type_pie', 'Behaviors by Type', 'السلوكيات حسب النوع', 'pie', 'behaviors', 'type', { x: 6, y: 33, w: 6, h: 5 }),

  // List widgets
  chartWidget('so_mk_records_list', 'Marks Detail', 'تفاصيل الدرجات', 'list', 'studentMarks', '', { x: 0, y: 38, w: 12, h: 6 }, { listLimit: 100 }),
  chartWidget('so_att_records_list', 'Attendance Detail', 'تفاصيل الحضور', 'list', 'attendance', '', { x: 0, y: 44, w: 12, h: 6 }, { listLimit: 100 }),
];

export const STUDENT_OVERVIEW_MAX_WIDGETS = STUDENT_OVERVIEW_DEFAULT_WIDGETS.length;

// ── Attendance-only widgets (for separate Attendance Analytics section) ─────
export const STUDENT_ATTENDANCE_STORAGE_KEY = 'student_attendance';
export const STUDENT_ATTENDANCE_DEFAULT_WIDGETS = [
  countWidget('sa_cnt_attendance', 'spOverviewStats', 'totalAttendance', 'totalAttendance', 'Total Attendance', 'إجمالي الحضور', { x: 0, y: 0, w: 3, h: 3 }),
  countWidget('sa_cnt_present', 'spOverviewStats', 'presentCount', 'presentCount', 'Present', 'حاضر', { x: 3, y: 0, w: 3, h: 3 }),
  countWidget('sa_cnt_absent', 'spOverviewStats', 'absentCount', 'absentCount', 'Absent', 'غائب', { x: 6, y: 0, w: 3, h: 3 }),
  countWidget('sa_cnt_late', 'spOverviewStats', 'lateCount', 'lateCount', 'Late', 'متأخر', { x: 9, y: 0, w: 3, h: 3 }),

  chartWidget('sa_att_status_pie', 'Attendance Distribution', 'توزيع الحضور', 'pie', 'attendance', 'status', { x: 0, y: 3, w: 6, h: 5 }),
  chartWidget('sa_att_status_donut', 'Attendance Distribution', 'توزيع الحضور', 'donut', 'attendance', 'status', { x: 6, y: 3, w: 6, h: 5 }),
  chartWidget('sa_att_status_bar', 'Attendance Count by Status', 'عدد الحضور حسب الحالة', 'bar', 'attendance', 'status', { x: 0, y: 8, w: 6, h: 5 }),
  chartWidget('sa_att_timeline_line', 'Attendance Records per Day', 'سجلات الحضور يومياً', 'line', 'attendance', 'date', { x: 6, y: 8, w: 6, h: 5 }),
  chartWidget('sa_att_timeline_bar', 'Attendance Records per Day', 'سجلات الحضور يومياً', 'bar', 'attendance', 'date', { x: 0, y: 13, w: 12, h: 4 }),
  chartWidget('sa_att_class_bar', 'Attendance by Class', 'الحضور حسب الصف', 'bar', 'attendance', 'classId', { x: 0, y: 17, w: 12, h: 5 }),
  chartWidget('sa_att_records_list', 'Attendance Records Detail', 'تفاصيل سجلات الحضور', 'list', 'attendance', '', { x: 0, y: 22, w: 12, h: 6 }, { listLimit: 200 }),
];
export const STUDENT_ATTENDANCE_MAX_WIDGETS = STUDENT_ATTENDANCE_DEFAULT_WIDGETS.length;

// ── Category definitions ───────────────────────────────────────────────────
const SOURCE_FILTER_MAP = {
  spOverviewStats: 'overview',
  attendance: 'attendance',
  penalties: 'penalties',
  behaviors: 'behaviors',
  participations: 'participations',
  studentMarks: 'marks',
  enrollments: 'enrollments',
};

export function inferStudentWidgetCategory(widget) {
  if (widget?.chartType === 'count') return 'overview';
  return SOURCE_FILTER_MAP[widget?.dataSource] || 'overview';
}

export const STUDENT_WIDGET_CATEGORIES = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: 'layout_dashboard' },
  { id: 'attendance', label: 'Attendance', labelAr: 'الحضور', icon: 'clipboard_list' },
  { id: 'marks', label: 'Marks & Grades', labelAr: 'الدرجات والتقديرات', icon: 'graduation_cap' },
  { id: 'penalties', label: 'Penalties', labelAr: 'العقوبات', icon: 'alert_triangle' },
  { id: 'behaviors', label: 'Behavior Records', labelAr: 'سجلات السلوك', icon: 'user' },
  { id: 'participations', label: 'Participation', labelAr: 'المشاركة', icon: 'award' },
  { id: 'enrollments', label: 'Enrollments', labelAr: 'التسجيلات', icon: 'book_open' },
];

// ── Display title helper ───────────────────────────────────────────────────
export function getStudentWidgetDisplayTitle(widget, t, lang = 'en') {
  const titleFromKey = widget?.titleKey ? t(widget.titleKey) : null;
  const localized = lang === 'ar'
    ? (widget?.titleAr || widget?.titleEn || widget?.title)
    : (widget?.titleEn || widget?.titleAr || widget?.title);
  return titleFromKey || localized || t?.('untitled') || 'Untitled';
}

// ── Drill-down list widget resolver ────────────────────────────────────────
export function resolveStudentDrillDownListWidget(widget, dataPoint, t, lang) {
  const sliceLabel = dataPoint?.label || dataPoint?.lines?.[0] || '';
  if (!sliceLabel || !widget?.groupBy) return null;

  const listSource = widget.dataSource;

  const parentTitle = getStudentWidgetDisplayTitle(widget, t, lang);
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
const WIDGET_HELP_KEYS = {
  attendance: 'widget_help_attendance',
  penalties: 'widget_help_penalties',
  behaviors: 'widget_help_behaviors',
  participations: 'widget_help_participations',
  studentMarks: 'widget_help_student_marks',
  enrollments: 'widget_help_enrollments',
};

export function getStudentWidgetHelp(widget, t) {
  const key = WIDGET_HELP_KEYS[widget?.dataSource];
  if (key && t) return t(key);
  if (widget?.chartType === 'count') return t?.('widget_help_count') || '';
  return t?.('widget_help_generic') || '';
}

/**
 * Build rawData for DashboardEngine from useStudentDashboardData output.
 *
 * @param {object} dashData - The object returned by useStudentDashboardData
 * @param {object} filters - { programs, subjects, classes } for label resolution
 * @param {boolean} isRTL - RTL flag for localized labels
 * @returns {object} rawData object for DashboardEngine
 */
export function buildStudentPerformanceRawData(dashData, lookupData = {}, isRTL = false) {
  const {
    enrollments = [],
    attendance = [],
    penalties = [],
    participations = [],
    behaviors = [],
    marks = [],
    statsData = {},
    semesters = [],
  } = dashData || {};

  const { programs = [], subjects = [], classes = [] } = lookupData;

  // Build lookup maps for label resolution
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
  const programMap = new Map();
  for (const p of programs) {
    const id = p.id || p.docId || p._id;
    if (id) programMap.set(String(id), p);
  }

  // Build enrollment lookup: classId → semester/year
  // Use class term/year from lookupData when enrollment doesn't have semester/year
  const classSemesterMap = new Map();
  for (const e of enrollments) {
    if (e.classId) {
      const cls = classMap.get(String(e.classId));
      classSemesterMap.set(String(e.classId), {
        semester: e.semester || cls?.term || 'Unknown',
        year: e.academicYear || e.year || cls?.year || new Date().getFullYear(),
        academicYear: e.academicYear || e.year || cls?.year,
        subjectId: e.subjectId,
        programId: e.programId,
      });
    }
  }

  // Helper to resolve class label
  const resolveClassLabel = (classId) => {
    if (!classId) return 'Unknown';
    const cls = classMap.get(String(classId));
    if (!cls) return String(classId);
    return isRTL ? (cls.nameAr || cls.name || cls.nameEn || String(classId))
                 : (cls.nameEn || cls.name || cls.nameAr || String(classId));
  };

  // Helper to resolve subject label
  const resolveSubjectLabel = (subjectId) => {
    if (!subjectId) return 'Unknown';
    const sub = subjectMap.get(String(subjectId));
    if (!sub) return String(subjectId);
    return isRTL ? (sub.nameAr || sub.name || sub.nameEn || String(subjectId))
                 : (sub.nameEn || sub.name || sub.nameAr || String(subjectId));
  };

  // Helper to resolve program label
  const resolveProgramLabel = (programId) => {
    if (!programId) return 'Unknown';
    const prog = programMap.get(String(programId));
    if (!prog) return String(programId);
    return isRTL ? (prog.nameAr || prog.name || prog.nameEn || String(programId))
                 : (prog.nameEn || prog.name || prog.nameAr || String(programId));
  };

  // Helper to extract date string (YYYY-MM-DD) from createdAt or date field
  const toDateStr = (item) => {
    const d = item.date || item.createdAt;
    if (!d) return null;
    try { return new Date(d).toISOString().split('T')[0]; } catch { return String(d).substring(0, 10); }
  };

  // Enrich attendance with semester/year/className/subjectName
  const enrichedAttendance = attendance.map(a => {
    const sem = classSemesterMap.get(String(a.classId)) || {};
    return {
      ...a,
      date: toDateStr(a),
      semester: a.semester || sem.semester || 'Unknown',
      year: a.year || sem.year || sem.academicYear || new Date().getFullYear(),
      academicYear: a.academicYear || sem.academicYear || sem.year,
      className: resolveClassLabel(a.classId),
      subjectName: resolveSubjectLabel(a.subjectId || sem.subjectId),
      programName: resolveProgramLabel(a.programId || sem.programId),
    };
  });

  // Helper to resolve type name from object or string
  const resolveTypeName = (typeVal, fallback = 'Unknown') => {
    if (!typeVal) return fallback;
    if (typeof typeVal === 'string') return typeVal;
    return typeVal.nameEn || typeVal.nameAr || typeVal.code || fallback;
  };

  // Enrich penalties
  const enrichedPenalties = penalties.map(p => {
    const sem = classSemesterMap.get(String(p.classId)) || {};
    return {
      ...p,
      date: toDateStr(p),
      penaltyType: resolveTypeName(p.penaltyType),
      studentId: p.userId,
      semester: p.semester || sem.semester || 'Unknown',
      year: p.year || sem.year || sem.academicYear || new Date().getFullYear(),
      className: resolveClassLabel(p.classId),
      subjectName: resolveSubjectLabel(p.subjectId || sem.subjectId),
      programName: resolveProgramLabel(p.programId || sem.programId),
    };
  });

  // Enrich behaviors
  const enrichedBehaviors = behaviors.map(b => {
    const sem = classSemesterMap.get(String(b.classId)) || {};
    return {
      ...b,
      date: toDateStr(b),
      type: resolveTypeName(b.behaviorType, b.type),
      studentId: b.userId,
      semester: b.semester || sem.semester || 'Unknown',
      year: b.year || sem.year || sem.academicYear || new Date().getFullYear(),
      className: resolveClassLabel(b.classId),
      subjectName: resolveSubjectLabel(b.subjectId || sem.subjectId),
      programName: resolveProgramLabel(b.programId || sem.programId),
    };
  });

  // Enrich participations
  const enrichedParticipations = participations.map(p => {
    const sem = classSemesterMap.get(String(p.classId)) || {};
    return {
      ...p,
      date: toDateStr(p),
      type: resolveTypeName(p.participationType, p.type),
      studentId: p.userId,
      semester: p.semester || sem.semester || 'Unknown',
      year: p.year || sem.year || sem.academicYear || new Date().getFullYear(),
      className: resolveClassLabel(p.classId),
      subjectName: resolveSubjectLabel(p.subjectId || sem.subjectId),
      programName: resolveProgramLabel(p.programId || sem.programId),
    };
  });

  // Enrich marks (studentMarks) — map marks → studentMarks for data source compatibility
  const enrichedMarks = marks.map(m => {
    const sem = classSemesterMap.get(String(m.classId)) || {};
    return {
      ...m,
      studentId: m.userId || m.studentId,
      semester: m.semester || sem.semester || 'Unknown',
      year: m.year || sem.year || sem.academicYear || new Date().getFullYear(),
      academicYear: m.academicYear || sem.academicYear || sem.year,
      className: resolveClassLabel(m.classId),
      subjectName: resolveSubjectLabel(m.subjectId || sem.subjectId),
      programName: resolveProgramLabel(m.programId || sem.programId),
    };
  });

  // Enrich enrollments
  const enrichedEnrollments = enrollments.map(e => {
    const sem = classSemesterMap.get(String(e.classId)) || {};
    return {
      ...e,
      semester: e.semester || sem.semester || 'Unknown',
      year: e.academicYear || e.year || sem.year || new Date().getFullYear(),
      academicYear: e.academicYear || e.year || sem.academicYear,
      className: resolveClassLabel(e.classId),
      subjectName: resolveSubjectLabel(e.subjectId),
      programName: resolveProgramLabel(e.programId),
    };
  });

  // Count repeated courses
  const repeatedCount = enrollments.filter(e => e.isRepeated || e.repeated).length;
  const totalCourses = new Set(enrollments.map(e => e.subjectId).filter(Boolean)).size;

  // Build overview stats object for count widgets
  const spOverviewStats = {
    totalEnrollments: enrollments.length,
    totalCourses,
    repeatedCount,
    totalAttendance: attendance.length,
    presentCount: statsData.presentCount || 0,
    absentCount: statsData.absentCount || 0,
    lateCount: statsData.lateCount || 0,
    totalPenalties: penalties.length,
    penaltyPoints: statsData.penaltyPoints || 0,
    totalBehaviors: behaviors.length,
    totalParticipations: participations.length,
    participationPoints: statsData.participationPoints || 0,
    netScore: statsData.netScore || 0,
    gpa: statsData.gpa || 0,
    totalMarks: marks.length,
  };

  return {
    spOverviewStats,
    attendance: enrichedAttendance,
    penalties: enrichedPenalties,
    behaviors: enrichedBehaviors,
    participations: enrichedParticipations,
    studentMarks: enrichedMarks,
    enrollments: enrichedEnrollments,
    // Include lookup arrays for label resolution in processWidgetData
    classes: classes || [],
    subjects: subjects || [],
    programs: programs || [],
  };
}
