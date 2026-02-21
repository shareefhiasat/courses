import { useCallback } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { markAttendance, deleteAttendance } from '@services/business/attendanceService';
import { createParticipation, deleteParticipation } from '@services/business/participationService';
import { createPenalty, deletePenalty } from '@services/business/penaltyService';
import { createBehavior, deleteBehavior } from '@services/business/behaviorService';
import { getPerformedByFields } from '@services/business/userService';
import { ATTENDANCE_METHODS } from '@constants/attendanceMethods';
import eventBus, { EVENTS } from '@utils/eventBus';
import logger from '@utils/logger';

/**
 * Provides inline editing actions for the Attendance tab of the Student Dashboard.
 * Mirrors the action logic from InstructorQRScannerPage but as a reusable hook.
 *
 * @param {string} classId - The class context for attendance actions.
 * @param {string} selectedDate - ISO date string (yyyy-MM-dd).
 * @param {Function} onRefresh - Callback to refresh data after a mutation.
 */
const useStudentAttendanceActions = ({ classId, selectedDate, onRefresh }) => {
  const { user } = useAuth();
  const { t } = useLang();
  const toast = useToast();

  const handleMarkAttendance = useCallback(async (studentId, status, notes = '', method = ATTENDANCE_METHODS.MANUAL_INSTRUCTOR) => {
    if (!classId || !selectedDate) {
      toast?.showError?.(t('select_class_and_date') || 'Please select a class and date first');
      return { success: false };
    }
    try {
      const performedByFields = await getPerformedByFields(user);
      const dateStr = typeof selectedDate === 'string'
        ? selectedDate
        : selectedDate.toISOString().split('T')[0];

      const result = await markAttendance({
        classId,
        studentId,
        date: dateStr,
        status,
        notes,
        method,
        markedBy: user?.uid,
        ...performedByFields,
      });

      if (result?.success !== false) {
        eventBus.emit(EVENTS.ATTENDANCE_MARKED, { studentId, classId, status });
        toast?.showSuccess?.(t('attendance_marked') || 'Attendance marked');
        onRefresh?.();
      }
      return result;
    } catch (error) {
      logger.error('[AttendanceActions] markAttendance failed', error);
      toast?.showError?.(t('failed_to_mark_attendance') || 'Failed to mark attendance');
      return { success: false, error };
    }
  }, [classId, selectedDate, user, t, toast, onRefresh]);

  const handleDeleteAttendance = useCallback(async (studentId, recordId) => {
    try {
      const result = await deleteAttendance(recordId);
      if (result?.success !== false) {
        eventBus.emit(EVENTS.ATTENDANCE_MARKED, { studentId, classId });
        toast?.showSuccess?.(t('record_deleted') || 'Record deleted');
        onRefresh?.();
      }
      return result;
    } catch (error) {
      logger.error('[AttendanceActions] deleteAttendance failed', error);
      toast?.showError?.(t('failed_to_delete_record') || 'Failed to delete record');
      return { success: false, error };
    }
  }, [classId, t, toast, onRefresh]);

  const handleAddParticipation = useCallback(async (studentId, participationData) => {
    try {
      const performedByFields = await getPerformedByFields(user);
      const result = await createParticipation({
        studentId,
        classId,
        date: selectedDate,
        createdBy: user?.uid,
        ...performedByFields,
        ...participationData,
      });
      if (result?.success !== false) {
        eventBus.emit(EVENTS.PARTICIPATION_ADDED, { studentId });
        toast?.showSuccess?.(t('participation_added') || 'Participation added');
        onRefresh?.();
      }
      return result;
    } catch (error) {
      logger.error('[AttendanceActions] createParticipation failed', error);
      toast?.showError?.(t('failed_to_add_participation') || 'Failed to add participation');
      return { success: false, error };
    }
  }, [classId, selectedDate, user, t, toast, onRefresh]);

  const handleDeleteParticipation = useCallback(async (studentId, recordId) => {
    try {
      const result = await deleteParticipation(recordId);
      if (result?.success !== false) {
        eventBus.emit(EVENTS.PARTICIPATION_ADDED, { studentId, status: 'deleted' });
        toast?.showSuccess?.(t('record_deleted') || 'Record deleted');
        onRefresh?.();
      }
      return result;
    } catch (error) {
      logger.error('[AttendanceActions] deleteParticipation failed', error);
      toast?.showError?.(t('failed_to_delete_record') || 'Failed to delete record');
      return { success: false, error };
    }
  }, [t, toast, onRefresh]);

  const handleAddPenalty = useCallback(async (studentId, penaltyData) => {
    try {
      const performedByFields = await getPerformedByFields(user);
      const result = await createPenalty({
        studentId,
        classId,
        date: selectedDate,
        createdBy: user?.uid,
        ...performedByFields,
        ...penaltyData,
      });
      if (result?.success !== false) {
        eventBus.emit(EVENTS.PENALTY_ASSIGNED, { studentId });
        toast?.showSuccess?.(t('penalty_added') || 'Penalty added');
        onRefresh?.();
      }
      return result;
    } catch (error) {
      logger.error('[AttendanceActions] createPenalty failed', error);
      toast?.showError?.(t('failed_to_add_penalty') || 'Failed to add penalty');
      return { success: false, error };
    }
  }, [classId, selectedDate, user, t, toast, onRefresh]);

  const handleDeletePenalty = useCallback(async (studentId, recordId) => {
    try {
      const result = await deletePenalty(recordId);
      if (result?.success !== false) {
        eventBus.emit(EVENTS.PENALTY_ASSIGNED, { studentId, status: 'deleted' });
        toast?.showSuccess?.(t('record_deleted') || 'Record deleted');
        onRefresh?.();
      }
      return result;
    } catch (error) {
      logger.error('[AttendanceActions] deletePenalty failed', error);
      toast?.showError?.(t('failed_to_delete_record') || 'Failed to delete record');
      return { success: false, error };
    }
  }, [t, toast, onRefresh]);

  const handleAddBehavior = useCallback(async (studentId, behaviorData) => {
    try {
      const performedByFields = await getPerformedByFields(user);
      const result = await createBehavior({
        studentId,
        classId,
        date: selectedDate,
        createdBy: user?.uid,
        ...performedByFields,
        ...behaviorData,
      });
      if (result?.success !== false) {
        eventBus.emit(EVENTS.BEHAVIOR_LOGGED, { studentId });
        toast?.showSuccess?.(t('behavior_logged') || 'Behavior logged');
        onRefresh?.();
      }
      return result;
    } catch (error) {
      logger.error('[AttendanceActions] createBehavior failed', error);
      toast?.showError?.(t('failed_to_log_behavior') || 'Failed to log behavior');
      return { success: false, error };
    }
  }, [classId, selectedDate, user, t, toast, onRefresh]);

  const handleDeleteBehavior = useCallback(async (studentId, recordId) => {
    try {
      const result = await deleteBehavior(recordId);
      if (result?.success !== false) {
        eventBus.emit(EVENTS.BEHAVIOR_LOGGED, { studentId, status: 'deleted' });
        toast?.showSuccess?.(t('record_deleted') || 'Record deleted');
        onRefresh?.();
      }
      return result;
    } catch (error) {
      logger.error('[AttendanceActions] deleteBehavior failed', error);
      toast?.showError?.(t('failed_to_delete_record') || 'Failed to delete record');
      return { success: false, error };
    }
  }, [t, toast, onRefresh]);

  return {
    handleMarkAttendance,
    handleDeleteAttendance,
    handleAddParticipation,
    handleDeleteParticipation,
    handleAddPenalty,
    handleDeletePenalty,
    handleAddBehavior,
    handleDeleteBehavior,
  };
};

export default useStudentAttendanceActions;
