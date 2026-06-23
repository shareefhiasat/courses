/**
 * Central catalog for WidgetBuilder data sources.
 * Categories: academic | operations | scheduling | merged
 */

export const SOURCE_CATEGORIES = [
  { id: 'all', labelKey: 'widget_cat_all' },
  { id: 'academic', labelKey: 'widget_cat_academic' },
  { id: 'assessment', labelKey: 'widget_cat_assessment' },
  { id: 'operations', labelKey: 'widget_cat_operations' },
  { id: 'content', labelKey: 'widget_cat_content' },
  { id: 'workflow', labelKey: 'widget_cat_workflow' },
  { id: 'scheduling', labelKey: 'widget_cat_scheduling' },
  { id: 'student', labelKey: 'widget_cat_student' },
];

const BASIC_CHARTS = ['bar', 'pie', 'donut', 'list', 'count'];
const TREND_CHARTS = ['line', 'bar', 'list'];
const BREAKDOWN_CHARTS = ['bar', 'pie', 'donut', 'list'];

const countMetric = (value, labelKey, options = {}) => ({ value, labelKey, ...options });

/** Legacy/system metric list kept for persisted default widgets. */
export const SCHEDULING_STAT_KEYS = [
  countMetric('totalPrograms', 'stats_total_programs', { statKey: 'totalPrograms' }),
  countMetric('totalSubjects', 'stats_total_subjects', { statKey: 'totalSubjects' }),
  countMetric('totalClasses', 'stats_total_classes', { statKey: 'totalClasses' }),
  countMetric('totalSessions', 'total_sessions', { statKey: 'totalSessions' }),
  countMetric('scheduledCount', 'stats_scheduled_sessions', { statKey: 'scheduledCount' }),
  countMetric('inProgressCount', 'stats_in_progress_sessions', { statKey: 'inProgressCount' }),
  countMetric('completedCount', 'stats_completed_sessions', { statKey: 'completedCount' }),
  countMetric('cancelledCount', 'stats_cancelled_sessions', { statKey: 'cancelledCount' }),
  countMetric('thisWeekSessions', 'stats_this_week_sessions', { statKey: 'thisWeekSessions' }),
  countMetric('uniqueClassrooms', 'stats_rooms_in_use', { statKey: 'uniqueClassrooms' }),
  countMetric('totalClassrooms', 'stats_total_rooms', { statKey: 'totalClassrooms' }),
  countMetric('uniqueInstructors', 'stats_instructors_active', { statKey: 'uniqueInstructors' }),
  countMetric('totalInstructors', 'stats_total_instructors', { statKey: 'totalInstructors' }),
  countMetric('teachingHours', 'stats_teaching_hours', { statKey: 'teachingHours' }),
  countMetric('avgDuration', 'stats_avg_session_duration', { statKey: 'avgDuration' }),
  countMetric('breakCount', 'stats_break_sessions', { statKey: 'breakCount' }),
  countMetric('holidayCount', 'stats_upcoming_holidays', { statKey: 'holidayCount' }),
];

