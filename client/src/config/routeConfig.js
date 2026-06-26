import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Route Configuration
 * 
 * Centralized route definitions with authentication and authorization requirements.
 * Maps each route to its screen ID for role-based access control.
 */

export const ROUTE_CONFIG = {
  // Public routes (no authentication required)
  PUBLIC: {
    qrCode: {
      path: '/qrcode/:studentId',
      requireAuth: false,
      screenId: null
    },
    login: {
      path: '/login',
      requireAuth: false,
      screenId: null
    }
  },

  // Main routes
  MAIN: {
    home: {
      path: '/',
      requireAuth: true,
      screenId: 'home',
      screenName: 'Home'
    },
    dashboard: {
      path: '/dashboard',
      requireAuth: true,
      screenId: 'dashboard',
      screenName: 'Dashboard'
    },
    studentDashboard: {
      path: '/student-dashboard',
      requireAuth: true,
      screenId: 'studentDashboard',
      screenName: 'Student Dashboard'
    },
    studentProfile: {
      path: '/student-profile',
      requireAuth: true,
      screenId: 'studentProfile',
      screenName: 'Student Profile'
    },
    activities: {
      path: '/activities',
      requireAuth: true,
      screenId: 'activities',
      screenName: 'Activities'
    },
    resources: {
      path: '/resources',
      requireAuth: true,
      screenId: 'resources',
      screenName: 'Resources'
    },
    activityDetail: {
      path: '/activity/:activityId',
      requireAuth: true,
      screenId: 'activities',
      screenName: 'Activity Details'
    }
  },

  // Quiz routes
  QUIZ: {
    quizzes: {
      path: '/quizzes',
      requireAuth: true,
      screenId: 'quizzes',
      screenName: 'Quizzes'
    },
    quizManagement: {
      path: '/quiz-management',
      requireAuth: true,
      screenId: 'quizManagement',
      screenName: 'Quiz Management'
    },
    quizBuilder: {
      path: '/quiz-builder',
      requireAuth: true,
      screenId: 'quizBuilder',
      screenName: 'Quiz Builder'
    },
    quizPreview: {
      path: '/quiz-preview/:quizId',
      requireAuth: true,
      screenId: 'quizzes',
      screenName: 'Quiz Preview'
    },
    studentQuiz: {
      path: '/quiz/:quizId',
      requireAuth: true,
      screenId: 'quizzes',
      screenName: 'Take Quiz'
    },
    reviewResults: {
      path: '/review-results',
      requireAuth: true,
      screenId: 'reviewResults',
      screenName: 'Review Results'
    }
  },

  // Class & Enrollment routes
  CLASSES: {
    classSchedules: {
      path: '/scheduling-calendar?tab=classes',
      requireAuth: true,
      screenId: 'classSchedules',
      screenName: 'Class Schedules'
    },
    manageEnrollments: {
      path: '/manage-enrollments',
      requireAuth: true,
      screenId: 'manageEnrollments',
      screenName: 'Manage Enrollments'
    },
    enrollments: {
      path: '/enrollments',
      requireAuth: true,
      screenId: 'enrollments',
      screenName: 'Enrollments'
    },
    myEnrollments: {
      path: '/my-enrollments',
      requireAuth: true,
      screenId: 'myEnrollments',
      screenName: 'My Enrollments'
    },
    programs: {
      path: '/programs',
      requireAuth: true,
      screenId: 'programs',
      screenName: 'Programs'
    },
    subjects: {
      path: '/subjects',
      requireAuth: true,
      screenId: 'subjects',
      screenName: 'Subjects'
    },
    marksEntry: {
      path: '/marks-entry',
      requireAuth: true,
      screenId: 'marksEntry',
      screenName: 'Marks Entry'
    },
    courseProgress: {
      path: '/course-progress/:courseId',
      requireAuth: true,
      screenId: 'courseProgress',
      screenName: 'Course Progress'
    }
  },

  // Flexible Scheduling routes
  FLEXIBLE_SCHEDULING: {
    summaryDashboard: {
      path: '/summary-dashboard',
      requireAuth: true,
      screenId: 'summaryDashboard',
      screenName: 'Summary Dashboard'
    },
    flexibleSchedule: {
      path: '/flexible-schedule',
      requireAuth: true,
      screenId: 'flexibleSchedule',
      screenName: 'Flexible Schedule'
    },
    instructorAvailability: {
      path: '/instructor-availability',
      requireAuth: true,
      screenId: 'instructorAvailability',
      screenName: 'Instructor Availability'
    },
    classroomAvailability: {
      path: '/classroom-availability',
      requireAuth: true,
      screenId: 'classroomAvailability',
      screenName: 'Classroom Availability'
    },
    userCategoryAccess: {
      path: '/user-category-access',
      requireAuth: true,
      screenId: 'userCategoryAccess',
      screenName: 'User Access'
    }
  },

  // Attendance & Operations routes
  ATTENDANCE: {
    attendance: {
      path: '/attendance',
      requireAuth: true,
      screenId: 'attendance',
      screenName: 'Attendance'
    },
    hrAttendance: {
      path: '/hr-attendance',
      requireAuth: true,
      screenId: 'hrAttendance',
      screenName: 'HR Attendance'
    },
    myAttendance: {
      path: '/my-attendance',
      requireAuth: true,
      screenId: 'myAttendance',
      screenName: 'My Attendance'
    },
    penalty: {
      path: '/penalty',
      requireAuth: true,
      screenId: 'penalty',
      screenName: 'Penalty'
    },
    participation: {
      path: '/participation',
      requireAuth: true,
      screenId: 'participation',
      screenName: 'Participation'
    },
    behavior: {
      path: '/behavior',
      requireAuth: true,
      screenId: 'behavior',
      screenName: 'Behavior'
    },
    qrScanner: {
      path: '/qr-scanner',
      requireAuth: true,
      screenId: 'attendance',
      screenName: 'QR Scanner'
    }
  },

  // Analytics routes
  ANALYTICS: {
    advancedAnalytics: {
      path: '/advanced-analytics',
      requireAuth: true,
      screenId: 'advancedAnalytics',
      screenName: 'Advanced Analytics'
    }
  },

  // Communication routes
  COMMUNICATION: {
    chat: {
      path: '/chat',
      requireAuth: true,
      screenId: 'chat',
      screenName: 'Chat'
    },
    notifications: {
      path: '/notifications',
      requireAuth: true,
      screenId: 'notifications',
      screenName: 'Notifications'
    },
    scheduledReports: {
      path: '/scheduled-reports',
      requireAuth: true,
      screenId: 'scheduledReports',
      screenName: 'Scheduled Reports'
    }
  },

  // Workflow routes
  WORKFLOW: {
    workflow: {
      path: '/workflow',
      requireAuth: true,
      screenId: 'workflow',
      screenName: 'Workflow'
    },
    drive: {
      path: '/drive',
      requireAuth: true,
      screenId: 'drive',
      screenName: 'Drive'
    },
    workflowInbox: {
      path: '/workflow/inbox',
      requireAuth: true,
      screenId: 'workflow',
      screenName: 'Workflow Inbox'
    },
    workflowDetail: {
      path: '/workflow/:documentId',
      requireAuth: true,
      screenId: 'workflow',
      screenName: 'Workflow Detail'
    },
    privateWorkspace: {
      path: '/workspace',
      requireAuth: true,
      screenId: 'workspace',
      screenName: 'Private Workspace'
    }
  },

  // Settings routes
  SETTINGS: {
    profile: {
      path: '/profile',
      requireAuth: true,
      screenId: 'profile',
      screenName: 'Profile Settings'
    },
    roleAccess: {
      path: '/role-access-pro',
      requireAuth: true,
      screenId: 'roleAccess',
      screenName: 'Role Access Management'
    }
  },

  // System routes
  SYSTEM: {
    unauthorized: {
      path: '/unauthorized',
      requireAuth: true,
      screenId: null
    }
  }
};

