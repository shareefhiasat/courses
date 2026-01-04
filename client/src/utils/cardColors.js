/**
 * Unified card configuration utility for dashboard cards and metrics
 * Provides consistent icons, colors, shapes, and localized labels across the application
 */

import {
  BookOpen,
  Target,
  Trophy,
  CalendarCheck,
  Zap,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Activity,
  FileText,
  HeartPulse,
  GraduationCap,
  School,
  BookMarked,
  ClipboardList,
  ListChecks,
} from "lucide-react";

/**
 * Get complete card configuration including icon, colors, shape, and localized label
 * @param {string} type - The card type identifier
 * @param {Function} t - Translation function from LangContext
 * @returns {Object} Card configuration with icon, bg, iconColor, shape, label
 */
export const getCardConfig = (type, t = (key) => key) => {
  const configMap = {
    // Academic
    "enrolled-classes": {
      icon: BookOpen,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded", // rounded, circle, square
      label: t("enrolled_classes") || "Enrolled Classes",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    programs: {
      icon: School,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("programs") || "Programs",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    subjects: {
      icon: BookMarked,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("subjects") || "Subjects",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    classes: {
      icon: GraduationCap,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("classes") || "Classes",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    enrollments: {
      icon: Users,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("enrollments") || "Enrollments",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    users: {
      icon: Users,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("users") || "Users",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    submissions: {
      icon: ClipboardList,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("submissions") || "Submissions",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    quizzes: {
      icon: ListChecks,
      bg: "rgba(236, 72, 153, 0.1)",
      iconColor: "#ec4899",
      shape: "rounded",
      label: t("quizzes") || "Quizzes",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    },
    announcements: {
      icon: FileText,
      bg: "rgba(107, 114, 128, 0.1)",
      iconColor: "#6b7280",
      shape: "rounded",
      label: t("announcements") || "Announcements",
      gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    },
    resources: {
      icon: FileText,
      bg: "rgba(107, 114, 128, 0.1)",
      iconColor: "#6b7280",
      shape: "rounded",
      label: t("resources") || "Resources",
      gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    },

    // Performance & Achievement
    "average-grade": {
      icon: Trophy,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("average_grade") || "Average Grade",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    "average-score": {
      icon: TrendingUp,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("average_score") || "Average Score",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    "total-results": {
      icon: BarChart3,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("total_results") || "Total Results",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    passed: {
      icon: CheckCircle2,
      bg: "rgba(16, 185, 129, 0.1)",
      iconColor: "#10b981",
      shape: "rounded",
      label: t("passed") || "Passed",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    excellent: {
      icon: Award,
      bg: "rgba(16, 185, 129, 0.1)",
      iconColor: "#10b981",
      shape: "rounded",
      label: t("excellent") || "Excellent (90%+)",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    good: {
      icon: TrendingUp,
      bg: "rgba(245, 158, 11, 0.1)",
      iconColor: "#f59e0b",
      shape: "rounded",
      label: t("good") || "Good (70-89%)",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    award: {
      icon: Award,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("award") || "Award",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    trophy: {
      icon: Trophy,
      bg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#3b82f6",
      shape: "rounded",
      label: t("trophy") || "Trophy",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },

    // Tasks & Activities
    "tasks-completed": {
      icon: Target,
      bg: "rgba(236, 72, 153, 0.1)",
      iconColor: "#ec4899",
      shape: "rounded",
      label: t("tasks_completed") || "Tasks Completed",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    },
    tasks: {
      icon: ClipboardList,
      bg: "rgba(236, 72, 153, 0.1)",
      iconColor: "#ec4899",
      shape: "rounded",
      label: t("tasks") || "Tasks",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    },
    activities: {
      icon: Activity,
      bg: "rgba(236, 72, 153, 0.1)",
      iconColor: "#ec4899",
      shape: "rounded",
      label: t("activities") || "Activities",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    },
    homework: {
      icon: FileText,
      bg: "rgba(236, 72, 153, 0.1)",
      iconColor: "#ec4899",
      shape: "rounded",
      label: t("homework") || "Homework",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    },
    quizzes: {
      icon: ListChecks,
      bg: "rgba(236, 72, 153, 0.1)",
      iconColor: "#ec4899",
      shape: "rounded",
      label: t("quizzes") || "Quizzes",
      gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    },

    // Attendance
    attendance: {
      icon: CalendarCheck,
      bg: "rgba(245, 158, 11, 0.1)",
      iconColor: "#f59e0b",
      shape: "rounded",
      label: t("attendance") || "Attendance",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    "attendance-rate": {
      icon: CalendarCheck,
      bg: "rgba(245, 158, 11, 0.1)",
      iconColor: "#f59e0b",
      shape: "rounded",
      label: t("attendance_rate") || "Attendance Rate",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },

    // Participation
    participations: {
      icon: Zap,
      bg: "rgba(16, 185, 129, 0.1)",
      iconColor: "#10b981",
      shape: "rounded",
      label: t("participations") || "Participations",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    participation: {
      icon: Zap,
      bg: "rgba(16, 185, 129, 0.1)",
      iconColor: "#10b981",
      shape: "rounded",
      label: t("participation") || "Participation",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    "net-participation": {
      icon: HeartPulse,
      bg: "rgba(139, 92, 246, 0.1)",
      iconColor: "#8b5cf6",
      shape: "rounded",
      label: t("net_participation") || "Net Participation",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },

    // Negative metrics
    penalties: {
      icon: AlertTriangle,
      bg: "rgba(239, 68, 68, 0.1)",
      iconColor: "#ef4444",
      shape: "rounded",
      label: t("penalties") || "Penalties",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    },
    penalty: {
      icon: AlertTriangle,
      bg: "rgba(239, 68, 68, 0.1)",
      iconColor: "#ef4444",
      shape: "rounded",
      label: t("penalty") || "Penalty",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    },
    behaviors: {
      icon: TrendingDown,
      bg: "rgba(245, 158, 11, 0.1)",
      iconColor: "#f59e0b",
      shape: "rounded",
      label: t("behaviors") || "Behaviors",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    behavior: {
      icon: TrendingDown,
      bg: "rgba(245, 158, 11, 0.1)",
      iconColor: "#f59e0b",
      shape: "rounded",
      label: t("behavior") || "Behavior",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    failed: {
      icon: XCircle,
      bg: "rgba(239, 68, 68, 0.1)",
      iconColor: "#ef4444",
      shape: "rounded",
      label: t("failed") || "Failed",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    },
    "needs-improvement": {
      icon: TrendingDown,
      bg: "rgba(239, 68, 68, 0.1)",
      iconColor: "#ef4444",
      shape: "rounded",
      label: t("needs_improvement") || "Needs Improvement",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    },

    // Statistics
    "pass-rate": {
      icon: Target,
      bg: "rgba(139, 92, 246, 0.1)",
      iconColor: "#8b5cf6",
      shape: "rounded",
      label: t("pass_rate") || "Pass Rate",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },
    "unique-students": {
      icon: Users,
      bg: "rgba(139, 92, 246, 0.1)",
      iconColor: "#8b5cf6",
      shape: "rounded",
      label: t("unique_students") || "Unique Students",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },
    "unique-quizzes": {
      icon: Target,
      bg: "rgba(139, 92, 246, 0.1)",
      iconColor: "#8b5cf6",
      shape: "rounded",
      label: t("unique_quizzes") || "Unique Quizzes",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },

    // Default
    default: {
      icon: BarChart3,
      bg: "rgba(107, 114, 128, 0.1)",
      iconColor: "#6b7280",
      shape: "rounded",
      label: t("metric") || "Metric",
      gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    },
  };

  return configMap[type] || configMap["default"];
};

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
