import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { getRoleScreens } from '@services/business/configService';

const defaultRoleScreens = {
  admin: {
    home: true, dashboard: true, studentDashboard: true, studentProfile: true,
    activities: true, resources: true, quizzes: true, quizManagement: true,
    quizBuilder: true, quizResults: true, reviewResults: true, classSchedules: true,
    classSchedule: true, manageEnrollments: true, myEnrollments: true, enrollments: true,
    programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true,
    courses: true, attendance: true, hrAttendance: true, myAttendance: true,
    hrPenalties: true, instructorParticipation: true, instructorBehavior: true,
    analytics: true, advancedAnalytics: true, chat: true, scheduledReports: true,
    notifications: true, profile: true, timer: true, roleAccess: false
  },
  instructor: {
    home: true, dashboard: true, studentDashboard: true, studentProfile: true,
    activities: true, resources: true, quizzes: true, quizManagement: true,
    quizBuilder: true, quizResults: true, reviewResults: true, classSchedules: true,
    classSchedule: true, manageEnrollments: true, myEnrollments: true, enrollments: true,
    programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true,
    courses: true, attendance: true, hrAttendance: true, myAttendance: true,
    hrPenalties: true, instructorParticipation: true, instructorBehavior: true,
    analytics: true, advancedAnalytics: true, chat: true, scheduledReports: true,
    notifications: true, profile: true, timer: true, roleAccess: false
  },
  hr: {
    home: true, dashboard: true, studentDashboard: true, studentProfile: true,
    activities: true, resources: true, quizzes: true, quizManagement: true,
    quizBuilder: true, quizResults: true, reviewResults: true, classSchedules: true,
    classSchedule: true, manageEnrollments: true, myEnrollments: true, enrollments: true,
    programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true,
    courses: true, attendance: true, hrAttendance: true, myAttendance: true,
    hrPenalties: true, instructorParticipation: true, instructorBehavior: true,
    analytics: true, advancedAnalytics: true, chat: true, scheduledReports: true,
    notifications: true, profile: true, timer: true, roleAccess: false
  },
  student: {
    home: true, dashboard: false, studentDashboard: true, studentProfile: true,
    activities: true, resources: true, quizzes: true, quizResults: true, reviewResults: false,
    classSchedules: true, classSchedule: true, myEnrollments: true, courseProgress: true,
    courses: true, myAttendance: true, chat: true, notifications: true, profile: true,
    timer: true, roleAccess: false,
    quizManagement: false, quizBuilder: false, manageEnrollments: false, enrollments: false,
    programs: false, subjects: false, classes: false, marksEntry: false, attendance: false,
    hrAttendance: false, hrPenalties: false, instructorParticipation: false, instructorBehavior: false,
    analytics: false, advancedAnalytics: false, scheduledReports: false
  },
  super_admin: {
    home: true, dashboard: true, studentDashboard: true, studentProfile: true,
    activities: true, resources: true, quizzes: true, quizManagement: true,
    quizBuilder: true, quizResults: true, reviewResults: true, classSchedules: true,
    classSchedule: true, manageEnrollments: true, myEnrollments: true, enrollments: true,
    programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true,
    courses: true, attendance: true, hrAttendance: true, myAttendance: true,
    hrPenalties: true, instructorParticipation: true, instructorBehavior: true,
    analytics: true, advancedAnalytics: true, chat: true, scheduledReports: true,
    notifications: true, profile: true, timer: true, roleAccess: true
  }
};

export const useRoleAccess = () => {
  const { user, role, isSuperAdmin, loading: authLoading, roleLoading } = useAuth();
  const [roleScreens, setRoleScreens] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRoleScreens = useCallback(async () => {
    if (!user) {
      setRoleScreens({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getRoleScreens();

      if (result?.success && result.data) {
        setRoleScreens(result.data);
        debug('[useRoleAccess] Loaded role screens from config service');
      } else {
        info('[useRoleAccess] No role screens found, using defaults');
        setRoleScreens(defaultRoleScreens);
      }
    } catch (err) {
      error('[useRoleAccess] Error loading role screens:', err);
      setError(err.message);
      setRoleScreens(defaultRoleScreens);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadRoleScreens();
    }
  }, [authLoading, loadRoleScreens]);

  const hasAccess = useCallback((screenId) => {
    if (!user) {
      return false;
    }

    if (!screenId) {
      return true;
    }

    if (!role || roleLoading) {
      return true;
    }

    if (isSuperAdmin) {
      return true;
    }

    if (screenId === 'home') {
      return true;
    }

    const userRole = String(role).toLowerCase();
    const screenPermissions = roleScreens[userRole] || defaultRoleScreens[userRole];

    if (!screenPermissions || typeof screenPermissions[screenId] === 'undefined') {
      return true;
    }

    return screenPermissions[screenId] === true;
  }, [user, role, roleLoading, isSuperAdmin, roleScreens]);

  const hasAnyAccess = useCallback((screenIds) => {
    if (!Array.isArray(screenIds) || screenIds.length === 0) return false;
    return screenIds.some((screenId) => hasAccess(screenId));
  }, [hasAccess]);

  const hasAllAccess = useCallback((screenIds) => {
    if (!Array.isArray(screenIds) || screenIds.length === 0) return false;
    return screenIds.every((screenId) => hasAccess(screenId));
  }, [hasAccess]);

  return {
    hasAccess,
    hasAnyAccess,
    hasAllAccess,
    loading: authLoading || loading || roleLoading,
    roleScreens,
    error,
    reload: loadRoleScreens
  };
};

export default useRoleAccess;
