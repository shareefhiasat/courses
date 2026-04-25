import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import * as scheduleSessionService from '@services/business/scheduleSessionService';
import * as holidayService from '@services/business/holidayService';
import { info, error, warn, debug } from '@services/utils/logger.js';

export const useScheduleCalendar = (params = {}) => {
  const { user } = useAuth();
  
  const {
    programId = null,
    instructorUserId = null,
    classroomId = null,
    view = 'week',
    initialDate = new Date()
  } = params;
  
  const [sessions, setSessions] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  // Calculate date range based on view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (view) {
      case 'day':
        // Single day
        break;
      case 'week':
        // Week (Sunday to Saturday)
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        end.setDate(end.getDate() + (6 - day));
        break;
      case 'month':
        // Month (first to last day)
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      default:
        break;
    }
    
    return { start, end };
  }, [currentDate, view]);
  
  // Load schedule sessions for date range
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        dateFrom: dateRange.start.toISOString().split('T')[0],
        dateTo: dateRange.end.toISOString().split('T')[0],
        isCancelled: false,
        isActive: true
      };
      
      if (programId) queryParams.programId = programId;
      if (instructorUserId) queryParams.instructorUserId = instructorUserId;
      if (classroomId) queryParams.classroomId = classroomId;
      
      const result = await scheduleSessionService.getScheduleSessionsByRange(queryParams);
      
      if (result.success) {
        setSessions(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, programId, instructorUserId, classroomId]);
  
  // Load holidays for date range
  const loadHolidays = useCallback(async () => {
    try {
      const queryParams = {
        dateFrom: dateRange.start.toISOString().split('T')[0],
        dateTo: dateRange.end.toISOString().split('T')[0]
      };
      
      if (programId) queryParams.programId = programId;
      
      const result = await holidayService.getHolidaysByProgram(programId);
      
      if (result.success) {
        setHolidays(result.data);
      }
    } catch (error) {
      error('[useScheduleCalendar] Error loading holidays:', error);
    }
  }, [dateRange, programId]);
  
  // Navigate to previous period
  const goToPrevious = useCallback(() => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, view]);
  
  // Navigate to next period
  const goToNext = useCallback(() => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    
    setCurrentDate(newDate);
  }, [currentDate, view]);
  
  // Navigate to today
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);
  
  // Navigate to specific date
  const goToDate = useCallback((date) => {
    setCurrentDate(new Date(date));
  }, []);
  
  // Change view
  const changeView = useCallback((newView) => {
    return newView;
  }, []);
  
  // Get sessions for a specific date
  const getSessionsForDate = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions.filter(session => {
      const sessionDate = new Date(session.date).toISOString().split('T')[0];
      return sessionDate === dateStr;
    });
  }, [sessions]);
  
  // Get holidays for a specific date
  const getHolidaysForDate = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.filter(holiday => {
      const holidayStart = new Date(holiday.startDate).toISOString().split('T')[0];
      const holidayEnd = new Date(holiday.endDate).toISOString().split('T')[0];
      return dateStr >= holidayStart && dateStr <= holidayEnd;
    });
  }, [holidays]);
  
  // Check if a date has conflicts
  const hasConflictsOnDate = useCallback((date) => {
    const dateSessions = getSessionsForDate(date);
    const conflicts = [];
    
    // Check for teacher conflicts
    const teacherMap = new Map();
    dateSessions.forEach(session => {
      const key = `${session.instructorUserId}_${session.timeSlotId}`;
      if (teacherMap.has(key)) {
        conflicts.push({
          type: 'TEACHER_CONFLICT',
          session1: teacherMap.get(key),
          session2: session
        });
      } else {
        teacherMap.set(key, session);
      }
    });
    
    // Check for classroom conflicts
    const classroomMap = new Map();
    dateSessions.forEach(session => {
      if (session.classroomId) {
        const key = `${session.classroomId}_${session.timeSlotId}`;
        if (classroomMap.has(key)) {
          conflicts.push({
            type: 'CLASSROOM_CONFLICT',
            session1: classroomMap.get(key),
            session2: session
          });
        } else {
          classroomMap.set(key, session);
        }
      }
    });
    
    return conflicts.length > 0 ? conflicts : null;
  }, [getSessionsForDate]);
  
  // Get session statistics
  const sessionStats = useMemo(() => {
    const stats = {
      total: sessions.length,
      byInstructor: {},
      byClassroom: {},
      bySubject: {}
    };
    
    sessions.forEach(session => {
      // By instructor
      const instructorId = session.instructorUserId;
      if (!stats.byInstructor[instructorId]) {
        stats.byInstructor[instructorId] = {
          count: 0,
          name: session.instructor?.displayName || session.instructor?.firstName || 'Unknown'
        };
      }
      stats.byInstructor[instructorId].count++;
      
      // By classroom
      if (session.classroomId) {
        const classroomId = session.classroomId;
        if (!stats.byClassroom[classroomId]) {
          stats.byClassroom[classroomId] = {
            count: 0,
            name: session.classroom?.nameEn || session.classroom?.code || 'Unknown'
          };
        }
        stats.byClassroom[classroomId].count++;
      }
      
      // By subject
      const subjectId = session.subjectId;
      if (!stats.bySubject[subjectId]) {
        stats.bySubject[subjectId] = {
          count: 0,
          name: session.subject?.nameEn || session.subject?.code || 'Unknown'
        };
      }
      stats.bySubject[subjectId].count++;
    });
    
    return stats;
  }, [sessions]);
  
  // Load data when date range or filters change
  useEffect(() => {
    loadSessions();
    loadHolidays();
  }, [loadSessions, loadHolidays]);
  
  return {
    // State
    sessions,
    holidays,
    loading,
    error,
    currentDate,
    selectedDate,
    dateRange,
    sessionStats,
    
    // Navigation
    goToPrevious,
    goToNext,
    goToToday,
    goToDate,
    changeView,
    
    // Selection
    setSelectedDate,
    
    // Data access
    getSessionsForDate,
    getHolidaysForDate,
    hasConflictsOnDate,
    
    // Refresh
    loadSessions,
    loadHolidays
  };
};

export default useScheduleCalendar;
