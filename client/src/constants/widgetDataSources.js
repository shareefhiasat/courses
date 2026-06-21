/**
 * Central catalog for WidgetBuilder data sources.
 * Categories: academic | operations | scheduling | merged
 */

export const SOURCE_CATEGORIES = [
  { id: 'all', labelKey: 'widget_cat_all' },
  { id: 'academic', labelKey: 'widget_cat_academic' },
  { id: 'operations', labelKey: 'widget_cat_operations' },
  { id: 'scheduling', labelKey: 'widget_cat_scheduling' },
];

/** Metrics available for schedulingOverviewStats count widgets */
export const SCHEDULING_STAT_KEYS = [
  { value: 'totalPrograms', labelKey: 'stats_total_programs' },
  { value: 'totalSubjects', labelKey: 'stats_total_subjects' },
  { value: 'totalClasses', labelKey: 'stats_total_classes' },
  { value: 'totalSessions', labelKey: 'total_sessions' },
  { value: 'scheduledCount', labelKey: 'stats_scheduled_sessions' },
  { value: 'inProgressCount', labelKey: 'stats_in_progress_sessions' },
  { value: 'completedCount', labelKey: 'stats_completed_sessions' },
  { value: 'cancelledCount', labelKey: 'stats_cancelled_sessions' },
  { value: 'thisWeekSessions', labelKey: 'stats_this_week_sessions' },
  { value: 'uniqueClassrooms', labelKey: 'stats_rooms_in_use' },
  { value: 'totalClassrooms', labelKey: 'stats_total_rooms' },
  { value: 'uniqueInstructors', labelKey: 'stats_instructors_active' },
  { value: 'totalInstructors', labelKey: 'stats_total_instructors' },
  { value: 'teachingHours', labelKey: 'stats_teaching_hours' },
  { value: 'avgDuration', labelKey: 'stats_avg_session_duration' },
  { value: 'breakCount', labelKey: 'stats_break_sessions' },
  { value: 'holidayCount', labelKey: 'stats_upcoming_holidays' },
];

