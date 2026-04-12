import { useState, useEffect, useCallback } from 'react';
import { ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes.js';
import { getAttendance } from '@services/api/apiService.js';
import { info, error } from '@services/utils/logger.js';

/**
 * Custom hook for fetching and managing attendance data
 * Handles both regular and standup attendance for a class on a specific date
 */
export const useAttendanceData = (classId, dateStr) => {
  const [regularAttendance, setRegularAttendance] = useState([]);
  const [standupAttendance, setStandupAttendance] = useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (!classId || !dateStr) {
      setRegularAttendance([]);
      setStandupAttendance([]);
      return;
    }

    setIsLoadingAttendance(true);
    try {
      const regular = await getAttendance(classId, dateStr, ATTENDANCE_TYPE_CATEGORY.REGULAR);
      const standup = await getAttendance(classId, dateStr, ATTENDANCE_TYPE_CATEGORY.STANDUP);
      setRegularAttendance(regular || []);
      setStandupAttendance(standup || []);
    } catch (err) {
      error('Failed to fetch attendance:', err);
      setRegularAttendance([]);
      setStandupAttendance([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [classId, dateStr]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    regularAttendance,
    standupAttendance,
    isLoadingAttendance,
    refetchAttendance: fetchAttendance
  };
};
