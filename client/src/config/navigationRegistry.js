/**
 * Canonical navigation → permission screen mapping.
 * Single source for menu items, route guards, and permission matrix sync.
 */

/** @typedef {{ screenId: string, nameEn: string, nameAr: string, descriptionEn?: string, descriptionAr?: string, category: string, operations?: string[] }} PermissionScreenDef */

/** Dashboard hash tab → matrix screenId */
export const DASHBOARD_TAB_SCREEN_IDS = {
  activities: 'activities',
  announcements: 'announcements',
  resources: 'resources',
  programs: 'programs',
  subjects: 'subjects',
  classes: 'classes',
  enrollments: 'enrollments',
  'manage-enrollments': 'manage-enrollments',
  marks: 'marks-entry',
  penalty: 'penalty',
  participation: 'participation',
  behavior: 'behavior',
  users: 'users',
  'user-category-access': 'user-category-access',
  emailTemplates: 'email-templates',
  notificationLogs: 'notification-logs',
  'scheduled-reports': 'scheduled-reports',
  categories: 'categories',
  'summary-dashboard': 'summary-dashboard',
  'scheduling-calendar': 'scheduling-calendar',
  'instructor-availability': 'instructor-availability-setup',
  'classroom-availability': 'room-availability-setup',
  'classrooms-management': 'rooms-management',
  'activity-types': 'activity-types',
  'behavior-types': 'behavior-types',
  'participation-types': 'participation-types',
  'penalty-types': 'penalty-types',
  'resource-types': 'resource-types',
  'priority-types': 'priority-types',
  'user-roles': 'user-roles',
  'subject-types': 'subject-types',
  'assessment-types': 'assessment-types',
  'question-types': 'question-types',
  'attendance-status-types': 'attendance-status-types',
  'enrollment-status-types': 'enrollment-status-types',
};

const REVIEW_ACTIVITY_SCREEN = {
  quiz: 'quiz-results',
  homework: 'homework-results',
  training: 'training-results',
  lab_work: 'lab-results',
};

/** Route guard / legacy camelCase screenId → permission matrix screenId */
export const LEGACY_ROUTE_SCREEN_ALIASES = {
  summaryDashboard: 'summary-dashboard',
  schedulingCalendar: 'scheduling-calendar',
  instructorAvailability: 'instructor-availability-setup',
  classroomAvailability: 'room-availability-setup',
  userCategoryAccess: 'user-category-access',
  studentDashboard: 'student-dashboard',
  studentProfile: 'student-profile',
  hrAttendance: 'hr-attendance',
  manageEnrollments: 'manage-enrollments',
  marksEntry: 'marks-entry',
  advancedAnalytics: 'advanced-analytics',
  scheduledReports: 'scheduled-reports',
  qrScanner: 'qr-scanner',
  reviewResults: 'quiz-results',
  'review-results': 'quiz-results',
  classSchedules: 'scheduling-calendar',
  myEnrollments: 'enrollments',
  permissionMatrix: 'permission-matrix',
  emailTemplates: 'email-templates',
  notificationLogs: 'notification-logs',
};

export function resolveMatrixScreenId(screenId) {
  if (!screenId) return screenId;
  return LEGACY_ROUTE_SCREEN_ALIASES[screenId] || screenId;
}

const PATH_ALIASES = {
  '': 'home',
  home: 'home',
  'smart-drive': 'drive',
  timer: 'timer',
  'my-enrollments': 'enrollments',
  'manage-enrollments': 'manage-enrollments',
  'marks-entry': 'marks-entry',
  'review-results': 'quiz-results',
  'qr-scanner': 'qr-scanner',
  'hr-attendance': 'hr-attendance',
  'student-dashboard': 'student-dashboard',
  'student-profile': 'student-profile',
  'permission-matrix': 'permission-matrix',
  'summary-dashboard': 'summary-dashboard',
  'scheduling-calendar': 'scheduling-calendar',
  'instructor-availability': 'instructor-availability-setup',
  'classroom-availability': 'room-availability-setup',
  'advanced-analytics': 'advanced-analytics',
  chat: 'chat',
  notifications: 'notifications',
  profile: 'profile',
  attendance: 'attendance',
  workflow: 'workflow',
  'workflow/inbox': 'workflow',
};

/**
 * Resolve matrix screenId from navigation target.
 * @param {{ path?: string, hash?: string, search?: string, screenId?: string }} target
 */
