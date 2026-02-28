/**
 * Unified card configuration utility for dashboard cards and metrics
 * Provides consistent icons, colors, shapes, and localized labels across the application
 */

import {getThemedIcon} from '@constants/iconTypes';

/**
 * Get theme-aware color for icons
 * @param {string} baseColor - Base color from the card config
 * @param {string} theme - Current theme ('light' or 'dark')
 * @returns {string} Theme-appropriate color
 */
const getThemeAwareColor = (baseColor, theme = 'light') => {
  // Keep original icon colors - only backgrounds should change for theme
  return baseColor;
};

/**
 * Get theme-aware background color for card icons
 * @param {string} baseColor - Base color from the card config
 * @param {string} theme - Current theme ('light' or 'dark')
 * @returns {string} Theme-appropriate background color
 */
const getThemeAwareBgColor = (baseColor, theme = 'light') => {
  // Convert hex colors to rgba with appropriate opacity for theme
  const colorMap = {
    '#800020': theme === 'dark' ? 'rgba(128, 0, 32, 0.2)' : 'rgba(128, 0, 32, 0.1)',
    '#ec4899': theme === 'dark' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.1)',
    '#6b7280': theme === 'dark' ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)',
    '#10b981': theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
    '#f59e0b': theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
    '#6366f1': theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
    '#ef4444': theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
    '#8b5cf6': theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'
  };

  return colorMap[baseColor] || colorMap['#800020'];
};

/**
 * Get complete card configuration including icon, colors, shape, and localized label
 * @param {string} type - The card type identifier
 * @param {Function} t - Translation function from LangContext
 * @param {string} theme - Current theme ('light' or 'dark')
 * @returns {Object} Card configuration with icon, bg, iconColor, shape, label
 */

// Icon mapping using centralized getThemedIcon system
const getThemedCardIcon = (type, theme = 'light') => {
  const iconMap = {
    // Academic
    "enrolled-classes": getThemedIcon('ui', 'book_open', 24, theme),
    programs: getThemedIcon('ui', 'graduation_cap', 24, theme),
    subjects: getThemedIcon('ui', 'book', 24, theme),
    classes: getThemedIcon('ui', 'school', 24, theme),
    enrollments: getThemedIcon('ui', 'user_check', 24, theme),
    users: getThemedIcon('ui', 'users', 24, theme),
    submissions: getThemedIcon('ui', 'file_check', 24, theme),
    quizzes: getThemedIcon('ui', 'list_checks', 24, theme),
    announcements: getThemedIcon('ui', 'message_square', 24, theme),
    resources: getThemedIcon('ui', 'file_text', 24, theme),

    // Performance & Achievement
    "average-grade": getThemedIcon('ui', 'award', 24, theme),
    "average-score": getThemedIcon('ui', 'bar_chart_3', 24, theme),
    "total-results": getThemedIcon('ui', 'file_bar_chart_2', 24, theme),
    passed: getThemedIcon('ui', 'check_circle', 24, theme),
    excellent: getThemedIcon('ui', 'award', 24, theme),
    good: getThemedIcon('ui', 'trending_up', 24, theme),
    award: getThemedIcon('ui', 'award', 24, theme),
    trophy: getThemedIcon('ui', 'trophy', 24, theme),

    // Tasks & Activities
    "tasks-completed": getThemedIcon('ui', 'target', 24, theme),
    tasks: getThemedIcon('ui', 'clipboard_list', 24, theme),
    activities: getThemedIcon('ui', 'activity', 24, theme),
    homework: getThemedIcon('ui', 'file_text', 24, theme),

    // Attendance
    attendance: getThemedIcon('ui', 'calendar_check', 24, theme),
    "attendance-rate": getThemedIcon('ui', 'calendar_check', 24, theme),

    // Participation
    participation: getThemedIcon('ui', 'message_square', 24, theme),
    "active-students": getThemedIcon('ui', 'user_check', 24, theme),

    // Negative metrics
    penalties: getThemedIcon('ui', 'alert_triangle', 24, theme),
    penalty: getThemedIcon('ui', 'alert_triangle', 24, theme),
    behaviors: getThemedIcon('ui', 'trending_down', 24, theme),
    behavior: getThemedIcon('ui', 'trending_down', 24, theme),
    failed: getThemedIcon('ui', 'x_circle', 24, theme),
    "needs-improvement": getThemedIcon('ui', 'trending_down', 24, theme),

    // Statistics
    "pass-rate": getThemedIcon('ui', 'target', 24, theme),
    "unique-students": getThemedIcon('ui', 'users', 24, theme),
    "unique-quizzes": getThemedIcon('ui', 'target', 24, theme),

    // Default
    default: getThemedIcon('ui', 'bar_chart_3', 24, theme),
  };

  return iconMap[type] || iconMap.default;
};

