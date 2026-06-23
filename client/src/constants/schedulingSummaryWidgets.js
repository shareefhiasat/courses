/**
 * Default widget layout for the scheduling summary dashboard.
 * Persisted per-user in PostgreSQL (user_preferences.settings.dashboards.scheduling_summary)
 */

export const SCHEDULING_SUMMARY_STORAGE_KEY = 'scheduling_summary';

const COUNT_TITLE_AR = {
  sched_cnt_programs: 'إجمالي البرامج المتاحة للجدولة',
  sched_cnt_subjects: 'إجمالي المواد المتاحة للجدولة',
  sched_cnt_classes: 'إجمالي الصفوف المجدولة حسب الفلاتر الحالية',
  sched_cnt_sessions: 'إجمالي الجلسات في الفترة الحالية',
  sched_cnt_scheduled: 'عدد الجلسات المجدولة',
  sched_cnt_in_progress: 'عدد الجلسات الجارية',
  sched_cnt_completed: 'عدد الجلسات المكتملة',
  sched_cnt_cancelled: 'عدد الجلسات الملغاة',
  sched_cnt_rooms_used: 'القاعات المستخدمة بواسطة الجلسات المجدولة',
  sched_cnt_instructors: 'المدرسون المعينون على جلسات',
  sched_cnt_this_week: 'الجلسات المجدولة هذا الأسبوع',
  sched_cnt_today: 'جلسات اليوم',
  sched_cnt_holidays: 'العطل القادمة في الفترة الحالية',
  sched_att_cnt_total: 'إجمالي سجلات الحضور في الفترة',
  sched_att_cnt_class: 'سجلات حضور الصف',
  sched_att_cnt_daily: 'سجلات الحضور اليومي',
  sched_att_cnt_present: 'سجلات الحضور (حاضر)',
  sched_att_cnt_absent: 'سجلات الغياب',
  sched_att_cnt_late: 'سجلات التأخير',
  sched_att_cnt_students: 'طلاب فريدون مسجل حضورهم',
  sched_att_cnt_classes: 'صفوف فريدة بسجلات حضور',
};

const attChart = (id, titleEn, titleAr, chartType, dataSource, groupBy, layout, extra = {}) => ({
  id,
  titleEn,
  titleAr,
  chartType,
  dataSource,
  groupBy,
  aggregation: 'sum',
  valueField: extra.valueField || 'recordCount',
  dateRange: 'current',
  filters: [],
  listDetailSource: 'schedulingAttendanceRecords',
  ...extra,
  layout,
});