export function resolveScreenIdFromNavItem(target = {}) {
  if (target.screenId) return target.screenId;

  const rawPath = target.path || '';
  const stripped = rawPath.replace(/^\/+/, '');
  const qIndex = stripped.indexOf('?');
  const path = qIndex >= 0 ? stripped.slice(0, qIndex) : stripped;
  const inlineSearch = qIndex >= 0 ? stripped.slice(qIndex) : '';
  const hash = (target.hash || '').replace(/^#/, '');
  const search = target.search || inlineSearch || '';

  if (!path && search) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const mode = params.get('mode');
    if (mode === 'activities') return 'activities';
    if (mode === 'resources') return 'resources';
  }

  if (path === 'dashboard' && hash) {
    return DASHBOARD_TAB_SCREEN_IDS[hash] || 'dashboard';
  }

  if (path === 'scheduling-calendar') {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const tab = params.get('tab');
    const scope = params.get('scope');
    if (tab === 'classes') return 'classes-availability';
    if (tab === 'availability' && scope === 'room') return 'room-availability-view';
    if (tab === 'availability') return 'instructor-availability-view';
    return 'scheduling-calendar';
  }

  if (path === 'review-results') {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const activityType = params.get('activityType');
    return REVIEW_ACTIVITY_SCREEN[activityType] || 'quiz-results';
  }

  const firstSegment = path.split('/')[0];
  if (PATH_ALIASES[firstSegment]) return PATH_ALIASES[firstSegment];
  if (PATH_ALIASES[path]) return PATH_ALIASES[path];

  return firstSegment || 'home';
}

/** Legacy + menu screens (every SideDrawer / dashboard tab entry) */
export const BASE_PERMISSION_SCREEN_DEFINITIONS = [
  { screenId: 'home', nameEn: 'Home', nameAr: 'الرئيسية', category: 'general', operations: ['view'] },
  { screenId: 'dashboard', nameEn: 'Dashboard', nameAr: 'لوحة التحكم', category: 'admin', operations: ['view'] },
  { screenId: 'categories', nameEn: 'Categories', nameAr: 'الفئات', category: 'academic', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'student-dashboard', nameEn: 'Student Dashboard', nameAr: 'لوحة الطالب', category: 'student', operations: ['view'] },
  { screenId: 'student-profile', nameEn: 'Student Profile', nameAr: 'ملف الطالب', category: 'student', operations: ['view', 'update'] },
  { screenId: 'activities', nameEn: 'Activities', nameAr: 'الأنشطة', category: 'academic', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'resources', nameEn: 'Resources', nameAr: 'الموارد', category: 'academic', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'quizzes', nameEn: 'Quizzes', nameAr: 'الاختبارات', category: 'academic', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'attendance', nameEn: 'Attendance', nameAr: 'الحضور', category: 'operations', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'hr-attendance', nameEn: 'HR Attendance', nameAr: 'حضور الموارد البشرية', category: 'operations', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'qr-scanner', nameEn: 'QR Scanner (Daily Scan)', nameAr: 'المسح اليومي', category: 'operations', operations: [] },
  { screenId: 'penalty', nameEn: 'Penalty', nameAr: 'العقوبات', category: 'operations', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'participation', nameEn: 'Participation', nameAr: 'المشاركة', category: 'operations', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'behavior', nameEn: 'Behavior', nameAr: 'السلوك', category: 'operations', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'enrollments', nameEn: 'Enrollments', nameAr: 'التسجيلات', category: 'academic', operations: ['view'] },
  { screenId: 'manage-enrollments', nameEn: 'Manage Enrollments', nameAr: 'إدارة التسجيلات', category: 'academic', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'programs', nameEn: 'Programs', nameAr: 'البرامج', category: 'academic', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'subjects', nameEn: 'Subjects', nameAr: 'المواد', category: 'academic', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'marks-entry', nameEn: 'Marks Entry', nameAr: 'إدخال الدرجات', category: 'academic', operations: ['view', 'update'] },
  { screenId: 'quiz-results', nameEn: 'Quiz Results', nameAr: 'نتائج الاختبارات', category: 'reports', operations: ['view', 'export'] },
  { screenId: 'homework-results', nameEn: 'Homework Results', nameAr: 'نتائج الواجبات', category: 'reports', operations: ['view', 'export'] },
  { screenId: 'training-results', nameEn: 'Training Results', nameAr: 'نتائج التدريب', category: 'reports', operations: ['view', 'export'] },
  { screenId: 'lab-results', nameEn: 'Lab Results', nameAr: 'نتائج المختبر', category: 'reports', operations: ['view', 'export'] },
  { screenId: 'analytics', nameEn: 'Analytics', nameAr: 'التحليلات', category: 'reports', operations: ['view'] },
  { screenId: 'advanced-analytics', nameEn: 'Advanced Analytics', nameAr: 'التحليلات المتقدمة', category: 'reports', operations: ['view'] },
  { screenId: 'chat', nameEn: 'Chat', nameAr: 'المحادثة', category: 'communication', operations: ['view', 'create'] },
  { screenId: 'notifications', nameEn: 'Notifications', nameAr: 'الإشعارات', category: 'communication', operations: ['view', 'update'] },
  { screenId: 'scheduled-reports', nameEn: 'Scheduled Reports', nameAr: 'التقارير المجدولة', category: 'reports', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'workflow', nameEn: 'Workflow', nameAr: 'سير العمل', category: 'workflow', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'drive', nameEn: 'Smart Drive', nameAr: 'محرك الأقراص', category: 'tools', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'profile', nameEn: 'Profile Settings', nameAr: 'إعدادات الملف', category: 'general', operations: ['view', 'update'] },
  { screenId: 'permission-matrix', nameEn: 'Permission Matrix', nameAr: 'مصفوفة الصلاحيات', category: 'admin', operations: ['view', 'update'] },
  { screenId: 'timer', nameEn: 'Timer', nameAr: 'المؤقت', category: 'tools', operations: ['view'] },
];

