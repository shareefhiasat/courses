/**
 * Unique dashboard keys for per-user widget persistence (PostgreSQL user_preferences).
 * Each screen must use its own key so layouts never collide.
 */

export const DASHBOARD_KEYS = {
  SCHEDULING_SUMMARY: 'scheduling_summary',
  studentOverview: (role) => `student_dashboard_overview_${role}`,
  analytics: (role, dashboard) => `analytics_${role}_${dashboard}`,
  roleWidgets: (role, dashboard) => `widgets_${role}_${dashboard}`,
};

export const SCHEDULING_SUMMARY_STORAGE_KEY = DASHBOARD_KEYS.SCHEDULING_SUMMARY;
