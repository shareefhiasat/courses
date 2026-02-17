/**
 * Route to Screen Mapping
 * 
 * Maps route paths to their corresponding screen IDs and provides
 * additional metadata for the RoleAccessPro UI
 */

export const ROUTE_TO_SCREEN_MAP = {
  // Main Routes
  '/': {
    screenId: 'home',
    path: '/',
    category: 'main',
    icon: 'home'
  },
  '/dashboard': {
    screenId: 'dashboard',
    path: '/dashboard',
    category: 'main',
    icon: 'layout_dashboard'
  },
  '/student-dashboard': {
    screenId: 'studentDashboard',
    path: '/student-dashboard',
    category: 'main',
    icon: 'graduation_cap'
  },
  '/student-profile': {
    screenId: 'studentProfile',
    path: '/student-profile',
    category: 'main',
    icon: 'user'
  },
  '/activity/:activityId': {
    screenId: 'activities',
    path: '/activity/:activityId',
    category: 'main',
    icon: 'activity'
  },
  
  // Quiz Routes
  '/quizzes': {
    screenId: 'quizzes',
    path: '/quizzes',
    category: 'quiz',
    icon: 'clipboard_list'
  },
  '/quiz-preview/:quizId': {
    screenId: 'quizManagement',
    path: '/quiz-preview/:quizId',
    category: 'quiz',
    icon: 'eye'
  },
  '/quiz/:quizId': {
    screenId: 'quizzes',
    path: '/quiz/:quizId',
    category: 'quiz',
    icon: 'clipboard_check'
  },
  '/review-results': {
    screenId: 'reviewResults',
    path: '/review-results',
    category: 'quiz',
    icon: 'chart_bar'
  },
  
  // Class & Enrollment Routes
  '/schedule-overview': {
    screenId: 'classSchedules',
    path: '/schedule-overview',
    category: 'classes',
    icon: 'calendar'
  },
  '/manage-enrollments': {
    screenId: 'manageEnrollments',
    path: '/manage-enrollments',
    category: 'classes',
    icon: 'users_cog'
  },
  '/enrollments': {
    screenId: 'enrollments',
    path: '/enrollments',
    category: 'classes',
    icon: 'user_plus'
  },
  '/programs': {
    screenId: 'programs',
    path: '/programs',
    category: 'classes',
    icon: 'book_open'
  },
  '/subjects': {
    screenId: 'subjects',
    path: '/subjects',
    category: 'classes',
    icon: 'book'
  },
  '/marks-entry': {
    screenId: 'marksEntry',
    path: '/marks-entry',
    category: 'classes',
    icon: 'edit'
  },
  
  // Attendance Routes
  '/attendance': {
    screenId: 'attendance',
    path: '/attendance',
    category: 'attendance',
    icon: 'clipboard_check'
  },
  '/hr-attendance': {
    screenId: 'hrAttendance',
    path: '/hr-attendance',
    category: 'attendance',
    icon: 'user_check'
  },
  '/penalty': {
    screenId: 'penalty',
    path: '/penalty',
    category: 'attendance',
    icon: 'alert_triangle'
  },
  '/participation': {
    screenId: 'participation',
    path: '/participation',
    category: 'attendance',
    icon: 'user_plus'
  },
  '/behavior': {
    screenId: 'behavior',
    path: '/behavior',
    category: 'attendance',
    icon: 'smile'
  },
  '/qr-scanner': {
    screenId: 'attendance',
    path: '/qr-scanner',
    category: 'attendance',
    icon: 'qr_code'
  },
  
  // Analytics Routes
  '/analytics': {
    screenId: 'analytics',
    path: '/analytics',
    category: 'analytics',
    icon: 'bar_chart'
  },
  '/advanced-analytics': {
    screenId: 'advancedAnalytics',
    path: '/advanced-analytics',
    category: 'analytics',
    icon: 'trending_up'
  },
  
  // Communication Routes
  '/chat': {
    screenId: 'chat',
    path: '/chat',
    category: 'communication',
    icon: 'message_circle'
  },
  '/notifications': {
    screenId: 'notifications',
    path: '/notifications',
    category: 'communication',
    icon: 'bell'
  },
  '/scheduled-reports': {
    screenId: 'scheduledReports',
    path: '/scheduled-reports',
    category: 'communication',
    icon: 'file_text'
  },
  
  // Settings Routes
  '/profile': {
    screenId: 'profile',
    path: '/profile',
    category: 'settings',
    icon: 'settings'
  },
  '/role-access-pro': {
    screenId: 'roleAccess',
    path: '/role-access-pro',
    category: 'settings',
    icon: 'shield'
  }
};

/**
 * Get all routes for a specific screen ID
 */
export const getRoutesByScreenId = (screenId) => {
  return Object.values(ROUTE_TO_SCREEN_MAP).filter(route => route.screenId === screenId);
};

/**
 * Get screen ID from route path
 */
export const getScreenIdFromPath = (path) => {
  const route = ROUTE_TO_SCREEN_MAP[path];
  return route ? route.screenId : null;
};

/**
 * Get all unique screen IDs
 */
export const getAllScreenIds = () => {
  const screenIds = new Set();
  Object.values(ROUTE_TO_SCREEN_MAP).forEach(route => {
    screenIds.add(route.screenId);
  });
  return Array.from(screenIds);
};

export default ROUTE_TO_SCREEN_MAP;