export const getCardConfig = (type, t = (key) => key, theme = 'light') => {
      const configMap = {
        // Academic
        "enrolled-classes": {
          icon: getThemedIcon('ui', 'book_open', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("enrolled_classes") || "Enrolled Classes",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        programs: {
          icon: getThemedIcon('ui', 'graduation_cap', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("programs") || "Programs",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        subjects: {
          icon: getThemedIcon('ui', 'book', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("subjects") || "Subjects",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        classes: {
          icon: getThemedIcon('ui', 'school', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("classes") || "Classes",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        enrollments: {
          icon: getThemedIcon('ui', 'user_check', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("enrollments") || "Enrollments",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        users: {
          icon: getThemedIcon('ui', 'users', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("users") || "Users",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        students: {
          icon: getThemedIcon('ui', 'user_check', 24, theme),
          bg: "rgba(16, 185, 129, 0.1)",
          iconColor: "#10b981",
          shape: "rounded",
          label: t("students") || "Students",
          gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        },
        teachers: {
          icon: getThemedIcon('ui', 'graduation_cap', 24, theme),
          bg: "rgba(99, 102, 241, 0.1)",
          iconColor: "#6366f1",
          shape: "rounded",
          label: t("teachers") || "Teachers",
          gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        },
        hr: {
          icon: getThemedIcon('ui', 'shield', 24, theme),
          bg: "rgba(245, 158, 11, 0.1)",
          iconColor: "#f59e0b",
          shape: "rounded",
          label: t("hr") || "HR",
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        },
        admins: {
          icon: getThemedIcon('ui', 'crown', 24, theme),
          bg: "rgba(239, 68, 68, 0.1)",
          iconColor: "#ef4444",
          shape: "rounded",
          label: t("admins") || "Admins",
          gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        },
        submissions: {
          icon: getThemedIcon('ui', 'file_check', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("submissions") || "Submissions",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        quizzes: {
          icon: getThemedIcon('ui', 'list_checks', 24, theme),
          bg: "rgba(236, 72, 153, 0.1)",
          iconColor: "#ec4899",
          shape: "rounded",
          label: t("quizzes") || "Quizzes",
          gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        },
        announcements: {
          icon: getThemedIcon('ui', 'message_square', 24, theme),
          bg: "rgba(107, 114, 128, 0.1)",
          iconColor: "#6b7280",
          shape: "rounded",
          label: t("announcements") || "Announcements",
          gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
        },
        resources: {
          icon: getThemedIcon('ui', 'file_text', 24, theme),
          bg: "rgba(107, 114, 128, 0.1)",
          iconColor: "#6b7280",
          shape: "rounded",
          label: t("resources") || "Resources",
          gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
        },

        // Performance & Achievement
        "average-grade": {
          icon: getThemedIcon('ui', 'award', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("average_grade") || "Average Grade",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        "average-score": {
          icon: getThemedIcon('ui', 'bar_chart_3', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("average_score") || "Average Score",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        "total-results": {
          icon: getThemedIcon('ui', 'file_bar_chart_2', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("total_results") || "Total Results",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        passed: {
          icon: getThemedIcon('ui', 'check_circle', 24, theme),
          bg: "rgba(16, 185, 129, 0.1)",
          iconColor: "#10b981",
          shape: "rounded",
          label: t("passed") || "Passed",
          gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        },
        excellent: {
          icon: getThemedIcon('ui', 'award', 24, theme),
          bg: "rgba(16, 185, 129, 0.1)",
          iconColor: "#10b981",
          shape: "rounded",
          label: t("excellent") || "Excellent (90%+)",
          gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        },
        good: {
          icon: getThemedIcon('ui', 'trending_up', 24, theme),
          bg: "rgba(245, 158, 11, 0.1)",
          iconColor: "#f59e0b",
          shape: "rounded",
          label: t("good") || "Good (70-89%)",
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        },
        award: {
          icon: getThemedIcon('ui', 'award', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("award") || "Award",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },
        trophy: {
          icon: getThemedIcon('ui', 'trophy', 24, theme),
          bg: "rgba(128, 0, 32, 0.1)",
          iconColor: "#800020",
          shape: "rounded",
          label: t("trophy") || "Trophy",
          gradient: "linear-gradient(135deg, #800020 0%, #810C29FF 100%)",
        },

        // Tasks & Activities
        "tasks-completed": {
          icon: getThemedIcon('ui', 'target', 24, theme),
          bg: "rgba(236, 72, 153, 0.1)",
          iconColor: "#ec4899",
          shape: "rounded",
          label: t("tasks_completed") || "Tasks Completed",
          gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        },
        tasks: {
          icon: getThemedIcon('ui', 'clipboard_list', 24, theme),
          bg: "rgba(236, 72, 153, 0.1)",
          iconColor: "#ec4899",
          shape: "rounded",
          label: t("tasks") || "Tasks",
          gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        },
        activities: {
          icon: getThemedIcon('ui', 'activity', 24, theme),
          bg: "rgba(236, 72, 153, 0.1)",
          iconColor: "#ec4899",
          shape: "rounded",
          label: t("activities") || "Activities",
          gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        },
        homework: {
          icon: getThemedIcon('ui', 'file_text', 24, theme),
          bg: "rgba(236, 72, 153, 0.1)",
          iconColor: "#ec4899",
          shape: "rounded",
          label: t("homework") || "Homework",
          gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        },
        // Attendance
        attendance: {
          icon: getThemedIcon('ui', 'calendar_check', 24, theme),
          bg: "rgba(245, 158, 11, 0.1)",
          iconColor: "#f59e0b",
          shape: "rounded",
          label: t("attendance") || "Attendance",
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        },
        "attendance-rate": {
          icon: getThemedIcon('ui', 'calendar_check', 24, theme),
          bg: "rgba(245, 158, 11, 0.1)",
          iconColor: "#f59e0b",
          shape: "rounded",
          label: t("attendance") || "Attendance",
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        },
// Participation
        participation: {
          icon: getThemedIcon('ui', 'message_square', 24, theme),
          bg: "rgba(99, 102, 241, 0.1)",
          iconColor: "#6366f1",
          shape: "rounded",
          label: t("participation") || "Participation",
          gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        },
        participations: {
          icon: getThemedIcon('ui', 'message_square', 24, theme),
          bg: "rgba(99, 102, 241, 0.1)",
          iconColor: "#6366f1",
          shape: "rounded",
          label: t("participations") || "Participations",
          gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        },
        "active-students": {
          icon: getThemedIcon('ui', 'user_check', 24, theme),
          bg: "rgba(99, 102, 241, 0.1)",
          iconColor: "#6366f1",
          shape: "rounded",
          label: t("active_students") || "Active Students",
          gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        },

// Negative metrics
        penalties: {
          icon: getThemedIcon('ui', 'alert_triangle', 24, theme),
          bg: "rgba(239, 68, 68, 0.1)",
          iconColor: "#ef4444",
          shape: "rounded",
          label: t("penalties") || "Penalties",
          gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        },
        behaviors: {
          icon: getThemedIcon('ui', 'trending_down', 24, theme),
          bg: "rgba(245, 158, 11, 0.1)",
          iconColor: "#f59e0b",
          shape: "rounded",
          label: t("behaviors") || "Behaviors",
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        },
        behavior: {
          icon: getThemedIcon('ui', 'trending_down', 24, theme),
          bg: "rgba(245, 158, 11, 0.1)",
          iconColor: "#f59e0b",
          shape: "rounded",
          label: t("behavior") || "Behavior",
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        },
        penalty: {
          icon: getThemedIcon('ui', 'alert_triangle', 24, theme),
          bg: "rgba(239, 68, 68, 0.1)",
          iconColor: "#ef4444",
          shape: "rounded",
          label: t("penalty") || "Penalty",
          gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        },
        failed: {
          icon: getThemedIcon('ui', 'x_circle', 24, theme),
          bg: "rgba(239, 68, 68, 0.1)",
          iconColor: "#ef4444",
          shape: "rounded",
          label: t("failed") || "Failed",
          gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        },
        "needs-improvement": {
          icon: getThemedIcon('ui', 'trending_down', 24, theme),
          bg: "rgba(239, 68, 68, 0.1)",
          iconColor: "#ef4444",
          shape: "rounded",
          label: t("needs_improvement") || "Needs Improvement",
          gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        },
        // Statistics
        "pass-rate": {
          icon: getThemedIcon('ui', 'target', 24, theme),
          bg: "rgba(139, 92, 246, 0.1)",
          iconColor: "#8b5cf6",
          shape: "rounded",
          label: t("pass_rate") || "Pass Rate",
          gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        },
        "unique-students": {
          icon: getThemedIcon('ui', 'users', 24, theme),
          bg: "rgba(139, 92, 246, 0.1)",
          iconColor: "#8b5cf6",
          shape: "rounded",
          label: t("unique_students") || "Unique Students",
          gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        }
        ,
        "unique-quizzes": {
          icon: getThemedIcon('ui', 'target', 24, theme),
          bg: "rgba(139, 92, 246, 0.1)",
          iconColor: "#8b5cf6",
          shape: "rounded",
          label: t("unique_quizzes") || "Unique Quizzes",
          gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
        },
        // Default
        default:
            {
              icon: getThemedIcon('ui', 'bar_chart_3', 24, theme),
              bg: "rgba(107, 114, 128, 0.1)",
              iconColor: "#6b7280",
              shape: "rounded",
              label: t("metric") || "Metric",
              gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
            },
      };

      const config = configMap[type] || configMap["default"];

// Apply theme-aware colors and return themed icon
      return {
        ...config,
        icon: getThemedCardIcon(type, theme),
        iconColor: getThemeAwareColor(config.iconColor, theme),
        bg: getThemeAwareBgColor(config.iconColor, theme)
      };
    }
;

/**
 * Get border radius based on shape
 * @param {string} shape - Shape type: 'rounded', 'circle', 'square'
 * @returns {string} CSS border-radius value
 */
export const getShapeRadius = (shape = "rounded") => {
  const radiusMap = {
    rounded: "8px",
    circle: "50%",
    square: "0px",
    "rounded-lg": "12px",
    "rounded-xl": "16px",
  };
  return radiusMap[shape] || radiusMap["rounded"];
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getCardConfig instead
 */
export const getCardColor = (type) => {
  const config = getCardConfig(type);
  return {
    bg: config.bg,
    icon: config.iconColor,
  };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getCardConfig instead
 */
export const getCardIcon = (type) => {
  const config = getCardConfig(type);
  return config.icon;
};