const countWidget = (id, dataSource, countMetric, statKey, titleKey, layout) => ({
  id,
  titleEn: titleKey,
  titleAr: COUNT_TITLE_AR[id] || titleKey,
  title: titleKey,
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

export const SCHEDULING_SUMMARY_DEFAULT_WIDGETS = [
  countWidget('sched_cnt_programs', 'schedulingPrograms', 'totalPrograms', 'totalPrograms', 'Total programs available for scheduling', { x: 0, y: 0, w: 3, h: 3 }),
  countWidget('sched_cnt_subjects', 'schedulingSubjects', 'totalSubjects', 'totalSubjects', 'Total subjects available for scheduling', { x: 3, y: 0, w: 3, h: 3 }),
  countWidget('sched_cnt_classes', 'schedulingClasses', 'totalClasses', 'totalClasses', 'Total scheduled classes in current filters', { x: 6, y: 0, w: 3, h: 3 }),
  countWidget('sched_cnt_sessions', 'schedulingSessions', 'totalSessions', 'totalSessions', 'Total sessions in current period', { x: 9, y: 0, w: 3, h: 3 }),

  countWidget('sched_cnt_scheduled', 'schedulingSessions', 'scheduledCount', 'scheduledCount', 'Scheduled sessions count', { x: 0, y: 3, w: 3, h: 3 }),
  countWidget('sched_cnt_in_progress', 'schedulingSessions', 'inProgressCount', 'inProgressCount', 'In-progress sessions count', { x: 3, y: 3, w: 3, h: 3 }),
  countWidget('sched_cnt_completed', 'schedulingSessions', 'completedCount', 'completedCount', 'Completed sessions count', { x: 6, y: 3, w: 3, h: 3 }),
  countWidget('sched_cnt_cancelled', 'schedulingSessions', 'cancelledCount', 'cancelledCount', 'Cancelled sessions count', { x: 9, y: 3, w: 3, h: 3 }),

  countWidget('sched_cnt_rooms_used', 'schedulingRooms', 'uniqueClassrooms', 'uniqueClassrooms', 'Rooms used by scheduled sessions', { x: 0, y: 6, w: 3, h: 3 }),
  countWidget('sched_cnt_instructors', 'schedulingTeachers', 'uniqueInstructors', 'uniqueInstructors', 'Instructors assigned to sessions', { x: 3, y: 6, w: 3, h: 3 }),
  countWidget('sched_cnt_this_week', 'schedulingSessions', 'thisWeekSessions', 'thisWeekSessions', 'Sessions scheduled this week', { x: 6, y: 6, w: 3, h: 3 }),
  countWidget('sched_cnt_today', 'schedulingOverviewStats', 'todaySessionCount', 'todaySessionCount', "Today's Sessions", { x: 9, y: 6, w: 3, h: 3 }),

  {
    id: 'sched_session_timeline_all',
    titleEn: 'sessions per day in current filters',
    titleAr: 'عدد الجلسات يومياً حسب الفلاتر الحالية',
    chartType: 'line',
    dataSource: 'schedulingSessionTimeline',
    groupBy: 'date',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 9, w: 12, h: 4 },
  },
  {
    id: 'sched_session_timeline_bar',
    titleEn: 'sessions per day in current filters',
    titleAr: 'عدد الجلسات يومياً حسب الفلاتر الحالية',
    chartType: 'bar',
    dataSource: 'schedulingSessionTimeline',
    groupBy: 'date',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 13, w: 12, h: 5 },
  },
  {
    id: 'sched_status_donut',
    titleEn: 'sessions by status (scheduled, in progress, completed, cancelled)',
    titleAr: 'الجلسات حسب الحالة (مجدولة، جارية، مكتملة، ملغاة)',
    chartType: 'donut',
    dataSource: 'schedulingSessions',
    groupBy: 'status',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 18, w: 6, h: 5 },
  },
  {
    id: 'sched_status_bar',
    titleEn: 'session count by status',
    titleAr: 'عدد الجلسات حسب الحالة',
    chartType: 'bar',
    dataSource: 'schedulingSessions',
    groupBy: 'status',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 18, w: 6, h: 5 },
  },
  {
    id: 'sched_subject_pie',
    titleEn: 'scheduled sessions by subject',
    titleAr: 'الجلسات المجدولة حسب المادة',
    chartType: 'pie',
    dataSource: 'schedulingSessions',
    groupBy: 'subjectName',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 23, w: 6, h: 5 },
  },
  {
    id: 'sched_teacher_sessions_bar',
    titleEn: 'instructor workload by session count',
    titleAr: 'عبء المدرس حسب عدد الجلسات',
    chartType: 'bar',
    dataSource: 'schedulingTeachers',
    groupBy: 'instructorName',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 23, w: 6, h: 5 },
  },
  {
    id: 'sched_teacher_hours_bar',
    titleEn: 'instructor workload by teaching hours',
    titleAr: 'عبء المدرس حسب ساعات التدريس',
    chartType: 'bar',
    dataSource: 'schedulingTeachers',
    groupBy: 'instructorName',
    aggregation: 'sum',
    valueField: 'teachingHours',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 28, w: 6, h: 5 },
  },
  {
    id: 'sched_teacher_capacity_bar',
    titleEn: 'instructor assigned workload versus capacity utilization percent',
    titleAr: 'عبء المدرس المعين مقابل نسبة استغلال السعة',
    chartType: 'bar',
    dataSource: 'schedulingInstructorWorkload',
    groupBy: 'instructorName',
    aggregation: 'sum',
    valueField: 'utilizationPct',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 28, w: 6, h: 5 },
  },
  {
    id: 'sched_course_load_bar',
    titleEn: 'class session load by program · subject · class',
    titleAr: 'حمل جلسات الصف حسب البرنامج · المادة · الصف',
    chartType: 'bar',
    dataSource: 'schedulingCourses',
    groupBy: 'courseLabel',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 33, w: 12, h: 5 },
  },
  {
    id: 'sched_class_coverage_pie',
    titleEn: 'class coverage (with sessions vs without)',
    titleAr: 'تغطية الصفوف (بجلسات مقابل بدون جلسات)',
    chartType: 'pie',
    dataSource: 'schedulingClassCoverage',
    groupBy: 'coverageType',
    aggregation: 'sum',
    valueField: 'classCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 38, w: 6, h: 5 },
  },
  {
    id: 'sched_holiday_overlap_donut',
    titleEn: 'holiday impact (sessions affected by holidays versus unaffected)',
    titleAr: 'تأثير العطل (جلسات متأثرة بالعطل مقابل غير متأثرة)',
    chartType: 'donut',
    dataSource: 'schedulingHolidayOverlap',
    groupBy: 'impactType',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 38, w: 6, h: 5 },
  },
  {
    id: 'sched_recurrence_donut',
    titleEn: 'recurring sessions versus one-off sessions',
    titleAr: 'الجلسات المتكررة مقابل الجلسات لمرة واحدة',
    chartType: 'donut',
    dataSource: 'schedulingRecurrenceBreakdown',
    groupBy: 'recurrenceType',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 43, w: 6, h: 5 },
  },
  {
    id: 'sched_breaks_donut',
    titleEn: 'break sessions by break type',
    titleAr: 'جلسات الاستراحة حسب نوع الاستراحة',
    chartType: 'donut',
    dataSource: 'schedulingBreaks',
    groupBy: 'breakType',
    aggregation: 'count',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 43, w: 6, h: 5 },
  },
  {
    id: 'sched_calendar_bar',
    titleEn: "today's schedule entries by type",
    titleAr: 'مدخلات جدول اليوم حسب النوع',
    chartType: 'bar',
    dataSource: 'schedulingCalendar',
    groupBy: 'eventType',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 48, w: 6, h: 5 },
  },
  {
    id: 'sched_room_availability_donut',
    titleEn: 'room availability status from scheduling data',
    titleAr: 'حالة توفر القاعات من بيانات الجدولة',
    chartType: 'donut',
    dataSource: 'schedulingRoomAvailability',
    groupBy: 'status',
    aggregation: 'sum',
    valueField: 'slotCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 48, w: 6, h: 5 },
  },
  {
    id: 'sched_teacher_effort_list',
    titleEn: 'instructor effort details with sessions, hours, subjects, and classes',
    titleAr: 'تفاصيل جهد المدرسين مع الجلسات والساعات والمواد والصفوف',
    chartType: 'list',
    dataSource: 'schedulingTeachers',
    groupBy: 'instructorName',
    aggregation: 'count',
    dateRange: 'current',
    listLimit: 100,
    filters: [],
    layout: { x: 0, y: 53, w: 6, h: 6 },
  },
  {
    id: 'sched_workload_capacity_list',
    titleEn: 'instructor assigned hours, capacity hours, and utilization percent',
    titleAr: 'ساعات المدرس المعينة وساعات السعة ونسبة الاستغلال',
    chartType: 'list',
    dataSource: 'schedulingInstructorWorkload',
    groupBy: 'instructorName',
    aggregation: 'count',
    dateRange: 'current',
    listLimit: 100,
    filters: [],
    layout: { x: 6, y: 53, w: 6, h: 6 },
  },
  {
    id: 'sched_course_load_list',
    titleEn: 'class session load by program, subject, class, location',
    titleAr: 'حمل جلسات الصف حسب البرنامج والمادة والصف والموقع',
    chartType: 'list',
    dataSource: 'schedulingCourses',
    groupBy: 'courseLabel',
    aggregation: 'count',
    dateRange: 'current',
    listLimit: 100,
    filters: [],
    layout: { x: 0, y: 59, w: 12, h: 6 },
  },

  countWidget('sched_att_cnt_total', 'schedulingAttendanceOverview', 'totalRecords', 'totalRecords', 'Total attendance records in period', { x: 0, y: 65, w: 3, h: 3 }),
  countWidget('sched_att_cnt_class', 'schedulingAttendanceOverview', 'classRecords', 'classRecords', 'Class attendance records', { x: 3, y: 65, w: 3, h: 3 }),
  countWidget('sched_att_cnt_daily', 'schedulingAttendanceOverview', 'dailyRecords', 'dailyRecords', 'Daily attendance records', { x: 6, y: 65, w: 3, h: 3 }),
  countWidget('sched_att_cnt_present', 'schedulingAttendanceOverview', 'presentCount', 'presentCount', 'Present attendance records', { x: 9, y: 65, w: 3, h: 3 }),
  countWidget('sched_att_cnt_absent', 'schedulingAttendanceOverview', 'absentCount', 'absentCount', 'Absent attendance records', { x: 0, y: 68, w: 3, h: 3 }),
  countWidget('sched_att_cnt_late', 'schedulingAttendanceOverview', 'lateCount', 'lateCount', 'Late attendance records', { x: 3, y: 68, w: 3, h: 3 }),
  countWidget('sched_att_cnt_students', 'schedulingAttendanceOverview', 'uniqueStudents', 'uniqueStudents', 'Unique students with attendance', { x: 6, y: 68, w: 3, h: 3 }),
  countWidget('sched_att_cnt_classes', 'schedulingAttendanceOverview', 'uniqueClasses', 'uniqueClasses', 'Unique classes with attendance', { x: 9, y: 68, w: 3, h: 3 }),

  attChart('sched_att_type_donut', 'class vs daily attendance volume', 'حضور الصف مقابل الحضور اليومي', 'donut', 'schedulingAttendanceByType', 'attendanceTypeLabel', { x: 0, y: 71, w: 6, h: 5 }),
  attChart('sched_att_type_bar', 'class vs daily attendance volume', 'حضور الصف مقابل الحضور اليومي', 'bar', 'schedulingAttendanceByType', 'attendanceTypeLabel', { x: 6, y: 71, w: 6, h: 5 }),

  attChart('sched_att_class_status_pie', 'class attendance by status', 'حضور الصف حسب الحالة', 'pie', 'schedulingClassAttendanceByStatus', 'status', { x: 0, y: 76, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_daily_status_pie', 'daily attendance by status', 'الحضور اليومي حسب الحالة', 'pie', 'schedulingDailyAttendanceByStatus', 'status', { x: 6, y: 76, w: 6, h: 5 }, { drillScope: 'daily' }),

  attChart('sched_att_class_status_bar', 'class attendance by status', 'حضور الصف حسب الحالة', 'bar', 'schedulingClassAttendanceByStatus', 'status', { x: 0, y: 81, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_daily_status_bar', 'daily attendance by status', 'الحضور اليومي حسب الحالة', 'bar', 'schedulingDailyAttendanceByStatus', 'status', { x: 6, y: 81, w: 6, h: 5 }, { drillScope: 'daily' }),

  attChart('sched_att_status_donut', 'all attendance by status', 'كل الحضور حسب الحالة', 'donut', 'schedulingAttendanceByStatus', 'status', { x: 0, y: 86, w: 6, h: 5 }),
  attChart('sched_att_status_pie', 'all attendance by status', 'كل الحضور حسب الحالة', 'pie', 'schedulingAttendanceByStatus', 'status', { x: 6, y: 86, w: 6, h: 5 }),

  attChart('sched_att_class_program_bar', 'class attendance by program', 'حضور الصف حسب البرنامج', 'bar', 'schedulingClassAttendanceByProgram', 'programName', { x: 0, y: 91, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_daily_program_bar', 'daily attendance by program', 'الحضور اليومي حسب البرنامج', 'bar', 'schedulingDailyAttendanceByProgram', 'programName', { x: 6, y: 91, w: 6, h: 5 }, { drillScope: 'daily' }),

  attChart('sched_att_instructor_bar', 'class attendance by instructor', 'حضور الصف حسب المدرس', 'bar', 'schedulingAttendanceByInstructor', 'instructorName', { x: 0, y: 96, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_class_bar', 'class attendance by class', 'حضور الصف حسب الصف', 'bar', 'schedulingClassAttendanceByClass', 'className', { x: 6, y: 96, w: 6, h: 5 }, { drillScope: 'class' }),

  attChart('sched_att_class_timeline_line', 'class attendance per day', 'حضور الصف يومياً', 'line', 'schedulingClassAttendanceTimeline', 'date', { x: 0, y: 101, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_daily_timeline_line', 'daily attendance per day', 'الحضور اليومي يومياً', 'line', 'schedulingDailyAttendanceTimeline', 'date', { x: 6, y: 101, w: 6, h: 5 }, { drillScope: 'daily' }),

  attChart('sched_att_timeline_bar', 'all attendance records per day', 'كل سجلات الحضور يومياً', 'bar', 'schedulingAttendanceTimeline', 'date', { x: 0, y: 106, w: 12, h: 4 }),

  {
    id: 'sched_att_records_list',
    titleEn: 'attendance records detail',
    titleAr: 'تفاصيل سجلات الحضور',
    chartType: 'list',
    dataSource: 'schedulingAttendanceRecords',
    groupBy: '',
    aggregation: 'count',
    dateRange: 'current',
    listLimit: 200,
    filters: [],
    layout: { x: 0, y: 110, w: 12, h: 6 },
  },

  countWidget('sched_wf_cnt_total', 'schedulingWorkflowOverview', 'totalDocuments', 'totalDocuments', 'Total workflow documents in period', { x: 0, y: 116, w: 3, h: 3 }),

  {
    id: 'sched_wf_status_pie',
    titleEn: 'workflow documents by status',
    titleAr: 'مستندات سير العمل حسب الحالة',
    chartType: 'pie',
    dataSource: 'schedulingWorkflowByStatus',
    groupBy: 'status',
    aggregation: 'sum',
    valueField: 'documentCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 119, w: 6, h: 5 },
  },
  {
    id: 'sched_wf_type_donut',
    titleEn: 'workflow documents by type',
    titleAr: 'مستندات سير العمل حسب النوع',
    chartType: 'donut',
    dataSource: 'schedulingWorkflowByType',
    groupBy: 'workflowType',
    aggregation: 'sum',
    valueField: 'documentCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 119, w: 6, h: 5 },
  },
  {
    id: 'sched_wf_program_bar',
    titleEn: 'workflow documents by program',
    titleAr: 'مستندات سير العمل حسب البرنامج',
    chartType: 'bar',
    dataSource: 'schedulingWorkflowByProgram',
    groupBy: 'program',
    aggregation: 'sum',
    valueField: 'documentCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 124, w: 6, h: 5 },
  },
  {
    id: 'sched_wf_timeline_line',
    titleEn: 'workflow documents per day',
    titleAr: 'مستندات سير العمل يومياً',
    chartType: 'line',
    dataSource: 'schedulingWorkflowTimeline',
    groupBy: 'date',
    aggregation: 'sum',
    valueField: 'documentCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 124, w: 6, h: 5 },
  },
];

export const SCHEDULING_SUMMARY_MAX_WIDGETS = SCHEDULING_SUMMARY_DEFAULT_WIDGETS.length;

// ── Attendance-only widgets (for separate Attendance Analytics section) ─────
export const SCHEDULING_ATTENDANCE_STORAGE_KEY = 'scheduling_attendance';
export const SCHEDULING_ATTENDANCE_DEFAULT_WIDGETS = [
  countWidget('sched_att_cnt_total', 'schedulingAttendanceOverview', 'totalRecords', 'totalRecords', 'Total attendance records in period', { x: 0, y: 0, w: 3, h: 3 }),
  countWidget('sched_att_cnt_class', 'schedulingAttendanceOverview', 'classRecords', 'classRecords', 'Class attendance records', { x: 3, y: 0, w: 3, h: 3 }),
  countWidget('sched_att_cnt_daily', 'schedulingAttendanceOverview', 'dailyRecords', 'dailyRecords', 'Daily attendance records', { x: 6, y: 0, w: 3, h: 3 }),
  countWidget('sched_att_cnt_present', 'schedulingAttendanceOverview', 'presentCount', 'presentCount', 'Present attendance records', { x: 9, y: 0, w: 3, h: 3 }),
  countWidget('sched_att_cnt_absent', 'schedulingAttendanceOverview', 'absentCount', 'absentCount', 'Absent attendance records', { x: 0, y: 3, w: 3, h: 3 }),
  countWidget('sched_att_cnt_late', 'schedulingAttendanceOverview', 'lateCount', 'lateCount', 'Late attendance records', { x: 3, y: 3, w: 3, h: 3 }),
  countWidget('sched_att_cnt_students', 'schedulingAttendanceOverview', 'uniqueStudents', 'uniqueStudents', 'Unique students with attendance', { x: 6, y: 3, w: 3, h: 3 }),
  countWidget('sched_att_cnt_classes', 'schedulingAttendanceOverview', 'uniqueClasses', 'uniqueClasses', 'Unique classes with attendance', { x: 9, y: 3, w: 3, h: 3 }),

  attChart('sched_att_type_donut', 'class vs daily attendance volume', 'حضور الصف مقابل الحضور اليومي', 'donut', 'schedulingAttendanceByType', 'attendanceTypeLabel', { x: 0, y: 6, w: 6, h: 5 }),
  attChart('sched_att_type_bar', 'class vs daily attendance volume', 'حضور الصف مقابل الحضور اليومي', 'bar', 'schedulingAttendanceByType', 'attendanceTypeLabel', { x: 6, y: 6, w: 6, h: 5 }),

  attChart('sched_att_class_status_pie', 'class attendance by status', 'حضور الصف حسب الحالة', 'pie', 'schedulingClassAttendanceByStatus', 'status', { x: 0, y: 11, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_daily_status_pie', 'daily attendance by status', 'الحضور اليومي حسب الحالة', 'pie', 'schedulingDailyAttendanceByStatus', 'status', { x: 6, y: 11, w: 6, h: 5 }, { drillScope: 'daily' }),

  attChart('sched_att_class_status_bar', 'class attendance by status', 'حضور الصف حسب الحالة', 'bar', 'schedulingClassAttendanceByStatus', 'status', { x: 0, y: 16, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_daily_status_bar', 'daily attendance by status', 'الحضور اليومي حسب الحالة', 'bar', 'schedulingDailyAttendanceByStatus', 'status', { x: 6, y: 16, w: 6, h: 5 }, { drillScope: 'daily' }),

  attChart('sched_att_status_donut', 'all attendance by status', 'كل الحضور حسب الحالة', 'donut', 'schedulingAttendanceByStatus', 'status', { x: 0, y: 21, w: 6, h: 5 }),
  attChart('sched_att_status_pie', 'all attendance by status', 'كل الحضور حسب الحالة', 'pie', 'schedulingAttendanceByStatus', 'status', { x: 6, y: 21, w: 6, h: 5 }),

  attChart('sched_att_class_program_bar', 'class attendance by program', 'حضور الصف حسب البرنامج', 'bar', 'schedulingClassAttendanceByProgram', 'programName', { x: 0, y: 26, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_daily_program_bar', 'daily attendance by program', 'الحضور اليومي حسب البرنامج', 'bar', 'schedulingDailyAttendanceByProgram', 'programName', { x: 6, y: 26, w: 6, h: 5 }, { drillScope: 'daily' }),

  attChart('sched_att_instructor_bar', 'class attendance by instructor', 'حضور الصف حسب المدرس', 'bar', 'schedulingAttendanceByInstructor', 'instructorName', { x: 0, y: 31, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_class_bar', 'class attendance by class', 'حضور الصف حسب الصف', 'bar', 'schedulingClassAttendanceByClass', 'className', { x: 6, y: 31, w: 6, h: 5 }, { drillScope: 'class' }),

  attChart('sched_att_class_timeline_line', 'class attendance per day', 'حضور الصف يومياً', 'line', 'schedulingClassAttendanceTimeline', 'date', { x: 0, y: 36, w: 6, h: 5 }, { drillScope: 'class' }),
  attChart('sched_att_daily_timeline_line', 'daily attendance per day', 'الحضور اليومي يومياً', 'line', 'schedulingDailyAttendanceTimeline', 'date', { x: 6, y: 36, w: 6, h: 5 }, { drillScope: 'daily' }),

  attChart('sched_att_timeline_bar', 'all attendance records per day', 'كل سجلات الحضور يومياً', 'bar', 'schedulingAttendanceTimeline', 'date', { x: 0, y: 41, w: 12, h: 4 }),

  {
    id: 'sched_att_records_list',
    titleEn: 'attendance records detail',
    titleAr: 'تفاصيل سجلات الحضور',
    chartType: 'list',
    dataSource: 'schedulingAttendanceRecords',
    groupBy: '',
    aggregation: 'count',
    dateRange: 'current',
    listLimit: 200,
    filters: [],
    layout: { x: 0, y: 45, w: 12, h: 6 },
  },
];
export const SCHEDULING_ATTENDANCE_MAX_WIDGETS = SCHEDULING_ATTENDANCE_DEFAULT_WIDGETS.length;

// ── Breaks & Holidays widgets (for separate Breaks & Holidays Analytics section) ──
export const SCHEDULING_BREAKS_HOLIDAYS_STORAGE_KEY = 'scheduling_breaks_holidays';
export const SCHEDULING_BREAKS_HOLIDAYS_DEFAULT_WIDGETS = [
  countWidget('sched_bh_cnt_breaks', 'schedulingBreaksHolidaysOverview', 'breakCount', 'breakCount', 'Total Break Sessions', { x: 0, y: 0, w: 3, h: 3 }),
  countWidget('sched_bh_cnt_holidays', 'schedulingBreaksHolidaysOverview', 'holidayCount', 'holidayCount', 'Holidays in Range', { x: 3, y: 0, w: 3, h: 3 }),
  countWidget('sched_bh_cnt_affected', 'schedulingBreaksHolidaysOverview', 'sessionsAffected', 'sessionsAffected', 'Sessions Affected by Holidays', { x: 6, y: 0, w: 3, h: 3 }),
  countWidget('sched_bh_cnt_today_sessions', 'schedulingBreaksHolidaysOverview', 'todaySessionCount', 'todaySessionCount', "Today's Sessions", { x: 9, y: 0, w: 3, h: 3 }),
  countWidget('sched_bh_cnt_today_instructors', 'schedulingBreaksHolidaysOverview', 'instructorsWithSessionsToday', 'instructorsWithSessionsToday', 'Instructors with Sessions Today', { x: 0, y: 3, w: 3, h: 3 }),
  countWidget('sched_bh_cnt_break_types', 'schedulingBreaksHolidaysOverview', 'breakTypeCount', 'breakTypeCount', 'Break Types', { x: 3, y: 3, w: 3, h: 3 }),
  countWidget('sched_bh_cnt_holiday_types', 'schedulingBreaksHolidaysOverview', 'holidayTypeCount', 'holidayTypeCount', 'Holiday Types', { x: 6, y: 3, w: 3, h: 3 }),

  {
    id: 'sched_bh_breaks_donut',
    titleEn: 'break sessions by break type',
    titleAr: 'جلسات الاستراحة حسب نوع الاستراحة',
    chartType: 'donut',
    dataSource: 'schedulingBreaks',
    groupBy: 'breakType',
    aggregation: 'count',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 6, w: 6, h: 5 },
  },
  {
    id: 'sched_bh_breaks_bar',
    titleEn: 'break sessions by break type',
    titleAr: 'جلسات الاستراحة حسب نوع الاستراحة',
    chartType: 'bar',
    dataSource: 'schedulingBreaks',
    groupBy: 'breakType',
    aggregation: 'count',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 6, w: 6, h: 5 },
  },

  {
    id: 'sched_bh_holiday_overlap_donut',
    titleEn: 'holiday impact (sessions affected vs unaffected)',
    titleAr: 'تأثير العطل (جلسات متأثرة مقابل غير متأثرة)',
    chartType: 'donut',
    dataSource: 'schedulingHolidayOverlap',
    groupBy: 'impactType',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 11, w: 6, h: 5 },
  },
  {
    id: 'sched_bh_holiday_overlap_bar',
    titleEn: 'holiday impact (sessions affected vs unaffected)',
    titleAr: 'تأثير العطل (جلسات متأثرة مقابل غير متأثرة)',
    chartType: 'bar',
    dataSource: 'schedulingHolidayOverlap',
    groupBy: 'impactType',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 11, w: 6, h: 5 },
  },

  {
    id: 'sched_bh_holidays_type_pie',
    titleEn: 'holidays by type',
    titleAr: 'العطل حسب النوع',
    chartType: 'pie',
    dataSource: 'schedulingHolidays',
    groupBy: 'type',
    aggregation: 'count',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 16, w: 6, h: 5 },
  },
  {
    id: 'sched_bh_holidays_type_bar',
    titleEn: 'holidays by type',
    titleAr: 'العطل حسب النوع',
    chartType: 'bar',
    dataSource: 'schedulingHolidays',
    groupBy: 'type',
    aggregation: 'count',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 16, w: 6, h: 5 },
  },

  {
    id: 'sched_bh_recurrence_donut',
    titleEn: 'recurring sessions vs one-off sessions',
    titleAr: 'الجلسات المتكررة مقابل الجلسات لمرة واحدة',
    chartType: 'donut',
    dataSource: 'schedulingRecurrenceBreakdown',
    groupBy: 'recurrenceType',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 21, w: 6, h: 5 },
  },

  {
    id: 'sched_bh_breaks_list',
    titleEn: 'break sessions detail',
    titleAr: 'تفاصيل جلسات الاستراحة',
    chartType: 'list',
    dataSource: 'schedulingBreaks',
    groupBy: '',
    aggregation: 'count',
    dateRange: 'current',
    listLimit: 200,
    filters: [],
    layout: { x: 0, y: 26, w: 6, h: 6 },
  },
  {
    id: 'sched_bh_holidays_list',
    titleEn: 'holidays detail',
    titleAr: 'تفاصيل العطل',
    chartType: 'list',
    dataSource: 'schedulingHolidays',
    groupBy: '',
    aggregation: 'count',
    dateRange: 'current',
    listLimit: 200,
    filters: [],
    layout: { x: 6, y: 26, w: 6, h: 6 },
  },
];
export const SCHEDULING_BREAKS_HOLIDAYS_MAX_WIDGETS = SCHEDULING_BREAKS_HOLIDAYS_DEFAULT_WIDGETS.length;

const SOURCE_FILTER_MAP = {
  schedulingOverviewStats: 'overview',
  schedulingPrograms: 'overview',
  schedulingSubjects: 'overview',
  schedulingSessions: 'sessions',
  schedulingRecurrenceBreakdown: 'sessions',
  schedulingHolidayOverlap: 'holidays',
  schedulingClassCoverage: 'sessions',
  schedulingSessionTimeline: 'timeline',
  schedulingTeachers: 'instructors',
  schedulingInstructorWorkload: 'instructors',
  schedulingInstructorAvailability: 'instructors',
  schedulingCourses: 'classes',
  schedulingClasses: 'classes',
  schedulingRooms: 'rooms',
  schedulingRoomAvailability: 'rooms',
  schedulingBreaks: 'breaks',
  schedulingBreaksHolidaysOverview: 'breaks',
  schedulingHolidays: 'holidays',
  schedulingCalendar: 'calendar',
  schedulingAttendanceByStatus: 'attendance',
  schedulingClassAttendanceByStatus: 'attendance',
  schedulingDailyAttendanceByStatus: 'attendance',
  schedulingAttendanceByProgram: 'attendance',
  schedulingClassAttendanceByProgram: 'attendance',
  schedulingDailyAttendanceByProgram: 'attendance',
  schedulingAttendanceByInstructor: 'attendance',
  schedulingClassAttendanceByClass: 'attendance',
  schedulingAttendanceByType: 'attendance',
  schedulingAttendanceTimeline: 'attendance',
  schedulingClassAttendanceTimeline: 'attendance',
  schedulingDailyAttendanceTimeline: 'attendance',
  schedulingAttendanceOverview: 'attendance',
  schedulingAttendanceRecords: 'attendance',
  schedulingWorkflowByStatus: 'workflow',
  schedulingWorkflowByType: 'workflow',
  schedulingWorkflowByProgram: 'workflow',
  schedulingWorkflowTimeline: 'workflow',
  schedulingWorkflowOverview: 'workflow',
};

export function getWidgetDisplayTitle(widget, t, lang = 'en') {
  const titleFromKey = widget?.titleKey ? t(widget.titleKey) : null;
  const localized = lang === 'ar'
    ? (widget?.titleAr || widget?.titleEn || widget?.title)
    : (widget?.titleEn || widget?.titleAr || widget?.title);
  return titleFromKey || localized || t?.('untitled') || 'Untitled';
}

/** Pie/donut/bar click → list widget with real attendance rows (dates, students, etc.) */
export function resolveDrillDownListWidget(widget, dataPoint, t, lang) {
  const sliceLabel = dataPoint?.label || dataPoint?.lines?.[0] || '';
  if (!sliceLabel || !widget?.groupBy) return null;

  const listSource = widget.listDetailSource
    || (widget.dataSource?.includes('Attendance') || widget.dataSource?.includes('attendance')
      ? 'schedulingAttendanceRecords'
      : null);

  if (!listSource) return null;

  const parentTitle = getWidgetDisplayTitle(widget, t, lang);
  const newTitle = `${parentTitle} - ${sliceLabel}`;
  const drillFilters = {};
  if (widget.drillScope === 'class') drillFilters.attendanceType = 'class';
  if (widget.drillScope === 'daily') drillFilters.attendanceType = 'daily';

  return {
    id: `list-${Date.now()}`,
    title: newTitle,
    titleEn: newTitle,
    titleAr: newTitle,
    chartType: 'list',
    dataSource: listSource,
    groupBy: widget.groupBy,
    filterValue: sliceLabel,
    drillFilters,
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

export function inferSchedulingWidgetCategory(widget) {
  if (widget?.chartType === 'count') {
    const sk = widget?.statKey || widget?.countMetric || '';
    if (sk.includes('holiday') || sk === 'holidayCount' || sk === 'holidayTypeCount' || sk === 'sessionsAffected') return 'holidays';
    if (sk.includes('break') || sk === 'breakCount' || sk === 'breakTypeCount') return 'breaks';
    if (sk === 'todaySessionCount' || sk === 'instructorsWithSessionsToday') return 'breaks';
    return 'overview';
  }
  return SOURCE_FILTER_MAP[widget?.dataSource] || 'sessions';
}

export const SCHEDULING_WIDGET_CATEGORIES = [
  { id: 'overview', labelKey: 'widget_cat_overview', icon: 'layout_dashboard' },
  { id: 'sessions', labelKey: 'widget_cat_sessions', icon: 'bar_chart3' },
  { id: 'timeline', labelKey: 'widget_cat_timeline', icon: 'line_chart' },
  { id: 'instructors', labelKey: 'widget_cat_instructors', icon: 'users' },
  { id: 'classes', labelKey: 'widget_cat_classes', icon: 'layers' },
  { id: 'rooms', labelKey: 'widget_cat_rooms', icon: 'door_open' },
  { id: 'breaks', labelKey: 'widget_cat_breaks', icon: 'coffee' },
  { id: 'holidays', labelKey: 'widget_cat_holidays', icon: 'palmtree' },
  { id: 'calendar', labelKey: 'widget_cat_today', icon: 'calendar_days' },
  { id: 'attendance', labelKey: 'widget_cat_attendance', icon: 'clipboard_list' },
  { id: 'workflow', labelKey: 'widget_cat_workflow', icon: 'git_branch' },
];

const WIDGET_HELP_KEYS = {
  schedulingSessions: 'widget_help_scheduling_sessions',
  schedulingSessionTimeline: 'widget_help_scheduling_timeline',
  schedulingTeachers: 'widget_help_scheduling_instructors',
  schedulingInstructorWorkload: 'widget_help_scheduling_workload',
  schedulingCourses: 'widget_help_scheduling_class_load',
  schedulingClasses: 'widget_help_scheduling_classes',
  schedulingRooms: 'widget_help_scheduling_rooms',
  schedulingCalendar: 'widget_help_scheduling_today',
  schedulingBreaks: 'widget_help_scheduling_breaks',
  schedulingBreaksHolidaysOverview: 'widget_help_scheduling_breaks',
  schedulingHolidays: 'widget_help_scheduling_holidays',
  schedulingClassCoverage: 'widget_help_scheduling_class_coverage',
  schedulingAttendanceByStatus: 'widget_help_scheduling_attendance',
  schedulingAttendanceByProgram: 'widget_help_scheduling_attendance',
  schedulingAttendanceByInstructor: 'widget_help_scheduling_class_attendance',
  schedulingAttendanceTimeline: 'widget_help_scheduling_attendance',
  schedulingClassAttendanceByStatus: 'widget_help_scheduling_class_attendance',
  schedulingDailyAttendanceByStatus: 'widget_help_scheduling_daily_attendance',
  schedulingAttendanceByType: 'widget_help_scheduling_attendance_by_type',
  schedulingAttendanceRecords: 'widget_help_scheduling_attendance_records',
  schedulingClassAttendanceByProgram: 'widget_help_scheduling_class_attendance',
  schedulingDailyAttendanceByProgram: 'widget_help_scheduling_daily_attendance',
  schedulingClassAttendanceByClass: 'widget_help_scheduling_class_attendance',
  schedulingClassAttendanceTimeline: 'widget_help_scheduling_class_attendance',
  schedulingDailyAttendanceTimeline: 'widget_help_scheduling_daily_attendance',
  schedulingRecurrenceBreakdown: 'widget_help_scheduling_recurrence',
  schedulingHolidayOverlap: 'widget_help_scheduling_holiday_overlap',
  schedulingRoomAvailability: 'widget_help_scheduling_room_availability',
  schedulingInstructorAvailability: 'widget_help_scheduling_instructor_availability',
};

export function getSchedulingWidgetHelp(widget, t) {
  const key = WIDGET_HELP_KEYS[widget?.dataSource];
  if (key && t) return t(key);
  if (widget?.chartType === 'count') return t?.('widget_help_count') || '';
  return t?.('widget_help_generic') || '';
}

function statusLabel(status, isRTL) {
  const map = {
    scheduled: isRTL ? 'مجدولة' : 'Scheduled',
    in_progress: isRTL ? 'جارية' : 'In Progress',
    completed: isRTL ? 'مكتملة' : 'Completed',
    cancelled: isRTL ? 'ملغاة' : 'Cancelled',
  };
  return map[status] || status;
}

export function buildSchedulingRawData(effortReport, dashboardData, isRTL) {
  const overview = dashboardData?.overview || {};
  const totals = effortReport?.totals || {};

  const schedulingOverviewStats = {
    totalPrograms: overview.totalPrograms ?? 0,
    totalSubjects: overview.totalSubjects ?? dashboardData?.totalSubjects ?? 0,
    totalClasses: overview.totalClasses ?? 0,
    totalSessions: overview.totalSessions ?? totals.sessionCount ?? 0,
    scheduledCount: overview.scheduledCount ?? 0,
    inProgressCount: overview.inProgressCount ?? 0,
    completedCount: overview.completedCount ?? 0,
    cancelledCount: overview.cancelledCount ?? 0,
    thisWeekSessions: overview.thisWeekSessions ?? 0,
    todaySessionCount: (dashboardData?.todaySchedule || []).length,
    uniqueClassrooms: overview.uniqueClassrooms ?? 0,
    totalClassrooms: overview.totalClassrooms ?? dashboardData?.totalClassrooms ?? 0,
    unusedRooms: overview.unusedRooms ?? 0,
    uniqueInstructors: overview.uniqueInstructors ?? 0,
    totalInstructors: overview.totalInstructors ?? dashboardData?.totalTeachers ?? 0,
    unusedInstructors: overview.unusedInstructors ?? 0,
    teachingHours: totals.teachingHours ?? 0,
    avgDuration: overview.avgDuration ?? 0,
    breakCount: dashboardData?.breakSessions?.length ?? 0,
    holidayCount: dashboardData?.holidays?.length ?? 0,
  };

  const todaySchedule = dashboardData?.todaySchedule || [];
  const uniqueTodayInstructors = new Set(
    todaySchedule.map((s) => s.instructor?.id || s.instructor?.displayName).filter(Boolean)
  );
  const schedulingBreaksHolidaysOverview = {
    breakCount: dashboardData?.breakSessions?.length ?? 0,
    holidayCount: dashboardData?.holidays?.length ?? 0,
    sessionsAffected: dashboardData?.holidayImpact?.affectedSessions ?? 0,
    todaySessionCount: todaySchedule.length,
    instructorsWithSessionsToday: uniqueTodayInstructors.size,
    breakTypeCount: new Set((dashboardData?.breakSessions || []).map((b) => b.breakType).filter(Boolean)).size,
    holidayTypeCount: new Set((dashboardData?.holidays || []).map((h) => h.type).filter(Boolean)).size,
  };

  const teachers = (effortReport?.teachers || []).map((row) => ({
    instructorName: isRTL ? (row.instructorNameAr || row.instructorName) : row.instructorName,
    sessionCount: row.sessionCount ?? 0,
    teachingHours: row.teachingHours ?? 0,
    subjectCount: row.subjectCount ?? 0,
    classCount: row.classCount ?? 0,
    primarySubject: row.primarySubject || '—',
    status: 'active',
    type: 'teacher',
  }));

  const courses = (effortReport?.courses || []).map((row) => ({
    courseLabel: [
      isRTL ? row.program?.nameAr : row.program?.nameEn,
      isRTL ? row.subject?.nameAr : row.subject?.nameEn,
      isRTL ? row.class?.nameAr : row.class?.nameEn,
    ].filter(Boolean).join(' · '),
    programName: isRTL ? row.program?.nameAr : row.program?.nameEn,
    subjectName: isRTL ? row.subject?.nameAr : row.subject?.nameEn,
    className: isRTL ? row.class?.nameAr : row.class?.nameEn,
    term: row.class?.term,
    year: row.class?.year != null ? String(row.class.year) : undefined,
    roomName: isRTL ? row.classroom?.nameAr : row.classroom?.nameEn,
    location: row.location || '—',
    capacity: row.capacity ?? '—',
    sessionCount: row.sessionCount ?? 0,
    teachingHours: row.teachingHours ?? 0,
    status: 'active',
    type: 'course',
  }));

  const classMap = new Map();
  for (const row of effortReport?.courses || []) {
    const key = row.class?.id || row.class?.nameEn;
    if (!key) continue;
    const existing = classMap.get(key) || {
      className: isRTL ? row.class?.nameAr : row.class?.nameEn,
      programName: isRTL ? row.program?.nameAr : row.program?.nameEn,
      subjectName: isRTL ? row.subject?.nameAr : row.subject?.nameEn,
      term: row.class?.term,
      year: row.class?.year != null ? String(row.class.year) : undefined,
      sessionCount: 0,
      teachingHours: 0,
    };
    existing.sessionCount += row.sessionCount ?? 0;
    existing.teachingHours += row.teachingHours ?? 0;
    classMap.set(key, existing);
  }
  const schedulingClasses = [...classMap.values()];

  const schedulingSessions = ['scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => ({
    status: statusLabel(status, isRTL),
    statusKey: status,
    sessionCount: overview[`${status === 'in_progress' ? 'inProgress' : status}Count`] ?? 0,
    type: 'session_status',
  }));

  for (const row of effortReport?.courses || []) {
    const programName = isRTL ? row.program?.nameAr : row.program?.nameEn;
    const subjectName = isRTL ? row.subject?.nameAr : row.subject?.nameEn;
    const className = isRTL ? row.class?.nameAr : row.class?.nameEn;
    const roomName = isRTL ? row.classroom?.nameAr : row.classroom?.nameEn;
    schedulingSessions.push({
      programName: programName || undefined,
      subjectName: subjectName || undefined,
      className: className || undefined,
      term: row.class?.term,
      year: row.class?.year != null ? String(row.class.year) : undefined,
      roomName: roomName || row.location || undefined,
      courseLabel: [programName, subjectName, className].filter(Boolean).join(' · '),
      sessionCount: row.sessionCount ?? 0,
      teachingHours: row.teachingHours ?? 0,
      status: statusLabel('scheduled', isRTL),
      type: 'session',
    });
  }

  for (const row of effortReport?.teachers || []) {
    const instructorName = isRTL ? (row.instructorNameAr || row.instructorName) : row.instructorName;
    schedulingSessions.push({
      instructorName: instructorName || undefined,
      primarySubject: row.primarySubject || undefined,
      sessionCount: row.sessionCount ?? 0,
      teachingHours: row.teachingHours ?? 0,
      status: statusLabel('scheduled', isRTL),
      type: 'session',
    });
  }

  const subjectSessions = (dashboardData?.subjectSessions || []).map((s) => ({
    subjectName: isRTL ? s.subjectNameAr : s.subjectNameEn,
    sessionCount: s.sessionCount ?? 0,
    type: 'subject',
  }));

  for (const ss of subjectSessions) {
    if (ss.sessionCount > 0 && ss.subjectName) {
      schedulingSessions.push({
        status: statusLabel('scheduled', isRTL),
        subjectName: ss.subjectName,
        sessionCount: ss.sessionCount,
        type: 'session',
      });
    }
  }

  const schedulingRooms = [
    {
      roomName: isRTL ? 'قاعات مستخدمة' : 'Rooms in Use',
      usageType: 'used',
      sessionCount: overview.uniqueClassrooms ?? 0,
      status: 'used',
    },
    {
      roomName: isRTL ? 'قاعات غير مستخدمة' : 'Unused Rooms',
      usageType: 'unused',
      sessionCount: overview.unusedRooms ?? 0,
      status: 'unused',
    },
  ];

  const schedulingInstructorAvailability = [
    {
      instructorName: isRTL ? 'مدرسون مع جلسات' : 'Instructors with Sessions',
      status: 'assigned',
      slotCount: overview.uniqueInstructors ?? 0,
    },
    {
      instructorName: isRTL ? 'مدرسون بدون جلسات' : 'Instructors without Sessions',
      status: 'unassigned',
      slotCount: overview.unusedInstructors ?? 0,
    },
  ];

  const schedulingRoomAvailability = [
    {
      roomName: isRTL ? 'متاحة' : 'Available',
      status: 'available',
      slotCount: dashboardData?.availableClassrooms ?? 0,
      dayOfWeek: '—',
    },
    {
      roomName: isRTL ? 'مشغولة' : 'In Use',
      status: 'in_use',
      slotCount: overview.uniqueClassrooms ?? 0,
      dayOfWeek: '—',
    },
  ];

  const schedulingCalendar = [
    ...(dashboardData?.todaySchedule || []).map((s) => ({
      eventType: isRTL ? 'جلسة' : 'Session',
      date: s.date || s.startDate,
      instructorName: isRTL ? s.instructor?.displayNameAr : s.instructor?.displayName,
      roomName: isRTL ? s.classroom?.nameAr : s.classroom?.nameEn,
      sessionCount: 1,
      programName: isRTL ? s.program?.nameAr : s.program?.nameEn,
      type: 'calendar',
    })),
    ...(dashboardData?.holidays || []).map((h) => ({
      eventType: isRTL ? 'عطلة' : 'Holiday',
      date: h.startDate,
      instructorName: '—',
      roomName: '—',
      sessionCount: 1,
      type: 'holiday',
    })),
  ];

  const schedulingBreaks = (dashboardData?.breakSessions || []).map((b) => ({
    label: b.breakType || 'Break',
    breakType: b.breakType || 'Break',
    date: b.date,
    instructorName: isRTL ? b.instructor?.displayNameAr : b.instructor?.displayName,
    status: b.breakType,
    type: 'break',
  }));

  const schedulingHolidays = (dashboardData?.holidays || []).map((h) => ({
    label: isRTL ? h.descriptionAr : h.descriptionEn,
    startDate: h.startDate,
    endDate: h.endDate,
    type: h.type,
    status: 'holiday',
  }));

  const wa = dashboardData?.widgetAnalytics || {};
  const coverageLabels = {
    with_sessions: isRTL ? 'صفوف بجلسات' : 'Classes with sessions',
    without_sessions: isRTL ? 'صفوف بدون جلسات' : 'Classes without sessions',
  };
  const recurrenceLabels = {
    recurring: isRTL ? 'متكررة' : 'Recurring',
    one_off: isRTL ? 'لمرة واحدة' : 'One-off',
  };
  const holidayLabels = {
    affected_by_holiday: isRTL ? 'متأثرة بالعطل' : 'Affected by holidays',
    unaffected: isRTL ? 'غير متأثرة' : 'Unaffected',
  };

  const schedulingSessionTimeline = (wa.sessionTimeline || []).map((row) => ({
    date: row.date,
    sessionCount: row.sessionCount ?? 0,
  }));

  const schedulingInstructorWorkload = (wa.instructorWorkload || []).map((row) => ({
    instructorName: isRTL ? (row.instructorNameAr || row.instructorName) : row.instructorName,
    assignedHours: row.assignedHours ?? 0,
    capacityHours: row.capacityHours ?? 0,
    utilizationPct: row.utilizationPct ?? 0,
    metricLabel: row.metricLabel || `${row.assignedHours ?? 0}h · ${row.capacityHours ?? 0}h`,
    type: 'workload',
  }));

  const schedulingClassCoverage = (wa.classCoverage || []).map((row) => ({
    coverageType: coverageLabels[row.coverageType] || row.coverageType,
    classCount: row.classCount ?? 0,
  }));

  const schedulingRecurrenceBreakdown = (wa.recurrenceBreakdown || []).map((row) => ({
    recurrenceType: recurrenceLabels[row.recurrenceType] || row.recurrenceType,
    sessionCount: row.sessionCount ?? 0,
  }));

  const schedulingHolidayOverlap = (wa.holidayOverlap || []).map((row) => ({
    impactType: holidayLabels[row.impactType] || row.impactType,
    sessionCount: row.sessionCount ?? 0,
  }));

  const schedulingAttendanceOverview = {
    totalRecords: wa.attendanceOverview?.totalRecords ?? 0,
    classRecords: wa.attendanceOverview?.classRecords ?? 0,
    dailyRecords: wa.attendanceOverview?.dailyRecords ?? 0,
    presentCount: wa.attendanceOverview?.presentCount ?? 0,
    absentCount: wa.attendanceOverview?.absentCount ?? 0,
    lateCount: wa.attendanceOverview?.lateCount ?? 0,
    uniqueStudents: wa.attendanceOverview?.uniqueStudents ?? 0,
    uniqueClasses: wa.attendanceOverview?.uniqueClasses ?? 0,
    statusTypes: wa.attendanceOverview?.statusTypes ?? 0,
    programs: wa.attendanceOverview?.programs ?? 0,
  };
  const schedulingWorkflowOverview = {
    totalDocuments: wa.workflowOverview?.totalDocuments ?? 0,
    statusTypes: wa.workflowOverview?.statusTypes ?? 0,
    workflowTypes: wa.workflowOverview?.workflowTypes ?? 0,
  };

  const mapAttendanceAgg = (rows, labelKey, countKey = 'recordCount') => (rows || []).map((row) => {
    const arKey = `${labelKey}Ar`;
    const localized = isRTL ? (row[arKey] || row[labelKey]) : (row[labelKey] || row[arKey]);
    return {
      [labelKey]: localized,
      label: localized,
      recordCount: row[countKey] ?? row.recordCount ?? 0,
    };
  });

  const attendanceTypeLabels = {
    class: isRTL ? 'حضور الصف' : 'Class attendance',
    daily: isRTL ? 'الحضور اليومي' : 'Daily attendance',
  };

  const schedulingAttendanceRecords = (wa.attendanceRecords || []).map((row) => ({
    ...row,
    attendanceTypeLabel: row.attendanceType === 'daily'
      ? attendanceTypeLabels.daily
      : attendanceTypeLabels.class,
    title: isRTL ? (row.studentNameAr || row.studentName) : row.studentName,
  }));

  const schedulingAttendanceByStatus = mapAttendanceAgg(wa.attendanceByStatus, 'status');
  const schedulingClassAttendanceByStatus = mapAttendanceAgg(wa.classAttendanceByStatus, 'status');
  const schedulingDailyAttendanceByStatus = mapAttendanceAgg(wa.dailyAttendanceByStatus, 'status');
  const schedulingAttendanceByProgram = mapAttendanceAgg(wa.attendanceByProgram, 'programName');
  const schedulingClassAttendanceByProgram = mapAttendanceAgg(wa.classAttendanceByProgram, 'programName');
  const schedulingDailyAttendanceByProgram = mapAttendanceAgg(wa.dailyAttendanceByProgram, 'programName');
  const schedulingAttendanceByInstructor = mapAttendanceAgg(wa.attendanceByInstructor, 'instructorName');
  const schedulingClassAttendanceByClass = mapAttendanceAgg(wa.classAttendanceByClass, 'className');
  const schedulingAttendanceByType = (wa.attendanceByType || []).map((row) => ({
    attendanceType: row.attendanceType,
    attendanceTypeLabel: attendanceTypeLabels[row.attendanceType] || row.attendanceTypeLabel || row.attendanceType,
    recordCount: row.recordCount ?? 0,
  }));
  const schedulingAttendanceTimeline = (wa.attendanceTimeline || []).map((row) => ({
    date: row.date,
    recordCount: row.recordCount ?? 0,
  }));
  const schedulingClassAttendanceTimeline = (wa.classAttendanceTimeline || []).map((row) => ({
    date: row.date,
    recordCount: row.recordCount ?? 0,
  }));
  const schedulingDailyAttendanceTimeline = (wa.dailyAttendanceTimeline || []).map((row) => ({
    date: row.date,
    recordCount: row.recordCount ?? 0,
  }));

  const schedulingWorkflowByStatus = (wa.workflowByStatus || []).map((row) => ({
    status: row.status,
    documentCount: row.documentCount ?? 0,
  }));
  const schedulingWorkflowByType = (wa.workflowByType || []).map((row) => ({
    workflowType: row.workflowType,
    documentCount: row.documentCount ?? 0,
  }));
  const schedulingWorkflowByProgram = (wa.workflowByProgram || []).map((row) => ({
    program: row.program,
    documentCount: row.documentCount ?? 0,
  }));
  const schedulingWorkflowTimeline = (wa.workflowTimeline || []).map((row) => ({
    date: row.date,
    documentCount: row.documentCount ?? 0,
  }));

  return {
    schedulingOverviewStats,
    schedulingBreaksHolidaysOverview,
    schedulingTeachers: teachers,
    schedulingCourses: courses,
    schedulingClasses,
    schedulingSessions,
    schedulingRooms,
    schedulingInstructorAvailability,
    schedulingRoomAvailability,
    schedulingCalendar,
    schedulingBreaks,
    schedulingHolidays,
    schedulingSessionTimeline,
    schedulingInstructorWorkload,
    schedulingClassCoverage,
    schedulingRecurrenceBreakdown,
    schedulingHolidayOverlap,
    schedulingAttendanceOverview,
    schedulingWorkflowOverview,
    schedulingAttendanceRecords,
    schedulingAttendanceByStatus,
    schedulingClassAttendanceByStatus,
    schedulingDailyAttendanceByStatus,
    schedulingAttendanceByProgram,
    schedulingClassAttendanceByProgram,
    schedulingDailyAttendanceByProgram,
    schedulingAttendanceByInstructor,
    schedulingClassAttendanceByClass,
    schedulingAttendanceByType,
    schedulingAttendanceTimeline,
    schedulingClassAttendanceTimeline,
    schedulingDailyAttendanceTimeline,
    schedulingWorkflowByStatus,
    schedulingWorkflowByType,
    schedulingWorkflowByProgram,
    schedulingWorkflowTimeline,
  };
}
