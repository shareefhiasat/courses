import { ROLE_STRINGS } from '@utils/userUtils';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Default widget configurations for each role and dashboard
 * These are used when no custom widgets are configured
 */
export const DEFAULT_WIDGET_CONFIGURATIONS = {
  // Student Dashboard - Overview Tab
  [`${ROLE_STRINGS.STUDENT}_overview`]: [
    {
      id: 'student_overview_1',
      title: 'Enrollment Status',
      chartType: 'count',
      dataSource: 'enrollments',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 0, w: 4, h: 3 }
    },
    {
      id: 'student_overview_2',
      title: 'Attendance Rate',
      chartType: 'pie',
      dataSource: 'attendance',
      groupBy: 'status',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 4, y: 0, w: 4, h: 3 }
    },
    {
      id: 'student_overview_3',
      title: 'Recent Marks',
      chartType: 'line',
      dataSource: 'marks',
      groupBy: 'date',
      aggregation: 'average',
      dateRange: 'last30',
      filters: [],
      layout: { x: 8, y: 0, w: 4, h: 3 }
    }
  ],

  // Student Dashboard - Performance Tab
  [`${ROLE_STRINGS.STUDENT}_performance`]: [
    {
      id: 'student_perf_1',
      title: 'Grade Distribution',
      chartType: 'bar',
      dataSource: 'marks',
      groupBy: 'subject',
      aggregation: 'average',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 0, w: 6, h: 4 }
    },
    {
      id: 'student_perf_2',
      title: 'Attendance Trend',
      chartType: 'line',
      dataSource: 'attendance',
      groupBy: 'date',
      aggregation: 'count',
      dateRange: 'last90',
      filters: [],
      layout: { x: 6, y: 0, w: 6, h: 4 }
    },
    {
      id: 'student_perf_3',
      title: 'Participation Score',
      chartType: 'gauge',
      dataSource: 'participations',
      aggregation: 'sum',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 4, w: 4, h: 3 }
    },
    {
      id: 'student_perf_4',
      title: 'Behavior Summary',
      chartType: 'pie',
      dataSource: 'behaviors',
      groupBy: 'type',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 4, y: 4, w: 4, h: 3 }
    },
    {
      id: 'student_perf_5',
      title: 'Penalties Overview',
      chartType: 'count',
      dataSource: 'penalties',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 8, y: 4, w: 4, h: 3 }
    }
  ],

  // Instructor Dashboard - Overview Tab
  [`${ROLE_STRINGS.INSTRUCTOR}_overview`]: [
    {
      id: 'instructor_overview_1',
      title: 'Total Students',
      chartType: 'count',
      dataSource: 'enrollments',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 0, w: 3, h: 3 }
    },
    {
      id: 'instructor_overview_2',
      title: 'Class Attendance',
      chartType: 'pie',
      dataSource: 'attendance',
      groupBy: 'status',
      aggregation: 'count',
      dateRange: 'today',
      filters: [],
      layout: { x: 3, y: 0, w: 3, h: 3 }
    },
    {
      id: 'instructor_overview_3',
      title: 'Pending Submissions',
      chartType: 'count',
      dataSource: 'submissions',
      aggregation: 'count',
      dateRange: 'upcoming',
      filters: [{ field: 'status', value: 'pending' }],
      layout: { x: 6, y: 0, w: 3, h: 3 }
    },
    {
      id: 'instructor_overview_4',
      title: 'Class Performance',
      chartType: 'bar',
      dataSource: 'marks',
      groupBy: 'class',
      aggregation: 'average',
      dateRange: 'current',
      filters: [],
      layout: { x: 9, y: 0, w: 3, h: 3 }
    },
    {
      id: 'instructor_overview_5',
      title: 'Recent Activities',
      chartType: 'list',
      dataSource: 'activityLogs',
      aggregation: 'count',
      dateRange: 'last7',
      filters: [],
      layout: { x: 0, y: 3, w: 12, h: 3 }
    }
  ],

  // Instructor Dashboard - Performance Tab
  [`${ROLE_STRINGS.INSTRUCTOR}_performance`]: [
    {
      id: 'instructor_perf_1',
      title: 'Grade Distribution by Class',
      chartType: 'bar',
      dataSource: 'marks',
      groupBy: 'class',
      aggregation: 'average',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 0, w: 6, h: 4 }
    },
    {
      id: 'instructor_perf_2',
      title: 'Student Engagement',
      chartType: 'line',
      dataSource: 'participations',
      groupBy: 'date',
      aggregation: 'count',
      dateRange: 'last30',
      filters: [],
      layout: { x: 6, y: 0, w: 6, h: 4 }
    },
    {
      id: 'instructor_perf_3',
      title: 'Attendance Trends',
      chartType: 'area',
      dataSource: 'attendance',
      groupBy: 'date',
      aggregation: 'count',
      dateRange: 'last90',
      filters: [],
      layout: { x: 0, y: 4, w: 12, h: 4 }
    }
  ],

  // HR Dashboard - Overview Tab
  [`${ROLE_STRINGS.HR}_overview`]: [
    {
      id: 'hr_overview_1',
      title: 'Total Employees',
      chartType: 'count',
      dataSource: 'users',
      aggregation: 'count',
      dateRange: 'all',
      filters: [],
      layout: { x: 0, y: 0, w: 3, h: 3 }
    },
    {
      id: 'hr_overview_2',
      title: 'Department Distribution',
      chartType: 'pie',
      dataSource: 'users',
      groupBy: 'department',
      aggregation: 'count',
      dateRange: 'all',
      filters: [],
      layout: { x: 3, y: 0, w: 3, h: 3 }
    },
    {
      id: 'hr_overview_3',
      title: 'Training Completion',
      chartType: 'gauge',
      dataSource: 'trainings',
      aggregation: 'average',
      dateRange: 'current',
      filters: [],
      layout: { x: 6, y: 0, w: 3, h: 3 }
    },
    {
      id: 'hr_overview_4',
      title: 'Leave Requests',
      chartType: 'count',
      dataSource: 'leaves',
      aggregation: 'count',
      dateRange: 'pending',
      filters: [{ field: 'status', value: 'pending' }],
      layout: { x: 9, y: 0, w: 3, h: 3 }
    },
    {
      id: 'hr_overview_5',
      title: 'New Hires Trend',
      chartType: 'line',
      dataSource: 'users',
      groupBy: 'date',
      aggregation: 'count',
      dateRange: 'last90',
      filters: [{ field: 'status', value: 'active' }],
      layout: { x: 0, y: 3, w: 6, h: 4 }
    },
    {
      id: 'hr_overview_6',
      title: 'Attendance Overview',
      chartType: 'bar',
      dataSource: 'attendance',
      groupBy: 'department',
      aggregation: 'average',
      dateRange: 'last30',
      filters: [],
      layout: { x: 6, y: 3, w: 6, h: 4 }
    }
  ],

  // HR Dashboard - Performance Tab
  [`${ROLE_STRINGS.HR}_performance`]: [
    {
      id: 'hr_perf_1',
      title: 'Performance Ratings',
      chartType: 'bar',
      dataSource: 'performanceReviews',
      groupBy: 'rating',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 0, w: 6, h: 4 }
    },
    {
      id: 'hr_perf_2',
      title: 'Training Progress',
      chartType: 'area',
      dataSource: 'trainings',
      groupBy: 'date',
      aggregation: 'count',
      dateRange: 'last180',
      filters: [],
      layout: { x: 6, y: 0, w: 6, h: 4 }
    },
    {
      id: 'hr_perf_3',
      title: 'Employee Satisfaction',
      chartType: 'line',
      dataSource: 'surveys',
      groupBy: 'date',
      aggregation: 'average',
      dateRange: 'last365',
      filters: [],
      layout: { x: 0, y: 4, w: 12, h: 4 }
    }
  ],

  // Admin Dashboard - Overview Tab
  [`${ROLE_STRINGS.ADMIN}_overview`]: [
    {
      id: 'admin_overview_1',
      title: 'System Overview',
      chartType: 'count',
      dataSource: 'users',
      aggregation: 'count',
      dateRange: 'all',
      filters: [],
      layout: { x: 0, y: 0, w: 3, h: 3 }
    },
    {
      id: 'admin_overview_2',
      title: 'Active Courses',
      chartType: 'count',
      dataSource: 'classes',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 3, y: 0, w: 3, h: 3 }
    },
    {
      id: 'admin_overview_3',
      title: 'Total Enrollments',
      chartType: 'count',
      dataSource: 'enrollments',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 6, y: 0, w: 3, h: 3 }
    },
    {
      id: 'admin_overview_4',
      title: 'System Health',
      chartType: 'status',
      dataSource: 'system',
      aggregation: 'status',
      dateRange: 'realtime',
      filters: [],
      layout: { x: 9, y: 0, w: 3, h: 3 }
    },
    {
      id: 'admin_overview_5',
      title: 'User Activity',
      chartType: 'line',
      dataSource: 'activityLogs',
      groupBy: 'date',
      aggregation: 'count',
      dateRange: 'last7',
      filters: [],
      layout: { x: 0, y: 3, w: 6, h: 4 }
    },
    {
      id: 'admin_overview_6',
      title: 'Resource Usage',
      chartType: 'area',
      dataSource: 'resources',
      groupBy: 'type',
      aggregation: 'sum',
      dateRange: 'last30',
      filters: [],
      layout: { x: 6, y: 3, w: 6, h: 4 }
    }
  ],

  // Admin Dashboard - Performance Tab
  [`${ROLE_STRINGS.ADMIN}_performance`]: [
    {
      id: 'admin_perf_1',
      title: 'Course Performance',
      chartType: 'bar',
      dataSource: 'classes',
      groupBy: 'program',
      aggregation: 'average',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 0, w: 6, h: 4 }
    },
    {
      id: 'admin_perf_2',
      title: 'Instructor Workload',
      chartType: 'pie',
      dataSource: 'classes',
      groupBy: 'instructor',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 6, y: 0, w: 6, h: 4 }
    },
    {
      id: 'admin_perf_3',
      title: 'System Metrics',
      chartType: 'line',
      dataSource: 'metrics',
      groupBy: 'date',
      aggregation: 'average',
      dateRange: 'last90',
      filters: [],
      layout: { x: 0, y: 4, w: 12, h: 4 }
    }
  ],

  // Super Admin Dashboard - Overview Tab (inherits from Admin with additional widgets)
  [`${ROLE_STRINGS.SUPER_ADMIN}_overview`]: [
    {
      id: 'super_admin_overview_1',
      title: 'Total Users',
      chartType: 'count',
      dataSource: 'users',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 0, w: 4, h: 3 }
    },
    {
      id: 'super_admin_overview_2',
      title: 'Active Courses',
      chartType: 'count',
      dataSource: 'classes',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 4, y: 0, w: 4, h: 3 }
    },
    {
      id: 'super_admin_overview_3',
      title: 'System Activity',
      chartType: 'line',
      dataSource: 'activityLogs',
      groupBy: 'date',
      aggregation: 'count',
      dateRange: 'last7',
      filters: [],
      layout: { x: 8, y: 0, w: 4, h: 3 }
    },
    {
      id: 'super_admin_overview_4',
      title: 'User Distribution',
      chartType: 'pie',
      dataSource: 'users',
      groupBy: 'role',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 3, w: 6, h: 4 }
    },
    {
      id: 'super_admin_overview_5',
      title: 'Enrollment Trends',
      chartType: 'area',
      dataSource: 'enrollments',
      groupBy: 'date',
      aggregation: 'count',
      dateRange: 'last30',
      filters: [],
      layout: { x: 6, y: 3, w: 6, h: 4 }
    },
    {
      id: 'super_admin_overview_6',
      title: 'Resource Usage',
      chartType: 'bar',
      dataSource: 'resources',
      groupBy: 'type',
      aggregation: 'sum',
      dateRange: 'last30',
      filters: [],
      layout: { x: 0, y: 7, w: 6, h: 4 }
    },
    {
      id: 'super_admin_overview_7',
      title: 'Multi-tenant Overview',
      chartType: 'bar',
      dataSource: 'tenants',
      groupBy: 'tenant',
      aggregation: 'count',
      dateRange: 'all',
      filters: [],
      layout: { x: 6, y: 7, w: 6, h: 4 }
    },
    {
      id: 'super_admin_overview_8',
      title: 'Global Statistics',
      chartType: 'count',
      dataSource: 'global',
      aggregation: 'sum',
      dateRange: 'all',
      filters: [],
      layout: { x: 0, y: 11, w: 12, h: 3 }
    }
  ],

  // Super Admin Dashboard - Performance Tab (inherits from Admin)
  [`${ROLE_STRINGS.SUPER_ADMIN}_performance`]: [
    {
      id: 'super_admin_perf_1',
      title: 'Global Course Performance',
      chartType: 'bar',
      dataSource: 'classes',
      groupBy: 'program',
      aggregation: 'average',
      dateRange: 'current',
      filters: [],
      layout: { x: 0, y: 0, w: 6, h: 4 }
    },
    {
      id: 'super_admin_perf_2',
      title: 'Global Instructor Workload',
      chartType: 'pie',
      dataSource: 'classes',
      groupBy: 'instructor',
      aggregation: 'count',
      dateRange: 'current',
      filters: [],
      layout: { x: 6, y: 0, w: 6, h: 4 }
    },
    {
      id: 'super_admin_perf_3',
      title: 'System Metrics',
      chartType: 'line',
      dataSource: 'metrics',
      groupBy: 'date',
      aggregation: 'average',
      dateRange: 'last90',
      filters: [],
      layout: { x: 0, y: 4, w: 12, h: 4 }
    }
  ]
};

