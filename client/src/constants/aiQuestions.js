/**
 * AI Quick-Questions Catalog
 *
 * Curated, bilingual list of predefined questions for the AI assistant.
 * Used by both the frontend autocomplete and the backend quick-query endpoint.
 */

function q(id, arLabel, enLabel, arQuery, enQuery, tool, params = {}, options = {}) {
  return {
    id,
    arLabel,
    enLabel,
    arQuery,
    enQuery,
    tool,
    params,
    category: options.category || 'general',
    adminOnly: !!options.adminOnly,
    scope: options.scope || 'global',
  };
}

function dateRangeQuestions(tool, arBase, enBase, arQ, enQ, ranges, options = {}) {
  return ranges.map(([key, ar, en]) =>
    q(
      `${tool}-${key}`,
      `${arBase} (${ar})`,
      `${enBase} (${en})`,
      `${arQ} ${ar}؟`,
      `${enQ} ${en}?`,
      tool,
      { dateRange: key },
      options,
    ),
  );
}

const DATE_RANGES = [
  ['today', 'اليوم', 'today'],
  ['this_week', 'هذا الأسبوع', 'this week'],
  ['last_week', 'الأسبوع الماضي', 'last week'],
  ['this_month', 'هذا الشهر', 'this month'],
  ['last_month', 'الشهر الماضي', 'last month'],
];

const STANDUP_RANGES = [
  ['today', 'اليوم', 'today'],
  ['this_week', 'هذا الأسبوع', 'this week'],
  ['this_month', 'هذا الشهر', 'this month'],
];

