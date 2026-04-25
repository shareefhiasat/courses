import { useState, useCallback } from 'react';
import { checkConflicts as checkConflictsService } from '@services/business/scheduleSessionService';
import { info, error, warn, debug } from '@services/utils/logger.js';

export const useConflictCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [conflictResult, setConflictResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Check for scheduling conflicts
  const checkConflicts = useCallback(async (params) => {
    setIsChecking(true);
    setError(null);
    setConflictResult(null);
    
    try {
      info('[useConflictCheck] Checking conflicts', params);
      
      const result = await checkConflictsService(params);
      
      setConflictResult(result);
      
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Failed to check conflicts';
      setError(errorMessage);
      error('[useConflictCheck] Error checking conflicts:', errorMessage);
      
      return {
        success: false,
        hasConflicts: false,
        conflicts: [],
        canSchedule: false,
        error: errorMessage
      };
    } finally {
      setIsChecking(false);
    }
  }, []);
  
  // Check conflicts for a single session
  const checkSessionConflicts = useCallback(async (sessionData) => {
    const { instructorUserId, date, timeSlotId, classroomId, programId } = sessionData;
    
    if (!instructorUserId || !date || !timeSlotId) {
      return {
        success: false,
        hasConflicts: false,
        conflicts: [],
        canSchedule: false,
        error: 'Instructor user ID, date, and time slot ID are required'
      };
    }
    
    return await checkConflicts({
      instructorUserId,
      date,
      timeSlotId,
      classroomId,
      programId
    });
  }, [checkConflicts]);
  
  // Check conflicts for multiple sessions
  const checkBulkConflicts = useCallback(async (sessions) => {
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return {
        success: false,
        hasConflicts: false,
        conflicts: [],
        canSchedule: false,
        error: 'Sessions array is required'
      };
    }
    
    const allConflicts = [];
    let hasAnyConflicts = false;
    
    for (const session of sessions) {
      const result = await checkSessionConflicts(session);
      if (result.hasConflicts) {
        hasAnyConflicts = true;
        allConflicts.push(...result.conflicts.map(conflict => ({
          ...conflict,
          sessionData: session
        })));
      }
    }
    
    return {
      success: true,
      hasConflicts: hasAnyConflicts,
      conflicts: allConflicts,
      canSchedule: !hasAnyConflicts
    };
  }, [checkSessionConflicts]);
  
  // Get localized conflict message
  const getConflictMessage = useCallback((conflict, lang = 'en') => {
    const messages = {
      TEACHER_CONFLICT: {
        en: 'Teacher already has a session scheduled at this time',
        ar: 'المعلم لديه بالفعل جلسة مجدولة في هذا الوقت'
      },
      CLASSROOM_CONFLICT: {
        en: 'Classroom already booked at this time',
        ar: 'الفصل الدراسي محجوز بالفعل في هذا الوقت'
      },
      MAX_SESSIONS_EXCEEDED: {
        en: `Teacher exceeds maximum sessions per day (${conflict.details?.maxAllowed || 3})`,
        ar: `المعلم يتجاوز الحد الأقصى للجلسات اليومية (${conflict.details?.maxAllowed || 3})`
      },
      WEEKEND_CONFLICT: {
        en: 'Date falls on weekend (Friday/Saturday)',
        ar: 'التاريخ يقع في عطلة نهاية الأسبوع (الجمعة/السبت)'
      },
      HOLIDAY_CONFLICT: {
        en: `Date falls on holiday: ${conflict.details?.holiday?.descriptionEn || conflict.details?.holiday?.descriptionAr}`,
        ar: `التاريخ يقع في عطلة: ${conflict.details?.holiday?.descriptionAr || conflict.details?.holiday?.descriptionEn}`
      }
    };
    
    const conflictMessages = messages[conflict.type] || messages.TEACHER_CONFLICT;
    return conflictMessages[lang] || conflictMessages.en;
  }, []);
  
  // Get conflict severity level
  const getConflictSeverity = useCallback((conflict) => {
    const severityMap = {
      TEACHER_CONFLICT: 'high',
      CLASSROOM_CONFLICT: 'high',
      MAX_SESSIONS_EXCEEDED: 'medium',
      WEEKEND_CONFLICT: 'medium',
      HOLIDAY_CONFLICT: 'medium'
    };
    
    return severityMap[conflict.type] || 'medium';
  }, []);
  
  // Get conflict icon
  const getConflictIcon = useCallback((conflict) => {
    const iconMap = {
      TEACHER_CONFLICT: '👨‍🏫',
      CLASSROOM_CONFLICT: '🏫',
      MAX_SESSIONS_EXCEEDED: '📊',
      WEEKEND_CONFLICT: '📅',
      HOLIDAY_CONFLICT: '🎉'
    };
    
    return iconMap[conflict.type] || '⚠️';
  }, []);
  
  // Reset conflict state
  const resetConflicts = useCallback(() => {
    setConflictResult(null);
    setError(null);
  }, []);
  
  return {
    isChecking,
    conflictResult,
    error,
    checkConflicts,
    checkSessionConflicts,
    checkBulkConflicts,
    getConflictMessage,
    getConflictSeverity,
    getConflictIcon,
    resetConflicts
  };
};

export default useConflictCheck;