/**
 * Widget Configuration Service
 * Manages role-based widget assignments and configurations
 */
class WidgetConfigurationService {
  /**
   * Get default widgets for a specific role and dashboard
   * @param {string} role - User role (from ROLE_STRINGS)
   * @param {string} dashboard - Dashboard identifier (e.g., 'overview', 'performance')
   * @returns {Array} Array of widget configurations
   */
  static getDefaultWidgets(role, dashboard) {
    const key = `${role}_${dashboard}`;
    const widgets = DEFAULT_WIDGET_CONFIGURATIONS[key];
    
    if (!widgets) {
      warn(`[WidgetConfigurationService] No default widgets found for role: ${role}, dashboard: ${dashboard}`);
      return [];
    }
    
    return widgets.map(widget => ({
      ...widget,
      id: `${widget.id}_${Date.now()}`, // Ensure unique IDs
      role, // Track which role this widget belongs to
      dashboard // Track which dashboard this widget belongs to
    }));
  }

  /**
   * Get storage key for persisting widgets
   * @param {string} role - User role
   * @param {string} dashboard - Dashboard identifier
   * @param {string} userId - User ID (for personal customization)
   * @returns {string} Storage key
   */
  static getStorageKey(role, dashboard, userId) {
    return `widgets_${role}_${dashboard}_${userId}`;
  }

