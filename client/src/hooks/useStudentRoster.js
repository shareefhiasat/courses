import { useState, useCallback } from 'react';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes.js';
import { getStudentAttendanceByDate, getPenaltiesByStudent, getParticipationsByStudent, getBehaviors } from '@services/api/apiService.js';
import { info, error } from '@services/utils/logger.js';

/**
 * Custom hook for managing student roster state and operations
 * Handles student history fetching, attendance operations, and roster state
 */
export const useStudentRoster = (user, selectedDate, selectedClassId, t, lang, onRefresh) => {
  const [studentHistory, setStudentHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});
  const [todayAttendanceOverrides, setTodayAttendanceOverrides] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch student history for a specific student
  const fetchStudentHistory = useCallback(async (studentId) => {
    console.log('🔍 StudentRoster - fetchStudentHistory called for student:', studentId);
    
    setHistoryLoading(prev => ({ ...prev, [studentId]: true }));
    
    try {
      const todayDate = selectedDate || new Date().toISOString().split('T')[0];
      const attendanceResponse = await getStudentAttendanceByDate(studentId, todayDate);
      const regularAttendanceRecords = attendanceResponse.success
          ? (Array.isArray(attendanceResponse.data?.regular) ? attendanceResponse.data.regular : []) : [];
      const standupAttendanceRecords = attendanceResponse.success
          ? (Array.isArray(attendanceResponse.data?.standup) ? attendanceResponse.data.standup : []) : [];
      
      const attendanceRecords = [
        ...regularAttendanceRecords.map(r => ({ ...r, category: 'regular' })),
        ...standupAttendanceRecords.map(r => ({ ...r, category: 'standup' }))
      ];

      const [penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
        getPenaltiesByStudent(studentId),
        getParticipationsByStudent(studentId),
        getBehaviors({ studentId })
      ]);
      
      console.log(`[QR_ROSTER_SYNC] fetchStudentHistory for studentId: ${studentId}`, {
        attendance: attendanceRecords?.length,
        penalties: penaltiesResponse?.data?.length,
        participations: participationsResponse?.data?.length,
        behaviors: behaviorsResponse?.data?.length
      });

      const studentPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const studentParticipations = participationsResponse.success ? participationsResponse.data : [];
      const studentBehaviors = behaviorsResponse.success ? behaviorsResponse.data : [];

      // Combine all logs
      const allLogs = [
        ...attendanceRecords,
        ...studentPenalties.map(p => ({ ...p, type: 'PENALTY' })),
        ...studentParticipations.map(p => ({ ...p, type: 'PARTICIPATION' })),
        ...studentBehaviors.map(b => ({ ...b, type: 'BEHAVIOR' }))
      ];

      setStudentHistory(prev => ({ ...prev, [studentId]: allLogs }));
      
      console.log('🔍 StudentRoster - fetchStudentHistory completed for student:', studentId, { logsCount: allLogs.length });
    } catch (err) {
      error('Error fetching student history:', err);
      setStudentHistory(prev => ({ ...prev, [studentId]: [] }));
    } finally {
      setHistoryLoading(prev => ({ ...prev, [studentId]: false }));
      console.log('🔍 StudentRoster - historyLoading set to FALSE for student:', studentId);
    }
  }, [selectedDate]);

  return {
    studentHistory,
    historyLoading,
    todayAttendanceOverrides,
    setTodayAttendanceOverrides,
    isSubmitting,
    setIsSubmitting,
    fetchStudentHistory
  };
};
