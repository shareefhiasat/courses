import { useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import logger from '@utils/logger';

/**
 * Resolves role-based permissions and data scoping for the Student Dashboard.
 * Returns booleans and helper functions used by hooks and components.
 */
const useStudentDashboardPermissions = () => {
  const { user, userProfile, isAdmin, isInstructor, isHR, isSuperAdmin } = useAuth();

  const permissions = useMemo(() => {
    const isStudent = !isAdmin && !isInstructor && !isHR && !isSuperAdmin;
    const isStaff = isAdmin || isInstructor || isHR || isSuperAdmin;

    // Debug: Log role detection
    logger.log('[StudentDashboardPermissions] Role detection:', {
      userUid: user?.uid,
      userProfile,
      isAdmin,
      isInstructor,
      isHR,
      isSuperAdmin,
      isStudent,
      isStaff
    });

    return {
      // Role flags
      isStudent,
      isInstructor: !!isInstructor,
      isHR: !!isHR,
      isAdmin: !!isAdmin,
      isSuperAdmin: !!isSuperAdmin,
      isStaff,

      // Data scope
      canViewOwnOnly: isStudent,
      canViewClassStudents: !!isInstructor && !isAdmin && !isSuperAdmin,
      canViewAllStudents: isAdmin || isHR || isSuperAdmin,

      // Actions
      canExport: true,
      canInlineEdit: isStaff,
      canMarkAttendance: isStaff,
      canAddParticipation: isStaff,
      canAddPenalty: isStaff,
      canAddBehavior: isStaff,
      canDeleteRecords: isAdmin || isSuperAdmin,
      canNavigateToMarksEntry: isAdmin || isSuperAdmin || isInstructor,

      // Performance tab
      canSeeClassDistributions: isStaff,
      canSeeRankingContext: isStaff,

      // Selection-first: non-student roles must select context before data loads
      requiresSelection: isStaff,

      // Export scope
      canExportClassLevel: isAdmin || isHR || isSuperAdmin || isInstructor,
      canExportStudentLevel: true,

      // Instructor class filtering
      instructorUid: isInstructor ? user?.uid : null,
      instructorEmail: isInstructor ? user?.email : null,
    };
  }, [isAdmin, isInstructor, isHR, isSuperAdmin, user]);

  /**
   * Filters classes to only those the current user can access.
   * Instructors see only their own classes; admin/HR/superAdmin see all.
   */
  const limitClasses = useMemo(() => (allClasses = []) => {
    if (!allClasses || allClasses.length === 0) return [];
    if (permissions.canViewAllStudents) return allClasses;
    if (permissions.isInstructor) {
      return allClasses.filter(
        cls =>
          cls.instructorId === permissions.instructorUid ||
          cls.ownerEmail === permissions.instructorEmail
      );
    }
    return [];
  }, [permissions]);

  /**
   * Filters students to only those enrolled in accessible classes.
   */
  const limitStudents = useMemo(() => (allStudents = [], accessibleClassIds = []) => {
    if (!allStudents || allStudents.length === 0) return [];
    if (permissions.canViewAllStudents) return allStudents;
    if (permissions.isInstructor && accessibleClassIds.length > 0) {
      const classIdSet = new Set(accessibleClassIds);
      return allStudents.filter(s =>
        s.enrolledClassIds?.some(id => classIdSet.has(id)) ||
        classIdSet.has(s.classId)
      );
    }
    return [];
  }, [permissions]);

  /**
   * Resolves the effective student ID to display data for.
   * For students: always their own UID.
   * For staff: the selected student ID, or null if none selected.
   */
  const resolveDisplayStudentId = useMemo(() => (baseUserId, selectedStudentId) => {
    if (permissions.isStudent) return baseUserId;
    return selectedStudentId || null;
  }, [permissions.isStudent]);

  return {
    ...permissions,
    limitClasses,
    limitStudents,
    resolveDisplayStudentId,
  };
};

export default useStudentDashboardPermissions;