  /**
   * Check if a user can edit widgets for a role/dashboard
   * @param {string} userRole - Current user's role
   * @param {string} targetRole - Target role of the widgets
   * @returns {boolean} Can edit
   */
  static canEditWidgets(userRole, targetRole) {
    // Super admins can edit all widgets
    if (userRole === ROLE_STRINGS.SUPER_ADMIN) return true;
    
    // Admins can edit admin and instructor widgets
    if (userRole === ROLE_STRINGS.ADMIN) {
      return targetRole === ROLE_STRINGS.ADMIN || targetRole === ROLE_STRINGS.INSTRUCTOR;
    }
    
    // Users can only edit their own role's widgets
    return userRole === targetRole;
  }

  /**
   * Filter widgets based on data source permissions
   * @param {Array} widgets - Widget configurations
   * @param {string} role - User role
   * @returns {Array} Filtered widgets
   */
  static filterWidgetsByPermissions(widgets, role) {
    // Define data source permissions by role
    const dataSourcePermissions = {
      [ROLE_STRINGS.STUDENT]: ['enrollments', 'attendance', 'marks', 'participations', 'behaviors', 'penalties'],
      [ROLE_STRINGS.INSTRUCTOR]: ['enrollments', 'attendance', 'marks', 'submissions', 'activityLogs', 'classes'],
      [ROLE_STRINGS.HR]: ['users', 'trainings', 'leaves', 'departments', 'attendance', 'performanceReviews', 'surveys'],
      [ROLE_STRINGS.ADMIN]: ['users', 'classes', 'enrollments', 'activityLogs', 'resources', 'metrics', 'system'],
      [ROLE_STRINGS.SUPER_ADMIN]: ['*'] // Access to all data sources
    };

    const allowedSources = dataSourcePermissions[role] || [];
    
    return widgets.filter(widget => {
      // Super admin sees all
      if (role === ROLE_STRINGS.SUPER_ADMIN) return true;
      
      // Check if widget's data source is allowed
      return allowedSources.includes('*') || allowedSources.includes(widget.dataSource);
    });
  }

  /**
   * Merge default widgets with saved custom widgets
   * @param {Array} savedWidgets - Previously saved widgets
   * @param {Array} defaultWidgets - Default widgets for the role/dashboard
   * @returns {Array} Merged widget list
   */
  static mergeWidgets(savedWidgets, defaultWidgets) {
    if (!savedWidgets || savedWidgets.length === 0) {
      return defaultWidgets;
    }

    // Create a map of saved widgets by their original ID (without timestamp)
    const savedWidgetMap = new Map();
    savedWidgets.forEach(widget => {
      const baseId = widget.id.split('_').slice(0, -1).join('_');
      savedWidgetMap.set(baseId, widget);
    });

    // Merge: keep custom widgets, add missing default widgets
    const merged = [];
    const seenIds = new Set();

    // Add saved/custom widgets first
    savedWidgets.forEach(widget => {
      merged.push(widget);
      seenIds.add(widget.id);
    });

    // Add missing default widgets
    defaultWidgets.forEach(widget => {
      const baseId = widget.id.split('_').slice(0, -1).join('_');
      if (!savedWidgetMap.has(baseId)) {
        merged.push(widget);
      }
    });

    return merged;
  }
}

export default WidgetConfigurationService;