export const DATA_SOURCES = [
  // ── Merged ────────────────────────────────────────────────────────────────
  {
    value: 'activities,announcements,resources',
    labelKey: 'all_activities',
    label: 'Activities (merged)',
    category: 'merged',
    groupBy: ['classId', 'programId', 'subjectId', 'userId', 'createdBy', 'date', 'type'],
  },

  // ── Academic ──────────────────────────────────────────────────────────────
  { value: 'announcements', labelKey: 'announcements', category: 'academic', groupBy: ['classId', 'programId', 'userId', 'createdBy', 'date'] },
  { value: 'resources', labelKey: 'resources', category: 'academic', groupBy: ['classId', 'programId', 'subjectId', 'userId', 'createdBy', 'date'] },
  { value: 'enrollments', labelKey: 'enrollments', category: 'academic', groupBy: ['classId', 'programId', 'subjectId', 'createdBy', 'date'] },
  { value: 'classes', labelKey: 'classes', category: 'academic', groupBy: ['programId', 'term', 'year', 'createdBy'] },
  { value: 'programs', labelKey: 'programs', category: 'academic', groupBy: ['createdBy'] },
  { value: 'subjects', labelKey: 'subjects', category: 'academic', groupBy: ['programId', 'createdBy'] },

  // ── Operations ────────────────────────────────────────────────────────────
  { value: 'attendance', labelKey: 'attendance', category: 'operations', groupBy: ['attendanceType', 'classId', 'programId', 'studentId', 'createdBy', 'date', 'status'] },
  { value: 'users', labelKey: 'users', category: 'operations', groupBy: ['role', 'programId', 'createdBy', 'date'] },
  { value: 'penalties', labelKey: 'penalties', category: 'operations', groupBy: ['penaltyType', 'classId', 'userId', 'createdBy', 'date'] },
  { value: 'absences', labelKey: 'absences', category: 'operations', groupBy: ['absenceType', 'classId', 'userId', 'createdBy', 'date'] },
  { value: 'behaviors', labelKey: 'behaviors', category: 'operations', groupBy: ['classId', 'studentId', 'programId', 'subjectId', 'createdBy', 'date'] },
  { value: 'participations', labelKey: 'participations', category: 'operations', groupBy: ['classId', 'studentId', 'programId', 'subjectId', 'createdBy', 'date'] },
  { value: 'activityLogs', labelKey: 'activity_logs', category: 'operations', groupBy: ['userId', 'createdBy', 'date'] },

  // ── Scheduling ────────────────────────────────────────────────────────────
  {
    value: 'schedulingOverviewStats',
    labelKey: 'ds_scheduling_overview_stats',
    category: 'scheduling',
    groupBy: [],
    isStatSource: true,
    stats: SCHEDULING_STAT_KEYS,
    chartTypes: ['count'],
  },
  {
    value: 'schedulingSessions',
    labelKey: 'ds_scheduling_sessions',
    category: 'scheduling',
    groupBy: ['status', 'programName', 'subjectName', 'className', 'instructorName', 'roomName', 'date'],
    valueFields: ['sessionCount', 'teachingHours'],
  },
  {
    value: 'schedulingTeachers',
    labelKey: 'ds_scheduling_teachers',
    category: 'scheduling',
    groupBy: ['instructorName', 'primarySubject', 'status'],
    valueFields: ['sessionCount', 'teachingHours', 'subjectCount', 'classCount'],
  },
  {
    value: 'schedulingCourses',
    labelKey: 'ds_scheduling_courses',
    category: 'scheduling',
    groupBy: ['programName', 'subjectName', 'className', 'courseLabel', 'location'],
    valueFields: ['sessionCount', 'teachingHours'],
  },
  {
    value: 'schedulingClasses',
    labelKey: 'ds_scheduling_classes',
    category: 'scheduling',
    groupBy: ['programName', 'subjectName', 'className', 'term', 'year'],
    valueFields: ['sessionCount', 'teachingHours'],
  },
  {
    value: 'schedulingRooms',
    labelKey: 'ds_scheduling_rooms',
    category: 'scheduling',
    groupBy: ['roomName', 'status', 'usageType'],
    valueFields: ['sessionCount'],
  },
  {
    value: 'schedulingInstructorAvailability',
    labelKey: 'ds_scheduling_instructor_availability',
    category: 'scheduling',
    groupBy: ['status', 'instructorName', 'dayOfWeek'],
    valueFields: ['slotCount'],
  },
  {
    value: 'schedulingRoomAvailability',
    labelKey: 'ds_scheduling_room_availability',
    category: 'scheduling',
    groupBy: ['status', 'roomName', 'dayOfWeek'],
    valueFields: ['slotCount'],
  },
  {
    value: 'schedulingCalendar',
    labelKey: 'ds_scheduling_calendar',
    category: 'scheduling',
    groupBy: ['eventType', 'date', 'instructorName', 'roomName'],
    valueFields: ['sessionCount'],
  },
  {
    value: 'schedulingBreaks',
    labelKey: 'ds_scheduling_breaks',
    category: 'scheduling',
    groupBy: ['breakType', 'instructorName', 'date'],
  },
  {
    value: 'schedulingHolidays',
    labelKey: 'ds_scheduling_holidays',
    category: 'scheduling',
    groupBy: ['type', 'startDate'],
  },
];

export const LIST_ALLOWED_SOURCES = [
  'activities,announcements,resources',
  'activities',
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
];

export function getSourcesForChartType(chartType, category = 'all') {
  let sources = chartType === 'list'
    ? DATA_SOURCES.filter((s) => LIST_ALLOWED_SOURCES.includes(s.value))
    : DATA_SOURCES;

  if (category && category !== 'all') {
    sources = sources.filter((s) => s.category === category);
  }

  return sources;
}
