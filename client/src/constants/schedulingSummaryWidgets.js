/**
 * Default widget layout for the scheduling summary dashboard.
 * Persisted per-user via DashboardEngine storageKey: scheduling_summary_{uid}
 */

export const SCHEDULING_SUMMARY_STORAGE_KEY = 'scheduling_summary';

const countWidget = (id, statKey, titleKey, layout) => ({
  id,
  titleKey,
  title: titleKey,
  chartType: 'count',
  dataSource: 'schedulingOverviewStats',
  statKey,
  groupBy: '',
  aggregation: 'count',
  dateRange: 'current',
  filters: [],
  layout,
});

export const SCHEDULING_SUMMARY_DEFAULT_WIDGETS = [
  // Row 1 — org structure counts
  countWidget('sched_cnt_programs', 'totalPrograms', 'stats_total_programs', { x: 0, y: 0, w: 3, h: 3 }),
  countWidget('sched_cnt_subjects', 'totalSubjects', 'stats_total_subjects', { x: 3, y: 0, w: 3, h: 3 }),
  countWidget('sched_cnt_classes', 'totalClasses', 'stats_total_classes', { x: 6, y: 0, w: 3, h: 3 }),
  countWidget('sched_cnt_sessions', 'totalSessions', 'total_sessions', { x: 9, y: 0, w: 3, h: 3 }),

  // Row 2 — session status counts
  countWidget('sched_cnt_scheduled', 'scheduledCount', 'stats_scheduled_sessions', { x: 0, y: 3, w: 3, h: 3 }),
  countWidget('sched_cnt_in_progress', 'inProgressCount', 'stats_in_progress_sessions', { x: 3, y: 3, w: 3, h: 3 }),
  countWidget('sched_cnt_completed', 'completedCount', 'stats_completed_sessions', { x: 6, y: 3, w: 3, h: 3 }),
  countWidget('sched_cnt_cancelled', 'cancelledCount', 'stats_cancelled_sessions', { x: 9, y: 3, w: 3, h: 3 }),

  // Row 3 — rooms, instructors, week, hours
  countWidget('sched_cnt_rooms_used', 'uniqueClassrooms', 'stats_rooms_in_use', { x: 0, y: 6, w: 3, h: 3 }),
  countWidget('sched_cnt_instructors', 'uniqueInstructors', 'stats_instructors_active', { x: 3, y: 6, w: 3, h: 3 }),
  countWidget('sched_cnt_this_week', 'thisWeekSessions', 'stats_this_week_sessions', { x: 6, y: 6, w: 3, h: 3 }),
  countWidget('sched_cnt_hours', 'teachingHours', 'stats_teaching_hours', { x: 9, y: 6, w: 3, h: 3 }),

  // Charts & tables
  {
    id: 'sched_teacher_load',
    titleKey: 'widget_teacher_load',
    title: 'Teacher Load',
    chartType: 'bar',
    dataSource: 'schedulingTeachers',
    groupBy: 'instructorName',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 9, w: 6, h: 5 },
  },
  {
    id: 'sched_subject_dist',
    titleKey: 'widget_subject_distribution',
    title: 'Subject Distribution',
    chartType: 'pie',
    dataSource: 'schedulingSessions',
    groupBy: 'subjectName',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 9, w: 6, h: 5 },
  },
  {
    id: 'sched_session_status',
    titleKey: 'widget_session_status',
    title: 'Sessions by Status',
    chartType: 'donut',
    dataSource: 'schedulingSessions',
    groupBy: 'status',
    aggregation: 'sum',
    valueField: 'sessionCount',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 14, w: 6, h: 5 },
  },
  {
    id: 'sched_teacher_table',
    titleKey: 'widget_teacher_effort',
    title: 'Teacher Effort Report',
    chartType: 'list',
    dataSource: 'schedulingTeachers',
    groupBy: 'instructorName',
    aggregation: 'count',
    dateRange: 'current',
    filters: [],
    layout: { x: 6, y: 14, w: 6, h: 5 },
  },
  {
    id: 'sched_courses_table',
    titleKey: 'widget_courses',
    title: 'Courses',
    chartType: 'list',
    dataSource: 'schedulingCourses',
    groupBy: 'courseLabel',
    aggregation: 'count',
    dateRange: 'current',
    filters: [],
    layout: { x: 0, y: 19, w: 12, h: 5 },
  },
];

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
      year: row.class?.year,
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
    type: 'session',
  }));

  const subjectSessions = (dashboardData?.subjectSessions || []).map((s) => ({
    subjectName: isRTL ? s.subjectNameAr : s.subjectNameEn,
    sessionCount: s.sessionCount ?? 0,
    type: 'subject',
  }));

  for (const ss of subjectSessions) {
    if (ss.sessionCount > 0) {
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

  return {
    schedulingOverviewStats,
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
  };
}