export const DATA_SOURCES = [
  // ── Merged ────────────────────────────────────────────────────────────────
  {
    value: 'activities,announcements,resources',
    labelKey: 'all_activities',
    label: 'Activities (merged)',
    category: 'merged',
    groupBy: ['classId', 'programId', 'subjectId', 'userId', 'createdBy', 'date', 'type'],
    chartTypes: BASIC_CHARTS,
    countMetrics: [countMetric('total', 'count_metric_total_records')],
  },

  // ── Academic ──────────────────────────────────────────────────────────────
  { value: 'activities', labelKey: 'activities', category: 'academic', groupBy: ['classId', 'programId', 'subjectId', 'studentId', 'createdBy', 'date', 'type'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_activities')] },
  { value: 'announcements', labelKey: 'announcements', category: 'academic', groupBy: ['classId', 'programId', 'userId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_announcements')] },
  { value: 'resources', labelKey: 'resources', category: 'academic', groupBy: ['classId', 'programId', 'subjectId', 'userId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_resources')] },
  { value: 'enrollments', labelKey: 'enrollments', category: 'academic', groupBy: ['classId', 'programId', 'subjectId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_enrollments')] },
  { value: 'classes', labelKey: 'classes', category: 'academic', groupBy: ['programId', 'term', 'year', 'createdBy'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'stats_total_classes'), countMetric('active', 'count_metric_active_classes', { filter: { field: 'isActive', equals: true } })] },
  { value: 'programs', labelKey: 'programs', category: 'academic', groupBy: ['createdBy'], chartTypes: ['list', 'count'], countMetrics: [countMetric('total', 'stats_total_programs'), countMetric('active', 'count_metric_active_programs', { filter: { field: 'isActive', equals: true } })] },
  { value: 'subjects', labelKey: 'subjects', category: 'academic', groupBy: ['programId', 'createdBy'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'stats_total_subjects'), countMetric('active', 'count_metric_active_subjects', { filter: { field: 'isActive', equals: true } })] },

  // ── Assessment ────────────────────────────────────────────────────────────
  { value: 'studentMarks', labelKey: 'ds_student_marks', category: 'assessment', groupBy: ['programId', 'subjectId', 'classId', 'studentId', 'markType', 'createdBy', 'date'], chartTypes: ['bar', 'line', 'pie', 'donut', 'list', 'count'], valueFields: ['totalMarks', 'midTermExam', 'finalExam', 'homework', 'quizzes', 'participation', 'attendance'], countMetrics: [countMetric('total', 'count_metric_total_marks')] },
  { value: 'quizzes', labelKey: 'ds_quizzes', category: 'assessment', groupBy: ['classId', 'programId', 'subjectId', 'difficulty', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_quizzes')] },
  { value: 'quizSubmissions', labelKey: 'ds_quiz_submissions', category: 'assessment', groupBy: ['classId', 'programId', 'subjectId', 'studentId', 'status', 'date'], chartTypes: ['bar', 'line', 'pie', 'donut', 'list', 'count'], valueFields: ['score'], countMetrics: [countMetric('total', 'count_metric_total_quiz_submissions')] },

  // ── Operations ────────────────────────────────────────────────────────────
  { value: 'attendance', labelKey: 'attendance', category: 'operations', groupBy: ['attendanceType', 'classId', 'programId', 'studentId', 'createdBy', 'date', 'status'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_attendance'), countMetric('present', 'count_metric_present_attendance', { filter: { field: 'status', equals: 'present' } }), countMetric('absent', 'count_metric_absent_attendance', { filter: { field: 'status', includes: 'absent' } })] },
  { value: 'users', labelKey: 'users', category: 'operations', groupBy: ['role', 'programId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_users'), countMetric('students', 'count_metric_students', { filter: { field: 'isStudent', equals: true } }), countMetric('instructors', 'count_metric_instructors', { filter: { field: 'isInstructor', equals: true } })] },
  { value: 'penalties', labelKey: 'penalties', category: 'operations', groupBy: ['penaltyType', 'classId', 'userId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_penalties')] },
  { value: 'absences', labelKey: 'absences', category: 'operations', groupBy: ['absenceType', 'classId', 'userId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_absences')] },
  { value: 'behaviors', labelKey: 'behaviors', category: 'operations', groupBy: ['classId', 'studentId', 'programId', 'subjectId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_behaviors')] },
  { value: 'participations', labelKey: 'participations', category: 'operations', groupBy: ['classId', 'studentId', 'programId', 'subjectId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_participations')] },
  { value: 'activityLogs', labelKey: 'activity_logs', category: 'operations', groupBy: ['userId', 'createdBy', 'date'], chartTypes: ['bar', 'line', 'list', 'count'], countMetrics: [countMetric('total', 'count_metric_total_activity_logs')] },

  // ── Content / Smart Drive ─────────────────────────────────────────────────
  { value: 'smartDriveFiles', labelKey: 'ds_smart_drive_files', category: 'content', groupBy: ['type', 'mimeType', 'programId', 'classId', 'createdBy', 'date'], chartTypes: ['bar', 'pie', 'donut', 'line', 'list', 'count'], valueFields: ['size'], countMetrics: [countMetric('total', 'count_metric_total_files'), countMetric('folders', 'count_metric_total_folders', { filter: { field: 'type', equals: 'folder' } }), countMetric('images', 'count_metric_image_files', { filter: { field: 'mimeType', includes: 'image' } }), countMetric('pdf', 'count_metric_pdf_files', { filter: { field: 'mimeType', includes: 'pdf' } }), countMetric('documents', 'count_metric_document_files', { filter: { field: 'mimeType', includes: 'document' } })] },
  { value: 'smartDriveShares', labelKey: 'ds_smart_drive_shares', category: 'content', groupBy: ['type', 'programId', 'classId', 'createdBy', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_file_shares')] },

  // ── Workflow ──────────────────────────────────────────────────────────────
  { value: 'workflowDocuments', labelKey: 'ds_workflow_documents', category: 'workflow', groupBy: ['status', 'type', 'programId', 'classId', 'createdBy', 'date'], chartTypes: ['bar', 'pie', 'donut', 'line', 'list', 'count'], countMetrics: [countMetric('total', 'count_metric_total_workflow_documents'), countMetric('pending', 'count_metric_pending_workflow', { filter: { field: 'status', equals: 'pending' } }), countMetric('approved', 'count_metric_approved_workflow', { filter: { field: 'status', equals: 'approved' } })] },
  { value: 'workflowTasks', labelKey: 'ds_workflow_tasks', category: 'workflow', groupBy: ['status', 'assigneeId', 'programId', 'classId', 'date'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_workflow_tasks'), countMetric('open', 'count_metric_open_workflow_tasks', { filter: { field: 'status', equals: 'open' } })] },

  // ── Scheduling ────────────────────────────────────────────────────────────
  {
    value: 'schedulingOverviewStats',
    labelKey: 'ds_scheduling_overview_stats',
    category: 'scheduling',
    groupBy: [],
    isStatSource: true,
    stats: SCHEDULING_STAT_KEYS,
    chartTypes: ['count'],
    hiddenFromBuilder: true,
  },

  // ── Student Dashboard ────────────────────────────────────────────────────
  {
    value: 'spOverviewStats',
    labelKey: 'ds_student_overview_stats',
    label: 'Student Overview Stats',
    category: 'student',
    groupBy: [],
    isStatSource: true,
    stats: [
      countMetric('totalEnrollments', 'count_metric_total_enrollments', { statKey: 'totalEnrollments' }),
      countMetric('totalCourses', 'count_metric_total_courses', { statKey: 'totalCourses' }),
      countMetric('repeatedCount', 'count_metric_repeated_courses', { statKey: 'repeatedCount' }),
      countMetric('totalAttendance', 'count_metric_total_attendance', { statKey: 'totalAttendance' }),
      countMetric('presentCount', 'count_metric_present_attendance', { statKey: 'presentCount' }),
      countMetric('absentCount', 'count_metric_absent_attendance', { statKey: 'absentCount' }),
      countMetric('lateCount', 'count_metric_late_attendance', { statKey: 'lateCount' }),
      countMetric('totalPenalties', 'count_metric_total_penalties', { statKey: 'totalPenalties' }),
      countMetric('penaltyPoints', 'count_metric_penalty_points', { statKey: 'penaltyPoints' }),
      countMetric('totalBehaviors', 'count_metric_total_behaviors', { statKey: 'totalBehaviors' }),
      countMetric('totalParticipations', 'count_metric_total_participations', { statKey: 'totalParticipations' }),
      countMetric('participationPoints', 'count_metric_participation_points', { statKey: 'participationPoints' }),
      countMetric('netScore', 'count_metric_net_score', { statKey: 'netScore' }),
      countMetric('gpa', 'count_metric_gpa', { statKey: 'gpa' }),
    ],
    chartTypes: ['count'],
    hiddenFromBuilder: true,
  },
  { value: 'attendance', labelKey: 'attendance', category: 'student', groupBy: ['status', 'classId', 'subjectId', 'date', 'semester', 'year'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_attendance')] },
  { value: 'penalties', labelKey: 'penalties', category: 'student', groupBy: ['penaltyType', 'type', 'classId', 'subjectId', 'date', 'semester', 'year'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_penalties')] },
  { value: 'behaviors', labelKey: 'behaviors', category: 'student', groupBy: ['type', 'classId', 'subjectId', 'date', 'semester', 'year'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_behaviors')] },
  { value: 'participations', labelKey: 'participations', category: 'student', groupBy: ['type', 'classId', 'subjectId', 'date', 'semester', 'year'], chartTypes: BASIC_CHARTS, valueFields: ['points'], countMetrics: [countMetric('total', 'count_metric_total_participations')] },
  { value: 'studentMarks', labelKey: 'ds_student_marks', category: 'student', groupBy: ['subjectId', 'classId', 'semester', 'year', 'date'], chartTypes: ['bar', 'line', 'pie', 'donut', 'list', 'count'], valueFields: ['totalMarks', 'midTermExam', 'finalExam', 'homework', 'quizzes', 'participation', 'attendance'], countMetrics: [countMetric('total', 'count_metric_total_marks')] },
  { value: 'enrollments', labelKey: 'enrollments', category: 'student', groupBy: ['classId', 'subjectId', 'semester', 'academicYear', 'year'], chartTypes: BASIC_CHARTS, countMetrics: [countMetric('total', 'count_metric_total_enrollments')] },
  {
    value: 'schedulingPrograms',
    labelKey: 'programs',
    category: 'scheduling',
    groupBy: [],
    chartTypes: ['count'],
    countMetrics: [
      countMetric('totalPrograms', 'stats_total_programs', { statKey: 'totalPrograms' }),
    ],
  },
  {
    value: 'schedulingSubjects',
    labelKey: 'subjects',
    category: 'scheduling',
    groupBy: ['programName'],
    chartTypes: ['count'],
    countMetrics: [
      countMetric('totalSubjects', 'stats_total_subjects', { statKey: 'totalSubjects' }),
    ],
  },
  {
    value: 'schedulingSessions',
    labelKey: 'ds_scheduling_sessions',
    category: 'scheduling',
    groupBy: ['status', 'programName', 'subjectName', 'className', 'instructorName', 'roomName', 'date'],
    valueFields: ['sessionCount', 'teachingHours'],
    chartTypes: ['bar', 'line', 'pie', 'donut', 'list', 'count'],
    countMetrics: [
      countMetric('totalSessions', 'total_sessions', { statKey: 'totalSessions' }),
      countMetric('scheduledCount', 'stats_scheduled_sessions', { statKey: 'scheduledCount' }),
      countMetric('inProgressCount', 'stats_in_progress_sessions', { statKey: 'inProgressCount' }),
      countMetric('completedCount', 'stats_completed_sessions', { statKey: 'completedCount' }),
      countMetric('cancelledCount', 'stats_cancelled_sessions', { statKey: 'cancelledCount' }),
      countMetric('thisWeekSessions', 'stats_this_week_sessions', { statKey: 'thisWeekSessions' }),
    ],
  },
  {
    value: 'schedulingTeachers',
    labelKey: 'ds_scheduling_instructors',
    category: 'scheduling',
    groupBy: ['instructorName', 'primarySubject', 'status'],
    valueFields: ['sessionCount', 'teachingHours', 'subjectCount', 'classCount'],
    chartTypes: ['bar', 'pie', 'donut', 'list', 'count'],
    countMetrics: [
      countMetric('uniqueInstructors', 'stats_instructors_active', { statKey: 'uniqueInstructors' }),
      countMetric('totalInstructors', 'stats_total_instructors', { statKey: 'totalInstructors' }),
    ],
  },
  {
    value: 'schedulingCourses',
    labelKey: 'ds_scheduling_class_load',
    category: 'scheduling',
    groupBy: ['programName', 'subjectName', 'className', 'courseLabel', 'location'],
    valueFields: ['sessionCount', 'teachingHours'],
    chartTypes: ['bar', 'pie', 'donut', 'list', 'count'],
    countMetrics: [
      countMetric('totalCourses', 'widget_courses', { datasetCount: true }),
    ],
  },
  {
    value: 'schedulingClasses',
    labelKey: 'ds_scheduling_classes_with_sessions',
    category: 'scheduling',
    groupBy: ['programName', 'subjectName', 'className', 'term', 'year'],
    valueFields: ['sessionCount', 'teachingHours'],
    chartTypes: ['bar', 'pie', 'donut', 'list', 'count'],
    countMetrics: [
      countMetric('totalClasses', 'stats_total_classes', { statKey: 'totalClasses' }),
    ],
  },
  {
    value: 'schedulingRooms',
    labelKey: 'ds_scheduling_rooms',
    category: 'scheduling',
    groupBy: ['roomName', 'status', 'usageType'],
    valueFields: ['sessionCount'],
    chartTypes: ['list', 'count'],
    countMetrics: [
      countMetric('uniqueClassrooms', 'stats_rooms_in_use', { statKey: 'uniqueClassrooms' }),
      countMetric('totalClassrooms', 'stats_total_rooms', { statKey: 'totalClassrooms' }),
    ],
  },
  {
    value: 'schedulingInstructorAvailability',
    labelKey: 'ds_scheduling_instructor_availability',
    category: 'scheduling',
    groupBy: ['status', 'instructorName', 'dayOfWeek'],
    valueFields: ['slotCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingRoomAvailability',
    labelKey: 'ds_scheduling_room_availability',
    category: 'scheduling',
    groupBy: ['status', 'roomName', 'dayOfWeek'],
    valueFields: ['slotCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingCalendar',
    labelKey: 'ds_scheduling_today_schedule',
    category: 'scheduling',
    groupBy: ['eventType', 'date', 'instructorName', 'roomName'],
    valueFields: ['sessionCount'],
    chartTypes: ['bar', 'line', 'list'],
  },
  {
    value: 'schedulingBreaks',
    labelKey: 'ds_scheduling_breaks',
    category: 'scheduling',
    groupBy: ['breakType', 'instructorName', 'date'],
    chartTypes: BASIC_CHARTS,
    countMetrics: [
      countMetric('breakCount', 'stats_break_sessions', { statKey: 'breakCount' }),
    ],
  },
  {
    value: 'schedulingHolidays',
    labelKey: 'ds_scheduling_holidays',
    category: 'scheduling',
    groupBy: ['type', 'startDate'],
    chartTypes: BASIC_CHARTS,
    countMetrics: [
      countMetric('holidayCount', 'stats_upcoming_holidays', { statKey: 'holidayCount' }),
    ],
  },
  {
    value: 'schedulingSessionTimeline',
    labelKey: 'ds_scheduling_session_timeline',
    category: 'scheduling',
    groupBy: ['date'],
    valueFields: ['sessionCount'],
    chartTypes: TREND_CHARTS,
  },
  {
    value: 'schedulingInstructorWorkload',
    labelKey: 'ds_scheduling_instructor_workload',
    category: 'scheduling',
    groupBy: ['instructorName'],
    valueFields: ['assignedHours', 'capacityHours', 'utilizationPct'],
    chartTypes: ['bar', 'list'],
  },
  {
    value: 'schedulingClassCoverage',
    labelKey: 'ds_scheduling_class_coverage',
    category: 'scheduling',
    groupBy: ['coverageType'],
    valueFields: ['classCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingRecurrenceBreakdown',
    labelKey: 'ds_scheduling_recurrence',
    category: 'scheduling',
    groupBy: ['recurrenceType'],
    valueFields: ['sessionCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingHolidayOverlap',
    labelKey: 'ds_scheduling_holiday_overlap',
    category: 'scheduling',
    groupBy: ['impactType'],
    valueFields: ['sessionCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingAttendanceByStatus',
    labelKey: 'ds_scheduling_attendance_by_status',
    category: 'scheduling',
    groupBy: ['status'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingClassAttendanceByStatus',
    labelKey: 'ds_scheduling_class_attendance_by_status',
    category: 'scheduling',
    groupBy: ['status'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingDailyAttendanceByStatus',
    labelKey: 'ds_scheduling_daily_attendance_by_status',
    category: 'scheduling',
    groupBy: ['status'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingAttendanceByProgram',
    labelKey: 'ds_scheduling_attendance_by_program',
    category: 'scheduling',
    groupBy: ['programName'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingClassAttendanceByProgram',
    labelKey: 'ds_scheduling_class_attendance_by_program',
    category: 'scheduling',
    groupBy: ['programName'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingDailyAttendanceByProgram',
    labelKey: 'ds_scheduling_daily_attendance_by_program',
    category: 'scheduling',
    groupBy: ['programName'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingAttendanceByInstructor',
    labelKey: 'ds_scheduling_attendance_by_instructor',
    category: 'scheduling',
    groupBy: ['instructorName'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingClassAttendanceByClass',
    labelKey: 'ds_scheduling_class_attendance_by_class',
    category: 'scheduling',
    groupBy: ['className'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingAttendanceByType',
    labelKey: 'ds_scheduling_attendance_by_type',
    category: 'scheduling',
    groupBy: ['attendanceTypeLabel'],
    valueFields: ['recordCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingAttendanceTimeline',
    labelKey: 'ds_scheduling_attendance_timeline',
    category: 'scheduling',
    groupBy: ['date'],
    valueFields: ['recordCount'],
    chartTypes: TREND_CHARTS,
  },
  {
    value: 'schedulingClassAttendanceTimeline',
    labelKey: 'ds_scheduling_class_attendance_timeline',
    category: 'scheduling',
    groupBy: ['date'],
    valueFields: ['recordCount'],
    chartTypes: TREND_CHARTS,
  },
  {
    value: 'schedulingDailyAttendanceTimeline',
    labelKey: 'ds_scheduling_daily_attendance_timeline',
    category: 'scheduling',
    groupBy: ['date'],
    valueFields: ['recordCount'],
    chartTypes: TREND_CHARTS,
  },
  {
    value: 'schedulingWorkflowByStatus',
    labelKey: 'ds_scheduling_workflow_by_status',
    category: 'scheduling',
    groupBy: ['status'],
    valueFields: ['documentCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingWorkflowByType',
    labelKey: 'ds_scheduling_workflow_by_type',
    category: 'scheduling',
    groupBy: ['workflowType'],
    valueFields: ['documentCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingWorkflowByProgram',
    labelKey: 'ds_scheduling_workflow_by_program',
    category: 'scheduling',
    groupBy: ['program'],
    valueFields: ['documentCount'],
    chartTypes: BREAKDOWN_CHARTS,
  },
  {
    value: 'schedulingWorkflowTimeline',
    labelKey: 'ds_scheduling_workflow_timeline',
    category: 'scheduling',
    groupBy: ['date'],
    valueFields: ['documentCount'],
    chartTypes: TREND_CHARTS,
  },
];

export const LIST_ALLOWED_SOURCES = [
  'activities,announcements,resources',
  'activities',
  'studentMarks',
  'quizzes',
  'quizSubmissions',
  'participations',
  'penalties',
  'behaviors',
  'users',
  'enrollments',
  'attendance',
  'schedulingTeachers',
  'schedulingCourses',
  'schedulingClasses',
  'schedulingSessions',
  'schedulingCalendar',
  'schedulingBreaks',
  'schedulingHolidays',
  'schedulingRooms',
  'schedulingInstructorAvailability',
  'schedulingRoomAvailability',
  'schedulingInstructorWorkload',
  'schedulingSessionTimeline',
  'schedulingAttendanceByStatus',
  'schedulingClassAttendanceByStatus',
  'schedulingDailyAttendanceByStatus',
  'schedulingAttendanceByProgram',
  'schedulingClassAttendanceByProgram',
  'schedulingDailyAttendanceByProgram',
  'schedulingAttendanceByInstructor',
  'schedulingClassAttendanceByClass',
  'schedulingAttendanceByType',
  'schedulingAttendanceTimeline',
  'schedulingClassAttendanceTimeline',
  'schedulingDailyAttendanceTimeline',
  'schedulingAttendanceRecords',
  'schedulingWorkflowByStatus',
  'schedulingWorkflowByType',
  'schedulingWorkflowByProgram',
  'schedulingWorkflowTimeline',
  'smartDriveFiles',
  'smartDriveShares',
  'workflowDocuments',
  'workflowTasks',
];

export function getSourcesForChartType(chartType, category = 'all') {
  let sources = DATA_SOURCES.filter((s) => !s.hiddenFromBuilder);

  sources = sources.filter((s) => {
    if (chartType === 'list') return LIST_ALLOWED_SOURCES.includes(s.value) && s.chartTypes?.includes('list');
    return s.chartTypes?.includes(chartType);
  });

  if (category && category !== 'all') {
    sources = sources.filter((s) => s.category === category);
  }

  return sources;
}

export function getSourceByValue(value) {
  return DATA_SOURCES.find((source) => source.value === value);
}

export function getCountMetricsForSource(value) {
  const source = getSourceByValue(value);
  return source?.countMetrics || source?.stats || [];
}

export function getCountMetric(sourceValue, metricValue) {
  const metrics = getCountMetricsForSource(sourceValue);
  return metrics.find((metric) => metric.value === metricValue)
    || metrics[0]
    || null;
}