/** QR scanner granular operations (daily attendance screen) */
export const QR_SCANNER_OPERATION_DEFINITIONS = [
  { operationKey: 'qr-scanner.canMarkAttendance', nameEn: 'Mark Attendance', nameAr: 'تسجيل الحضور', category: 'create' },
  { operationKey: 'qr-scanner.canUseQRScanner', nameEn: 'Use QR Scanner', nameAr: 'استخدام ماسح QR', category: 'create' },
  { operationKey: 'qr-scanner.canManualInput', nameEn: 'Manual Input', nameAr: 'إدخال يدوي', category: 'create' },
  { operationKey: 'qr-scanner.canEditAttendance', nameEn: 'Edit Attendance', nameAr: 'تعديل الحضور', category: 'update' },
  { operationKey: 'qr-scanner.canDeleteAttendance', nameEn: 'Delete Attendance', nameAr: 'حذف الحضور', category: 'delete' },
  { operationKey: 'qr-scanner.canClearToday', nameEn: 'Clear Today', nameAr: 'مسح اليوم', category: 'delete' },
  { operationKey: 'qr-scanner.canBulkScan', nameEn: 'Bulk Scan', nameAr: 'مسح جماعي', category: 'create' },
  { operationKey: 'qr-scanner.canUseStatsPanel', nameEn: 'Stats Panel', nameAr: 'لوحة الإحصائيات', category: 'view' },
  { operationKey: 'qr-scanner.canUseZapPanel', nameEn: 'Zap Panel', nameAr: 'لوحة Zap', category: 'view' },
  { operationKey: 'qr-scanner.canSeeStandupMode', nameEn: 'Standup Mode', nameAr: 'وضع الوقوف', category: 'view' },
  { operationKey: 'qr-scanner.canSeeQuickButtons', nameEn: 'Quick Buttons', nameAr: 'أزرار سريعة', category: 'view' },
  { operationKey: 'qr-scanner.canExport', nameEn: 'Export', nameAr: 'تصدير', category: 'view' },
  { operationKey: 'qr-scanner.canExportSummary', nameEn: 'Export Summary', nameAr: 'تصدير الملخص', category: 'view' },
];

