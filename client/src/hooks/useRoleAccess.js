import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@services/other/config';
import { useAuth } from '@contexts/AuthContext';
import logger from '@utils/logger';

/**
 * useRoleAccess Hook
 * 
 * Fetches and caches role-screen permissions from Firestore.
 * Integrates with the RoleAccessPro dynamic configuration.
 * 
 * @returns {Object} { hasAccess, loading, roleScreens, reload }
 */
export const useRoleAccess = () => {
  const { user, role, isSuperAdmin, loading: authLoading } = useAuth();
  const [roleScreens, setRoleScreens] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default role screens (fallback if Firestore fails)
  // User requirements: Super Admin/HR/Admin/Instructor get ALL screens, Student gets only student-related screens
  const defaultRoleScreens = {
    admin: { 
      // Admin gets ALL screens
      home: true, dashboard: true, studentDashboard: true, studentProfile: true, 
      activities: true, resources: true, quizzes: true, quizManagement: true, 
      quizBuilder: true, quizResults: true, reviewResults: true, classSchedules: true, 
      classSchedule: true, manageEnrollments: true, myEnrollments: true, enrollments: true, 
      programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true, 
      courses: true, attendance: true, hrAttendance: true, myAttendance: true, 
      hrPenalties: true, instructorParticipation: true, instructorBehavior: true, 
      analytics: true, advancedAnalytics: true, chat: true, scheduledReports: true, 
      notifications: true, profile: true, timer: true
    },
    instructor: { 
      // Instructor gets ALL screens
      home: true, dashboard: true, studentDashboard: true, studentProfile: true, 
      activities: true, resources: true, quizzes: true, quizManagement: true, 
      quizBuilder: true, quizResults: true, reviewResults: true, classSchedules: true, 
      classSchedule: true, manageEnrollments: true, myEnrollments: true, enrollments: true, 
      programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true, 
      courses: true, attendance: true, hrAttendance: true, myAttendance: true, 
      hrPenalties: true, instructorParticipation: true, instructorBehavior: true, 
      analytics: true, advancedAnalytics: true, chat: true, scheduledReports: true, 
      notifications: true, profile: true, timer: true
    },
    hr: { 
      // HR gets ALL screens
      home: true, dashboard: true, studentDashboard: true, studentProfile: true, 
      activities: true, resources: true, quizzes: true, quizManagement: true, 
      quizBuilder: true, quizResults: true, reviewResults: true, classSchedules: true, 
      classSchedule: true, manageEnrollments: true, myEnrollments: true, enrollments: true, 
      programs: true, subjects: true, classes: true, marksEntry: true, courseProgress: true, 
      courses: true, attendance: true, hrAttendance: true, myAttendance: true, 
      hrPenalties: true, instructorParticipation: true, instructorBehavior: true, 
      analytics: true, advancedAnalytics: true, chat: true, scheduledReports: true, 
      notifications: true, profile: true, timer: true
    },
    student: { 
      // Student gets ONLY student-related screens
      home: true, dashboard: false, studentDashboard: true, studentProfile: true, 
      activities: true, resources: true, quizzes: true, quizResults: true, reviewResults: false, 
      classSchedules: true, classSchedule: true, myEnrollments: true, courseProgress: true, 
      courses: true, myAttendance: true, chat: true, notifications: true, profile: true, 
      timer: true,
      // These are admin/instructor only
      quizManagement: false, quizBuilder: false, manageEnrollments: false, enrollments: false, 
      programs: false, subjects: false, classes: false, marksEntry: false, attendance: false, 
      hrAttendance: false, hrPenalties: false, instructorParticipation: false, instructorBehavior: false, 
      analytics: false, advancedAnalytics: false, scheduledReports: false
    },
  };

  // Load role screens from Firestore
  const loadRoleScreens = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, 'config', 'roleScreens');
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        const data = snap.data();
        setRoleScreens(data);
        logger.log('[useRoleAccess] Loaded role screens from Firestore:', Object.keys(data));
      } else {
        logger.warn('[useRoleAccess] No role screens found in Firestore, using defaults');
        setRoleScreens(defaultRoleScreens);
      }
    } catch (err) {
      logger.error('[useRoleAccess] Error loading role screens:', err);
      setError(err.message);
      // Fallback to defaults on error
      setRoleScreens(defaultRoleScreens);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load on mount and when user changes
  useEffect(() => {
    if (!authLoading) {
      loadRoleScreens();
    }
  }, [authLoading, loadRoleScreens]);

  /**
   * Check if current user has access to a screen
   * @param {string} screenId - Screen ID from screenDefinitions.js
   * @returns {boolean} - True if user has access
   */
  const hasAccess = useCallback((screenId) => {
    // Not authenticated
    if (!user || !role) {
      return false;
    }

    // Super admins bypass all restrictions
    if (isSuperAdmin) {
      logger.log(`[useRoleAccess] Super admin bypass for screen: ${screenId}`);
      return true;
    }

    // Check role-specific permissions
    const userRole = role.toLowerCase();
    const screenPermissions = roleScreens[userRole];
    
    if (!screenPermissions) {
      logger.warn(`[useRoleAccess] No permissions found for role: ${userRole}`);
      return false;
    }

    const hasPermission = !!screenPermissions[screenId];
    
    if (!hasPermission) {
      logger.warn(`[useRoleAccess] Access denied for ${userRole} to screen: ${screenId}`);
    }
    
    return hasPermission;
  }, [user, role, isSuperAdmin, roleScreens]);

  /**
   * Check if user has access to any of the provided screens
   * @param {string[]} screenIds - Array of screen IDs
   * @returns {boolean} - True if user has access to at least one
   */
  const hasAnyAccess = useCallback((screenIds) => {
    if (!Array.isArray(screenIds)) return false;
    return screenIds.some(screenId => hasAccess(screenId));
  }, [hasAccess]);

  /**
   * Check if user has access to all provided screens
   * @param {string[]} screenIds - Array of screen IDs
   * @returns {boolean} - True if user has access to all
   */
  const hasAllAccess = useCallback((screenIds) => {
    if (!Array.isArray(screenIds)) return false;
    return screenIds.every(screenId => hasAccess(screenId));
  }, [hasAccess]);

  return {
    hasAccess,
    hasAnyAccess,
    hasAllAccess,
    loading: authLoading || loading,
    roleScreens,
    error,
    reload: loadRoleScreens
  };
};

export default useRoleAccess;
