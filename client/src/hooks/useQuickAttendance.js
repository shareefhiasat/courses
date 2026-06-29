import { useCallback } from 'react';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes.js';
import { markAttendance } from '@services/business/attendanceServiceUnified.js';
import { getUserProfile } from '@services/api/userService.js';
import { info, error } from '@services/utils/logger.js';
import { getLocalizedAttendanceLabel } from '@utils/attendanceHelpers.js';

/**
 * Custom hook for handling quick attendance marking
 * Handles both regular and standup attendance with proper mode support
 */
export const useQuickAttendance = (user, selectedDate, selectedClassId, t, lang, setTodayAttendanceOverrides, fetchStudentHistory, onRefresh) => {
  const handleQuickAttendance = useCallback(async (student, status, mode = ATTENDANCE_TYPE_CATEGORY.REGULAR) => {
    console.log('🔍 [DEBUG] useQuickAttendance START:', {
      studentId: student?.id,
      studentName: student?.displayName || student?.name,
      status,
      attendanceMode: mode,
      selectedDate,
      selectedClassId
    });

    if (!student || !status || !selectedClassId) {
      console.log('🔍 [DEBUG] useQuickAttendance - Missing required params:', {
        hasStudent: !!student,
        hasStatus: !!status,
        hasClassId: !!selectedClassId
      });
      return;
    }

    try {
      const userProfile = await getUserProfile(user);
      const displayName = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email || 'Unknown';

      const enhancedUser = {
        ...user,
        displayName: displayName
      };

      const attendancePayload = {
        userId: student.id,
        classId: mode === ATTENDANCE_TYPE_CATEGORY.REGULAR ? selectedClassId : undefined,
        date: selectedDate || new Date().toISOString().split('T')[0],
        status: status,
        notes: getNoteTypeFromStatus(status, 'quick'),
        user: enhancedUser
      };

      const currentStatus = mode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? student.standupStatus : student.attendance;
      
      console.log('🔍 [LOG 3] useQuickAttendance - Payload sent to backend:', {
        payload: attendancePayload,
        attendanceMode: mode,
        isStatusChange: currentStatus && currentStatus !== status,
        previousStatus: currentStatus,
        newStatus: status,
        studentId: student.id,
        studentName: student.displayName || student.name
      });

      const result = await markAttendance(attendancePayload, enhancedUser, mode);

      console.log('🔍 [DEBUG] useQuickAttendance - markAttendance result:', {
        success: result?.success,
        error: result?.error,
        data: result?.data
      });

      if (result.success) {
        info(`✅ ${student.displayName || student.name} marked as ${getLocalizedAttendanceLabel(status, lang)}`);
        setTodayAttendanceOverrides(prev => ({ ...prev, [student.id]: status }));
        fetchStudentHistory(student.id);
        
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err) {
      error('Failed to mark attendance:', err);
    }
  }, [user, selectedDate, selectedClassId, t, lang, setTodayAttendanceOverrides, fetchStudentHistory, onRefresh]);

  return { handleQuickAttendance };
};