export const AI_QUESTION_CATEGORIES = {
  attendance: { ar: 'الحضور والغياب', en: 'Attendance & Absence' },
  warnings: { ar: 'إنذارات الغياب', en: 'Absence Warnings' },
  students: { ar: 'الطلاب والتسجيل', en: 'Students & Enrollment' },
  classes: { ar: 'الفصول والبرامج', en: 'Classes & Programs' },
  marks: { ar: 'الدرجات', en: 'Marks' },
  schedule: { ar: 'الجدول والجلسات', en: 'Schedule & Sessions' },
  conduct: { ar: 'السلوك والعقوبات', en: 'Conduct & Penalties' },
  workflow: { ar: 'سير العمل والملاحظات', en: 'Workflows & Notes' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const AI_QUESTIONS = [
  // Attendance / absence
  ...dateRangeQuestions(
    'attendanceSummary',
    'إحصائيات الحضور والغياب',
    'Attendance summary',
    'كم عدد الغيابات',
    'How many absences',
    DATE_RANGES,
    { category: 'attendance' },
  ),

  // Warnings
  q(
    'warnings-all',
    'إنذارات الغياب (الكل)',
    'All absence warnings',
    'كم عدد إنذارات الغياب؟',
    'How many absence warnings?',
    'absenceWarningCounts',
    { warningType: 'all' },
    { category: 'warnings' },
  ),
  q(
    'warnings-first',
    'إنذارات الغياب الأولى',
    'First warnings',
    'كم عدد إنذارات الغياب الأولى؟',
    'How many first absence warnings?',
    'absenceWarningCounts',
    { warningType: 'first' },
    { category: 'warnings' },
  ),
  q(
    'warnings-final',
    'إنذارات الغياب النهائية',
    'Final warnings',
    'كم عدد إنذارات الغياب النهائية؟',
    'How many final absence warnings?',
    'absenceWarningCounts',
    { warningType: 'final' },
    { category: 'warnings' },
  ),

  // Late / human cases (admin only)
  ...dateRangeQuestions(
    'lateCount',
    'سجلات التأخير',
    'Late records',
    'كم عدد حالات التأخير',
    'How many late records',
    DATE_RANGES,
    { category: 'attendance', adminOnly: true },
  ),
  ...dateRangeQuestions(
    'humanCaseCount',
    'الحالات الإنسانية',
    'Human cases',
    'كم عدد الحالات الإنسانية',
    'How many human cases',
    DATE_RANGES,
    { category: 'attendance' },
  ),

  // Top absence
  q(
    'top-absence-this-month',
    'أكثر الطلاب غياباً (هذا الشهر)',
    'Top absent students (this month)',
    'من أكثر الطلاب غياباً هذا الشهر؟',
    'Which students have the most absences this month?',
    'topAbsenceStudent',
    { dateRange: 'this_month' },
    { category: 'attendance' },
  ),
  q(
    'top-absence-last-month',
    'أكثر الطلاب غياباً (الشهر الماضي)',
    'Top absent students (last month)',
    'من أكثر الطلاب غياباً الشهر الماضي؟',
    'Which students had the most absences last month?',
    'topAbsenceStudent',
    { dateRange: 'last_month' },
    { category: 'attendance' },
  ),

  // Standup
  ...dateRangeQuestions(
    'standupAttendance',
    'حضور الطابور',
    'Standup attendance',
    'كم عدد حضور الطابور',
    'How many standup attendance records',
    STANDUP_RANGES,
    { category: 'attendance' },
  ),

  // Attendance types
  q(
    'attendance-types',
    'أنواع الحضور',
    'Attendance types',
    'ما هي أنواع الحضور المتاحة؟',
    'What are the available attendance types?',
    'attendanceTypes',
    { dateRange: 'this_month' },
    { category: 'attendance' },
  ),

  // Students / enrollment
  q(
    'student-count',
    'عدد الطلاب المسجلين',
    'Enrolled student count',
    'كم عدد الطلاب المسجلين؟',
    'How many students are enrolled?',
    'studentCount',
    {},
    { category: 'students' },
  ),
  q(
    'enrollment-status',
    'حالة التسجيلات',
    'Enrollment status',
    'ما هي حالة التسجيلات؟',
    'What is the enrollment status?',
    'enrollmentInfo',
    {},
    { category: 'students' },
  ),

  // Classes / programs / subjects
  q(
    'class-count',
    'عدد الفصول',
    'Class count',
    'كم عدد الفصول؟',
    'How many classes are there?',
    'classCount',
    {},
    { category: 'classes' },
  ),
  q(
    'class-list',
    'قائمة الفصول',
    'Class list',
    'ما هي قائمة الفصول؟',
    'What is the list of classes?',
    'classCount',
    { list: true },
    { category: 'classes' },
  ),
  q(
    'program-list',
    'البرامج المتوفرة',
    'Available programs',
    'ما هي البرامج المتوفرة؟',
    'What programs are available?',
    'programInfo',
    {},
    { category: 'classes' },
  ),
  q(
    'subject-list',
    'المواد المتوفرة',
    'Available subjects',
    'ما هي المواد المتوفرة؟',
    'What subjects are available?',
    'subjectInfo',
    {},
    { category: 'classes' },
  ),
  q(
    'classroom-list',
    'القاعات المتوفرة',
    'Available classrooms',
    'ما هي القاعات المتوفرة؟',
    'What classrooms are available?',
    'classroomInfo',
    {},
    { category: 'classes' },
  ),

  // Marks
  q(
    'marks-summary',
    'ملخص الدرجات',
    'Marks summary',
    'ما ملخص الدرجات؟',
    'What is the marks summary?',
    'marksSummary',
    {},
    { category: 'marks' },
  ),
  q(
    'marks-distribution',
    'توزيع الدرجات',
    'Marks distribution',
    'ما هو توزيع الدرجات؟',
    'What is the marks distribution?',
    'marksDistribution',
    {},
    { category: 'marks' },
  ),

  // Schedule / sessions
  ...dateRangeQuestions(
    'scheduleSummary',
    'جدول المحاضرات',
    'Class schedule',
    'ما هو جدول المحاضرات',
    'What is the class schedule',
    DATE_RANGES,
    { category: 'schedule' },
  ),
  ...dateRangeQuestions(
    'sessionSummary',
    'ملخص الجلسات',
    'Sessions summary',
    'كم عدد الجلسات',
    'How many sessions',
    DATE_RANGES,
    { category: 'schedule' },
  ),

  // Conduct
  q(
    'penalty-summary',
    'ملخص العقوبات',
    'Penalty summary',
    'ما ملخص العقوبات؟',
    'What is the penalty summary?',
    'penaltySummary',
    {},
    { category: 'conduct' },
  ),
  q(
    'behavior-summary',
    'ملخص السلوكيات',
    'Behavior summary',
    'ما ملخص السلوكيات؟',
    'What is the behavior summary?',
    'behaviorSummary',
    {},
    { category: 'conduct' },
  ),
  q(
    'participation-summary',
    'ملخص المشاركات',
    'Participation summary',
    'ما ملخص المشاركات؟',
    'What is the participation summary?',
    'participationSummary',
    {},
    { category: 'conduct' },
  ),

  // Workflow / notes
  q(
    'workflow-summary',
    'ملخص معاملات سير العمل',
    'Workflow summary',
    'ما ملخص معاملات سير العمل؟',
    'What is the workflow summary?',
    'workflowSummary',
    {},
    { category: 'workflow' },
  ),
  ...dateRangeQuestions(
    'notesAndComments',
    'الملاحظات والتعليقات',
    'Notes and comments',
    'ما هي أحدث الملاحظات',
    'What are the latest notes',
    DATE_RANGES,
    { category: 'workflow', adminOnly: true },
  ),

  // Other
  q(
    'activity-list',
    'الأنشطة',
    'Activities',
    'ما هي الأنشطة؟',
    'What are the activities?',
    'activityInfo',
    {},
    { category: 'other' },
  ),
  q(
    'announcement-list',
    'أحدث الإعلانات',
    'Latest announcements',
    'ما هي أحدث الإعلانات؟',
    'What are the latest announcements?',
    'announcementInfo',
    {},
    { category: 'other' },
  ),
  q(
    'quiz-summary',
    'ملخص الاختبارات',
    'Quiz summary',
    'ما ملخص الاختبارات؟',
    'What is the quiz summary?',
    'quizSummary',
    {},
    { category: 'other' },
  ),
  q(
    'submission-summary',
    'ملخص التسليمات',
    'Submission summary',
    'ما ملخص التسليمات؟',
    'What is the submission summary?',
    'submissionSummary',
    {},
    { category: 'other' },
  ),
  q(
    'holiday-list',
    'الإجازات القادمة',
    'Upcoming holidays',
    'ما هي الإجازات القادمة؟',
    'What are the upcoming holidays?',
    'holidayInfo',
    {},
    { category: 'other' },
  ),
  q(
    'break-sessions',
    'أوقات الاستراحة',
    'Break sessions',
    'ما هي أوقات الاستراحة؟',
    'What are the break sessions?',
    'breakSessionSummary',
    {},
    { category: 'other' },
  ),
  q(
    'academic-closures',
    'الإغلاقات الأكاديمية',
    'Academic closures',
    'ما هي الإغلاقات الأكاديمية؟',
    'What are the academic closures?',
    'academicClosureInfo',
    {},
    { category: 'other' },
  ),
  q(
    'export-history',
    'سجل التصدير',
    'Export history',
    'ما هو سجل التصدير؟',
    'What is the export history?',
    'exportHistory',
    {},
    { category: 'other' },
  ),
];

export function getQuestionById(id) {
  return AI_QUESTIONS.find((question) => question.id === id) || null;
}

export function isQuestionAllowed(question, user = {}) {
  if (!question?.adminOnly) return true;
  return !!(user?.isAdmin || user?.isSuperAdmin);
}

export function filterAiQuestions(questions, user) {
  return questions.filter((question) => isQuestionAllowed(question, user));
}

export function getQuestionLabel(question, lang = 'ar') {
  return lang === 'en' ? question?.enLabel || question?.arLabel : question?.arLabel || question?.enLabel;
}

export function getQuestionQuery(question, lang = 'ar') {
  return lang === 'en' ? question?.enQuery || question?.arQuery : question?.arQuery || question?.enQuery;
}