/** Screens added/updated beyond legacy seed — synced by backend/scripts/sync-permission-screens.js */
export const PERMISSION_SCREEN_DEFINITIONS = [
  { screenId: 'summary-dashboard', nameEn: 'Summary Dashboard', nameAr: 'لوحة الملخص', category: 'scheduling', operations: ['view', 'export'] },
  { screenId: 'scheduling-calendar', nameEn: 'Scheduling Calendar', nameAr: 'جدول الجدولة', category: 'scheduling', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'classes-availability', nameEn: 'Classes Availability', nameAr: 'توفر الصفوف', category: 'scheduling', operations: ['view'] },
  { screenId: 'instructor-availability-view', nameEn: 'Instructor Availability (Calendar)', nameAr: 'توفر المدرب (التقويم)', category: 'scheduling', operations: ['view'] },
  { screenId: 'room-availability-view', nameEn: 'Room Availability (Calendar)', nameAr: 'توفر الغرفة (التقويم)', category: 'scheduling', operations: ['view'] },
  { screenId: 'instructor-availability-setup', nameEn: 'Instructor Availability Setup', nameAr: 'إعداد توفر المدرب', category: 'scheduling', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'room-availability-setup', nameEn: 'Room Availability Setup', nameAr: 'إعداد توفر الغرفة', category: 'scheduling', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'rooms-management', nameEn: 'Rooms Management', nameAr: 'إدارة الغرف', category: 'scheduling', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'user-category-access', nameEn: 'User Category Access', nameAr: 'وصول المستخدم للفئة', category: 'admin', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'announcements', nameEn: 'Announcements', nameAr: 'الإعلانات', category: 'communication', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'users', nameEn: 'Users', nameAr: 'المستخدمون', category: 'admin', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'classes', nameEn: 'Classes', nameAr: 'الفصول', category: 'academic', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'email-templates', nameEn: 'Email Templates', nameAr: 'قوالب البريد', category: 'communication', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'notification-logs', nameEn: 'Notification Logs', nameAr: 'سجلات الإشعارات', category: 'communication', operations: ['view'] },
  { screenId: 'activity-types', nameEn: 'Activity Types', nameAr: 'أنواع الأنشطة', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'behavior-types', nameEn: 'Behavior Types', nameAr: 'أنواع السلوك', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'participation-types', nameEn: 'Participation Types', nameAr: 'أنواع المشاركة', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'penalty-types', nameEn: 'Penalty Types', nameAr: 'أنواع العقوبات', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'resource-types', nameEn: 'Resource Types', nameAr: 'أنواع الموارد', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'priority-types', nameEn: 'Priority Types', nameAr: 'أنواع الأولويات', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'user-roles', nameEn: 'User Roles', nameAr: 'أدوار المستخدمين', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'subject-types', nameEn: 'Subject Types', nameAr: 'أنواع المواد', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'assessment-types', nameEn: 'Assessment Types', nameAr: 'أنواع التقييمات', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'question-types', nameEn: 'Question Types', nameAr: 'أنواع الأسئلة', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'attendance-status-types', nameEn: 'Attendance Status Types', nameAr: 'حالة الحضور', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'enrollment-status-types', nameEn: 'Enrollment Status Types', nameAr: 'حالة التسجيل', category: 'settings', operations: ['view', 'create', 'update', 'delete'] },
  { screenId: 'my-attendance', nameEn: 'My Attendance', nameAr: 'حضوري', category: 'student', operations: ['view'] },
];

/** Merged list for matrix sync (menu + dashboard tabs, deduped by screenId) */
export function getAllSyncScreenDefinitions() {
  const byId = new Map();
  [...BASE_PERMISSION_SCREEN_DEFINITIONS, ...PERMISSION_SCREEN_DEFINITIONS].forEach((def) => {
    byId.set(def.screenId, { ...byId.get(def.screenId), ...def });
  });
  return [...byId.values()];
}

const GENERIC_OPERATION_META = {
  view: { nameEn: 'View', nameAr: 'عرض', category: 'view' },
  create: { nameEn: 'Create', nameAr: 'إنشاء', category: 'create' },
  update: { nameEn: 'Update', nameAr: 'تحديث', category: 'update' },
  delete: { nameEn: 'Delete', nameAr: 'حذف', category: 'delete' },
  export: { nameEn: 'Export', nameAr: 'تصدير', category: 'view' },
};

export function buildOperationKey(screenId, operation) {
  const op = operation.toLowerCase();
  if (op === 'export') return `${screenId}.canExport`;
  return `${screenId}.can${op.charAt(0).toUpperCase()}${op.slice(1)}`;
}

export function getOperationDefsForScreen(screenId, operations = ['view', 'create', 'update', 'delete']) {
  return operations.map((op) => {
    const meta = GENERIC_OPERATION_META[op] || GENERIC_OPERATION_META.view;
    return {
      operationKey: buildOperationKey(screenId, op),
      nameEn: meta.nameEn,
      nameAr: meta.nameAr,
      descriptionEn: `${meta.nameEn} on ${screenId}`,
      descriptionAr: `${meta.nameAr} — ${screenId}`,
      category: meta.category,
    };
  });
}

export default {
  DASHBOARD_TAB_SCREEN_IDS,
  LEGACY_ROUTE_SCREEN_ALIASES,
  BASE_PERMISSION_SCREEN_DEFINITIONS,
  PERMISSION_SCREEN_DEFINITIONS,
  QR_SCANNER_OPERATION_DEFINITIONS,
  getAllSyncScreenDefinitions,
  resolveScreenIdFromNavItem,
  resolveMatrixScreenId,
  getOperationDefsForScreen,
  buildOperationKey,
};