/**
 * Get route configuration by path
 * @param {string} path - Route path
 * @returns {Object|null} Route configuration or null if not found
 */
export const getRouteConfig = (path) => {
  for (const group of Object.values(ROUTE_CONFIG)) {
    for (const route of Object.values(group)) {
      if (route.path === path) {
        return route;
      }
    }
  }
  return null;
};

/**
 * Get all routes that require a specific screen permission
 * @param {string} screenId - Screen ID
 * @returns {Array} Array of route configurations
 */
export const getRoutesByScreenId = (screenId) => {
  const routes = [];
  for (const group of Object.values(ROUTE_CONFIG)) {
    for (const route of Object.values(group)) {
      if (route.screenId === screenId) {
        routes.push(route);
      }
    }
  }
  return routes;
};

/**
 * Check if a path requires authentication
 * @param {string} path - Route path
 * @returns {boolean} True if authentication is required
 */
export const requiresAuth = (path) => {
  const config = getRouteConfig(path);
  return config ? config.requireAuth : true; // Default to requiring auth
};

/**
 * Get all public routes
 * @returns {Array} Array of public route configurations
 */
export const getPublicRoutes = () => {
  return Object.values(ROUTE_CONFIG.PUBLIC);
};

/**
 * Get all protected routes
 * @returns {Array} Array of protected route configurations
 */
export const getProtectedRoutes = () => {
  const routes = [];
  for (const [groupKey, group] of Object.entries(ROUTE_CONFIG)) {
    if (groupKey !== 'PUBLIC' && groupKey !== 'SYSTEM') {
      routes.push(...Object.values(group));
    }
  }
  return routes;
};

export default ROUTE_CONFIG;
