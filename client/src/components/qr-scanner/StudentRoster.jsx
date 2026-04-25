import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { Input } from '@ui';
import { Button } from '@ui';
import { Card, CardBody } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import PortalTooltip from '@ui/PortalTooltip';
import { ATTENDANCE_STATUS_LABELS, getAttendanceColor, getAttendanceLabel, getLocalizedAttendanceLabel, ATTENDANCE_STATUS, ATTENDANCE_TYPE_CATEGORY } from '@constants/attendanceTypes';
import { calculateAttentionScore, getRowHighlightStyle } from '@utils/attendanceHighlight.js';
import { getNoteTypeFromStatus } from '@constants/noteTypes';
import { getAttendanceByStudent, rosterQuickAction, deleteAttendance, getStudentAttendanceByDate, markAttendance } from '@services/business/attendanceServiceUnified.js';
import { getPenalties, getPenaltiesByStudent, deletePenalty } from '@services/business/penaltyService';
import { getParticipations, getParticipationsByStudent, deleteParticipation } from '@services/business/participationService';
import { getBehaviors, deleteBehavior } from '@services/business/behaviorService';
import { CheckSmallIcon, ClockSmallIcon } from '@utils/icons.jsx';
import eventBus, { EVENTS } from '@utils/eventBus';
import { generateReferenceId, generateStudentQRCode } from '@utils/qrCode';
import { QRCodeDisplay, useQRCodeEmail } from '@utils/qrCodeUtils';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getFavoriteStudents, addFavoriteStudent, removeFavoriteStudent } from '@services/business/userPreferenceService';
import { getUserProfile } from '@services/business/userService';
// import { notificationGateway } from '@services/business/notificationGateway'; // Removed - notifications now handled by backend
// import { NOTIFICATION_TRIGGERS } from '@constants/notificationTypes'; // Removed - notifications now handled by backend
import { StudentHistory, StudentRosterHistory } from '@ui/history';
import { DeleteModal } from '@ui';
import { StudentCard, StudentTableRow } from '@ui/history';
import { usePermissions } from '@hooks/usePermissions';

const StudentRoster = React.memo(function StudentRoster({
  students,
  onStudentSelect,
  selectedStudentId,
  onTogglePin,
  onDownload,
  onFilter,
  onRefresh,
  autoExpand = false, // New prop for auto-expansion
  onStudentAction = () => {},
  searchQuery,
  onSearchChange,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  totalStudents,
  selectedProgramId,
  selectedSubjectId,
  selectedClassId,
  selectedDate,
  attendanceMode = 'regular',
  highlightEnabled = true,
  onHighlightToggle = null,
  showSuccess = (msg) => console.log('SUCCESS:', msg)
}) {
  const {user} = useAuth();
  const {theme} = useTheme();
  const {t, lang, isRTL} = useLang();
  const { data: lookupData } = useLookupTypes({
    types: ['penalty-types', 'behavior-types', 'participation-types']
  });
  const { hasPermission } = usePermissions();
  const canSeeStandupMode = hasPermission('qr-scanner.canSeeStandupMode');
  const canDeleteAttendance = hasPermission('qr-scanner.canDeleteAttendance');
  const canEditAttendance = hasPermission('qr-scanner.canEditAttendance');
  const canUseStatsPanel = hasPermission('qr-scanner.canUseStatsPanel');
  const canUseZapPanel = hasPermission('qr-scanner.canUseZapPanel');
  const canSeeQuickButtons = hasPermission('qr-scanner.canSeeQuickButtons');
  const canMarkAttendance = hasPermission('qr-scanner.canMarkAttendance');
  const canUseQuickAttendance = canSeeQuickButtons && canMarkAttendance;
  
  // Force attendanceMode to REGULAR if user doesn't have canSeeStandupMode permission
  const effectiveAttendanceMode = canSeeStandupMode ? attendanceMode : ATTENDANCE_TYPE_CATEGORY.REGULAR;
  
  // DEBUG: Log attendanceMode
  console.log('🔍 StudentRoster - attendanceMode:', attendanceMode, 'effective:', effectiveAttendanceMode);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [deleteLogId, setDeleteLogId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [studentHistory, setStudentHistory] = useState({});
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [activeFilters, setActiveFilters] = useState({
    attendance: true,
    participation: true,
    behavior: true,
    penalties: true
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteStudents, setFavoriteStudents] = useState([]);
  const [sendingEmails, setSendingEmails] = useState({}); // Track sending state per student

  const toYmd = useCallback((tsOrDate) => {
    if (!tsOrDate) return null;
    const d = tsOrDate?.toDate ? tsOrDate.toDate() : new Date(tsOrDate);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Check if all dropdowns are selected to show total attendance column
  const showTotalAttendance = selectedProgramId &&
      selectedProgramId !== 'all' &&
      selectedSubjectId &&
      selectedSubjectId !== 'all' &&
      selectedClassId &&
      selectedClassId !== 'all' &&
      selectedDate;

  // Load favorite students from Firebase
  useEffect(() => {
    if (user?.uid) {
      getFavoriteStudents(user.uid).then(setFavoriteStudents);
    }
  }, [user?.uid]);

  // Memoized fetchStudentHistory to prevent unnecessary re-renders
  const fetchStudentHistory = useCallback(async (studentId) => {
    console.log('🔍 StudentRoster - fetchStudentHistory called for student:', studentId);
    
    // Guard against undefined studentId
    if (!studentId) {
      console.warn('⚠️ StudentRoster - fetchStudentHistory called with undefined studentId, skipping');
      return;
    }
    
    // Set loading state for this student
    setHistoryLoading(prev => ({ ...prev, [studentId]: true }));
    
    try {
      // Get all attendance records for this student (regular and standup)
      const attendanceResponse = await getAttendanceByStudent(studentId);
      const attendanceRecords = attendanceResponse.success
          ? attendanceResponse.data : [];

      // Get standup attendance records
      const standupAttendanceResponse = await import('@services/business/standupAttendanceService.js').then(
        service => service.getStandupAttendanceByUser(studentId)
      );
      const standupAttendanceRecords = standupAttendanceResponse.success
          ? standupAttendanceResponse.data : [];

      // Merge regular and standup attendance records (only if user has canSeeStandupMode permission)
      const allAttendanceRecords = canSeeStandupMode 
        ? [...attendanceRecords, ...standupAttendanceRecords]
        : attendanceRecords;

      const [penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
        getPenalties(studentId),
        getParticipations(),
        getBehaviors()
      ]);
      
      debug('🔧 fetchStudentHistory called getPenalties with studentId:', studentId);

      const studentPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const studentParticipations = (participationsResponse.success ? participationsResponse.data : []).filter(p => p.studentId === studentId);
      const studentBehaviors = (behaviorsResponse.success ? behaviorsResponse.data : []).filter(b => b.studentId === studentId);

      // Combine and format logs
      const logs = [
        ...allAttendanceRecords.filter(r => r.status || r.statusId).map(record => {
          // Map statusId to status string for both regular and standup attendance
          const statusIdMap = {
            1: 'PRESENT',
            2: 'LATE',
            3: 'ABSENT',
            4: 'ABSENT_NO_EXCUSE',
            5: 'ABSENT_WITH_EXCUSE',
            6: 'HUMAN_CASE',
            7: 'STANDUP_PRESENT',
            8: 'STANDUP_LATE',
            9: 'STANDUP_ABSENT',
            10: 'STANDUP_CLINIC'
          };
          
          // Ensure status is a string for display
          const statusStr = record.statusId 
            ? statusIdMap[record.statusId] || 'Unknown'
            : (typeof record.status === 'object' 
              ? (record.status?.code || record.status?.nameEn || 'Unknown') 
              : record.status);
          
          const logEntry = {
            id: record.id,
            type: RECORD_TYPES.ATTENDANCE,
            date: record.date || toYmd(record.timestamp) || toYmd(record.updatedAt) || toYmd(record.createdAt),
            time: record.createdAt || record.updatedAt || record.timestamp,
            label: getLocalizedAttendanceLabel(statusStr, t, lang) || statusStr || 'Unknown',
            points: 0,
            comment: record.reason || record.notes || '',
            color: ATTENDANCE_STATUS_LABELS[statusStr]?.color || '#6b7280',
            status: record.status,  // ← Keep original status object for other uses
            method: record.method, // ← Add method field for localization
            // Add user information - use creator from database first, then fallback to markedBy/performedBy
            performedBy: record.creator?.id || record.markedBy || record.performedBy,
            performedByName: record.creator?.displayName || record.markedByName || record.performedByName,
            performedByEmail: record.creator?.email || record.markedByEmail || record.performedByEmail
          };

          debug('Processing attendance record:', {
            id: record.id,
            status: record.status,
            category: record.category,
            delta: record.delta,
            markedBy: record.markedBy,
            markedByName: record.markedByName,
            markedByEmail: record.markedByEmail,
            performedBy: record.performedBy,
            performedByName: record.performedByName,
            resultingType: logEntry.type,
            resultingLabel: logEntry.label,
            finalPerformedByName: logEntry.performedByName
          });

          return logEntry;
        }),
        ...studentParticipations.map(p => {
          const points = Number(p.points) || 0;
          const pTypeDef = (lookupData['participation-types'] || []).find(pt => pt.id === p.type);
          const label = pTypeDef 
            ? (lang === 'ar' ? (pTypeDef.nameAr || pTypeDef.nameEn) : pTypeDef.nameEn)
            : (p.type || RECORD_TYPES.PARTICIPATION);
          return {
            id: p.docId || p.id,
            type: RECORD_TYPES.PARTICIPATION,
            date: p.date || toYmd(p.createdAt) || toYmd(p.updatedAt),
            time: p.createdAt,
            label: label,
            points: points,
            comment: p.description || '',
            severity: 'low',
            color: '#dbeafe',
            // Add user information - use creator from database first
            performedBy: p.creator?.id || p.performedBy,
            performedByName: p.creator?.displayName || p.performedByName,
            performedByEmail: p.creator?.email || p.performedByEmail,
            user: p.user,
            createdBy: p.createdBy
          };
        }),
        ...studentBehaviors.map(b => {
          const points = Number(b.points) || 0;
          const bTypeDef = (lookupData['behavior-types'] || []).find(bt => bt.id === b.type);
          const label = bTypeDef 
            ? (lang === 'ar' ? (bTypeDef.nameAr || bTypeDef.nameEn) : bTypeDef.nameEn)
            : (b.type || RECORD_TYPES.BEHAVIOR);
          return {
            id: b.docId || b.id,
            type: RECORD_TYPES.BEHAVIOR,
            date: b.date || toYmd(b.createdAt) || toYmd(b.updatedAt),
            time: b.createdAt,
            label: label,
            points: -Math.abs(points),
            comment: b.description || '',
            severity: 'low',
            color: '#fff7ed',
            // Add user information - use creator from database first
            performedBy: b.creator?.id || b.performedBy,
            performedByName: b.creator?.displayName || b.performedByName,
            performedByEmail: b.creator?.email || b.performedByEmail,
            user: b.user,
            createdBy: b.createdBy
          };
        }),
        ...studentPenalties.map(penalty => {
          const pType = penalty.type; // Use the 'type' field directly
          const penaltyDef = (lookupData['penalty-types'] || []).find(pt => pt.id === pType);
          const label = penaltyDef 
            ? (lang === 'ar' ? (penaltyDef.nameAr || penaltyDef.nameEn) : penaltyDef.nameEn)
            : pType || 'Penalty';
          
          return {
            id: penalty.docId || penalty.id,
            type: RECORD_TYPES.PENALTY,
            date: penalty.date || (penalty.createdAt?.toDate
                ? penalty.createdAt.toDate().toISOString().split('T')[0]
                : new Date(penalty.createdAt).toISOString().split('T')[0]),
            time: penalty.createdAt,
            label: label,
            points: -Math.abs(penalty.points || 0),
            comment: penalty.reason || penalty.note || penalty.comment || '',
            severity: penalty.severity || 'medium',
            color: penalty.points > 0 ? '#dcfce7' : '#fee2e2',
            // Add user information - use creator from database first
            performedBy: penalty.creator?.id || penalty.performedBy,
            performedByName: penalty.creator?.displayName || penalty.performedByName,
            performedByEmail: penalty.creator?.email || penalty.performedByEmail,
            user: penalty.user,
            createdBy: penalty.createdBy
          };
        })
      ].sort((a, b) => {
        const dateA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const dateB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        const result = dateB - dateA;
        debug('🔍 StudentRoster sort comparison:', {
          logA: { id: a.id, type: a.type, date: a.date, time: a.time, parsedDate: dateA },
          logB: { id: b.id, type: b.type, date: b.date, time: b.time, parsedDate: dateB },
          result
        });
        return result;
      });

      setStudentHistory(prev => ({
        ...prev,
        [studentId]: logs
      }));
      
      console.log('🔍 StudentRoster - fetchStudentHistory completed for student:', studentId, {
        logsCount: logs.length
      });
    } catch (error) {
      error('Error fetching student history:', error);
    } finally {
      // Clear loading state for this student
      setHistoryLoading(prev => ({ ...prev, [studentId]: false }));
      console.log('🔍 StudentRoster - historyLoading set to FALSE for student:', studentId);
    }
  }, [lang, t, toYmd, lookupData]);

  const handleDeleteAttendance = async (studentId, logId) => {
    setDeleteType(RECORD_TYPES.ATTENDANCE);
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  };

  const handleDeletePenalty = async (studentId, logId) => {
    setDeleteType(RECORD_TYPES.PENALTY);
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  };

  const handleDeleteParticipation = async (studentId, logId) => {
    setDeleteType(RECORD_TYPES.PARTICIPATION);
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  };

  const handleDeleteBehavior = async (studentId, logId) => {
    setDeleteType(RECORD_TYPES.BEHAVIOR);
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  };

  // Handle actual deletion after confirmation
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      let result;
      if (deleteType === RECORD_TYPES.ATTENDANCE) {
        result = await deleteAttendance(deleteLogId);
        if (result.success) {
          // Find the student ID from the log or refresh all
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          // Extract studentId from logId if it's in string format (e.g., "attendance_91")
          const studentId = typeof deleteLogId === 'string' ? deleteLogId.split('_')[1] : null;
          eventBus.emit(EVENTS.ATTENDANCE_MARKED, {studentId});
          eventBus.emit(EVENTS.ATTENDANCE_DELETED, {studentId});
          // Refresh students list to update totals
          if (onRefresh) {
            onRefresh();
          }
        }
      } else if (deleteType === RECORD_TYPES.PENALTY) {
        result = await deletePenalty(deleteLogId);
        if (result.success) {
          // Find the student ID from the log or refresh all
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          // Extract studentId from logId if it's in string format (e.g., "penalty_91")
          const studentId = typeof deleteLogId === 'string' ? deleteLogId.split('_')[1] : null;
          eventBus.emit(EVENTS.PENALTY_ASSIGNED, {studentId});
          // Refresh students list to update totals
          if (onRefresh) {
            onRefresh();
          }
        }
      } else if (deleteType === RECORD_TYPES.PARTICIPATION) {
        result = await deleteParticipation(deleteLogId);
        if (result.success) {
          // Find the student ID from the log or refresh all
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          // Extract studentId from logId if it's in string format (e.g., "participation_91")
          const studentId = typeof deleteLogId === 'string' ? deleteLogId.split('_')[1] : null;
          eventBus.emit(EVENTS.PARTICIPATION_ADDED, {studentId, status: 'deleted'});
          // Refresh students list to update totals
          if (onRefresh) {
            onRefresh();
          }
        }
      } else if (deleteType === RECORD_TYPES.BEHAVIOR) {
        result = await deleteBehavior(deleteLogId);
        if (result.success) {
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          // Extract studentId from logId if it's in string format (e.g., "behavior_91")
          const studentId = typeof deleteLogId === 'string' ? deleteLogId.split('_')[1] : null;
          eventBus.emit(EVENTS.BEHAVIOR_LOGGED, {studentId, status: 'deleted'});
          // Refresh students list to update totals
          if (onRefresh) {
            onRefresh();
          }
        }
      }
    } catch (err) {
      error(`Error deleting ${deleteType}:`, err);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setDeleteType('');
      setDeleteLogId('');
    }
  };

  // Auto-expand all students when autoExpand prop changes
  useEffect(() => {
    if (autoExpand && students.length > 0) {
      const allStudentIds = new Set(students.map(s => s.id));
      setExpandedRows(allStudentIds);
      
      // Fetch history for all students
      students.forEach(student => {
        if (!studentHistory[student.id]) {
          fetchStudentHistory(student.id);
        }
      });
    }
  }, [autoExpand, students, fetchStudentHistory, studentHistory]);

  // Listen for real-time activity updates
  useEffect(() => {
    const unsubscribeActivity = eventBus.on(EVENTS.ACTIVITY_UPDATE, () => {
      // logger.log('StudentRoster: Activity update received');
      // Refresh student history for all expanded students
      const expandedStudents = Array.from(expandedRows);
      expandedStudents.forEach(studentId => {
        fetchStudentHistory(studentId);
      });
    });

    const unsubscribeAttendance = eventBus.on(EVENTS.ATTENDANCE_MARKED,
        (data) => {
          debug('=== STUDENT ROSTER ATTENDANCE MARKED EVENT ===');
          debug('Attendance marked event received:', {
            studentId: data.studentId,
            referenceId: data.referenceId,
            status: data.status,
            classId: data.classId,
            performedBy: data.performedBy,
            timestamp: data.timestamp,
            isRowExpanded: expandedRows.has(data.studentId),
            hasOnRefresh: !!onRefresh
          });

          // Always refresh history for this student when attendance is marked
          // This ensures today's attendance appears in history immediately

          // Primary: Use user ID (data.studentId) for data consistency
          // Fallback: Use reference ID if user ID not found
          let studentIdToFetch = data.studentId;

          // Try to find the student in our students array to get the correct ID
          const student = students.find(s =>
              s.id === data.studentId || // Primary match: user ID
              s.id === data.referenceId || // Fallback: reference ID matches user ID
              s.studentId === data.referenceId || // Fallback: studentId field matches reference ID
              `STU-${s.studentNumber}` === data.referenceId // Fallback: generated reference ID
          );

          if (student) {
            studentIdToFetch = student.id; // Always use the user ID from student object
          }

          debug('Student lookup result:', {
            found: !!student,
            originalStudentId: data.studentId,
            referenceId: data.referenceId,
            studentIdToFetch,
            studentData: student ? {
              id: student.id,
              studentId: student.studentId,
              referenceId: student.referenceId,
              studentNumber: student.studentNumber
            } : null
          });

          fetchStudentHistory(studentIdToFetch);

          // Also refresh history if row is expanded (this handles the expanded case)
          if (expandedRows.has(studentIdToFetch)) {
            debug('Refreshing student history for expanded row:',
                studentIdToFetch);
            fetchStudentHistory(studentIdToFetch);
          }

          // Update the student's attendance status in real-time
          // This ensures the main roster display reflects the new attendance
          if (data.status && onRefresh) {
            debug('Triggering onRefresh to update attendance status');
            // Trigger a refresh of the students data to update attendance status
            setTimeout(() => {
              onRefresh();
            }, 100); // Small delay to ensure Firebase has processed the update
          } else {
            debug(
                'Not triggering onRefresh - missing status or onRefresh', {
                  hasStatus: !!data.status,
                  hasOnRefresh: !!onRefresh
                });
          }

          debug('=== END STUDENT ROSTER ATTENDANCE MARKED EVENT ===');
        });

    const unsubscribeBehavior = eventBus.on(EVENTS.BEHAVIOR_LOGGED, (data) => {
      // logger.log('StudentRoster: Behavior logged for', data.studentId);
      if (expandedRows.has(data.studentId)) {
        fetchStudentHistory(data.studentId);
      }

      // Refresh students data to update behavior points
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 100);
      }
    });

    const unsubscribeParticipation = eventBus.on(EVENTS.PARTICIPATION_ADDED,
        (data) => {
          // logger.log('StudentRoster: Participation added for', data.studentId);
          if (expandedRows.has(data.studentId)) {
            fetchStudentHistory(data.studentId);
          }

          // Refresh students data to update participation points
          if (onRefresh) {
            setTimeout(() => {
              onRefresh();
            }, 100);
          }
        });

    const unsubscribePenalty = eventBus.on(EVENTS.PENALTY_ASSIGNED, (data) => {
      // logger.log('StudentRoster: Penalty assigned for', data.studentId);
      if (expandedRows.has(data.studentId)) {
        fetchStudentHistory(data.studentId);
      }

      // Refresh students data to update penalty points
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 100);
      }
    });

    // Add refresh event listeners
    const unsubscribeRefreshRoster = eventBus.on(EVENTS.REFRESH_ROSTER, () => {
      if (onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 100);
      }
    });

    const unsubscribeRefreshStudent = eventBus.on(EVENTS.REFRESH_STUDENT_DATA, (data) => {
      // Refresh specific student history if expanded
      if (data?.studentId && expandedRows.has(data.studentId)) {
        fetchStudentHistory(data.studentId);
      }
      
      // Refresh entire roster if no specific student ID
      if (!data?.studentId && onRefresh) {
        setTimeout(() => {
          onRefresh();
        }, 100);
      }
    });

    const unsubscribeRefreshRecent = eventBus.on(EVENTS.REFRESH_RECENT_ACTIVITY, () => {
      // Refresh all expanded students
      const expandedStudents = Array.from(expandedRows);
      expandedStudents.forEach(studentId => {
        fetchStudentHistory(studentId);
      });
    });

    const unsubscribeRefreshToday = eventBus.on(EVENTS.REFRESH_TODAY_ACTIVITY, () => {
      // Refresh all expanded students for today's activity
      const expandedStudents = Array.from(expandedRows);
      expandedStudents.forEach(studentId => {
        fetchStudentHistory(studentId);
      });
    });

    return () => {
      unsubscribeActivity();
      unsubscribeAttendance();
      unsubscribeBehavior();
      unsubscribeParticipation();
      unsubscribePenalty();
      unsubscribeRefreshRoster();
      unsubscribeRefreshStudent();
      unsubscribeRefreshRecent();
      unsubscribeRefreshToday();
    };
  }, [expandedRows, fetchStudentHistory, onRefresh, students]);

  const toggleFavorite = useCallback(async (studentId) => {
    if (!user?.uid) return;

    const isFavorite = favoriteStudents.includes(studentId);
    console.log('🔖 Filter toggleFavorite called for student:', studentId);
    console.log('🔖 Filter isFavorite before toggle:', isFavorite);
    console.log('🔖 Filter current favoriteStudents:', favoriteStudents);
    
    let success = false;

    if (isFavorite) {
      console.log('🔖 Filter Removing student from favorites:', studentId);
      success = await removeFavoriteStudent(user.uid, studentId);
      setFavoriteStudents(prev => {
        const newFavorites = prev.filter(id => id !== studentId);
        console.log('🔖 Filter Favorites after removal:', newFavorites);
        return newFavorites;
      });
    } else {
      console.log('🔖 Filter Adding student to favorites:', studentId);
      success = await addFavoriteStudent(user.uid, studentId);
      setFavoriteStudents(prev => {
        const newFavorites = [...prev, studentId];
        console.log('🔖 Filter Favorites after addition:', newFavorites);
        return newFavorites;
      });
    }

    if (!success) {
      logger.error('Failed to update favorite status');
      console.error('🔖 Filter Failed to update favorite status for student:', studentId);
    } else {
      console.log('🔖 Filter Successfully updated favorite status for student:', studentId, 'isFavorite:', !isFavorite);
    }
  }, [user?.uid, favoriteStudents]);

  const toggleRowExpansion = useCallback(async (studentId) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(studentId)) {
        newExpanded.delete(studentId);
      } else {
        newExpanded.add(studentId);
        // Fetch historical data for this student if not already loaded
        if (!studentHistory[studentId]) {
          fetchStudentHistory(studentId);
        }
      }
      return newExpanded;
    });
  }, [studentHistory, fetchStudentHistory]);

  // QR Code utilities
  const { openQRCodeInNewTab } = QRCodeDisplay({});
  const { sendQRCodeEmail } = useQRCodeEmail();

  // Senior-Level Quick Attendance Handler for Roster
  const handleQuickAttendance = useCallback(async (student, status, mode, programIdParam) => {
    if (!student || !status) return;

    // Use the passed programId or fall back to selectedProgramId
    const programIdToUse = programIdParam || selectedProgramId;

    // Prevent regular Present and Late marking when in stand-up mode
    // But allow STANDUP_PRESENT and STANDUP_LATE
    console.log('🔍 StudentRoster handleQuickAttendance - attendanceMode:', attendanceMode);
    console.log('🔍 StudentRoster handleQuickAttendance - status:', status);
    console.log('🔍 StudentRoster handleQuickAttendance - programId:', programIdToUse);
    console.log('🔍 StudentRoster handleQuickAttendance - isStandupMode:', attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP);
    console.log('🔍 StudentRoster handleQuickAttendance - shouldBlock:', attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && (status === 'PRESENT' || status === 'LATE'));

    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP &&
        (status === 'PRESENT' || status === 'LATE')) {
      debug('🚫 Regular Present/Late marking blocked in stand-up mode:', { status, attendanceMode });
      return;
    }

    // Check if student already has attendance for today
    const studentAttendanceStatus = student.attendance || student.standupStatus;
    if (studentAttendanceStatus) {
      // Attendance exists - check if user has edit permission
      if (!canEditAttendance) {
        warn('🚫 User does not have edit permission. Cannot change existing attendance:', {
          studentId: student.id,
          currentStatus: studentAttendanceStatus,
          requestedStatus: status
        });
        showSuccess('You do not have permission to edit existing attendance');
        return;
      }
    }

    try {
      // Get user profile to get proper display name
      const userProfile = await getUserProfile(user);
      const displayName = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email || 'Unknown';

      // Debug: Log user objects to see what data is available
      debug('🔧 User objects:', {
        authUser: {
          uid: user?.uid,
          displayName: user?.displayName,
          email: user?.email,
          photoURL: user?.photoURL
        },
        userProfile: userProfile,
        finalDisplayName: displayName
      });

      // Create enhanced user object with proper display name
      const enhancedUser = {
        ...user,
        displayName: displayName
      };

      console.log('🔍 [StudentRoster rosterQuickAction] Calling with:', {
        studentId: student.id,
        classId: selectedClassId,
        status,
        programId: programIdToUse,
        subjectId: selectedSubjectId,
        attendanceMode
      });

      // Use the dedicated roster quick action method
      const result = await rosterQuickAction(
        student.id,
        selectedClassId,
        status,
        enhancedUser,
        attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP
          ? getNoteTypeFromStatus(status, 'standup')
          : getNoteTypeFromStatus(status, 'quick'),
        programIdToUse,
        selectedSubjectId,
        selectedDate,
        attendanceMode
      );

      if (result.success) {
        // Show success feedback
        debug(`✅ ${student.displayName || student.name} marked as ${getLocalizedAttendanceLabel(status, t, lang)}`);
        
        // Emit real-time event
        eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
          studentId: student.id,
          studentNumber: student.studentNumber,
          referenceId: student.referenceId,
          classId: selectedClassId,
          status,
          performedBy: user,
          timestamp: new Date(),
          quickAction: true,
          source: 'roster'
        });

        // Trigger refresh if callback provided
        if (onRefresh) {
          onRefresh();
        }

        // Add haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

      } else {
        error('Quick attendance failed:', result.error);
      }
    } catch (error) {
      error('Quick attendance error:', error);
    }
  }, [selectedClassId, user, lang, t, onRefresh, attendanceMode, canEditAttendance, selectedDate, selectedProgramId, selectedSubjectId, showSuccess]);

  const sendStudentSummaryEmail = async (student) => {
    setSendingEmails(prev => ({
      ...prev,
      [student.id]: {...prev[student.id], summary: true}
    }));
    try {
      debug('Sending summary email to:', student.email);
      
      // Create student summary data
      const attendanceStats = student.attendanceStats || {};
      const summaryData = {
        studentName: student.name,
        studentEmail: student.email,
        studentId: student.studentId || student.id,
        participation: student.participation || 0,
        behavior: student.behavior || 0,
        penalty: student.penalty || 0,
        attendanceStatus: student.attendance || null,
        presentCount: attendanceStats.present || 0,
        lateCount: attendanceStats.late || 0,
        absentCount: attendanceStats.absent || 0,
        absentExcusedCount: attendanceStats.absentWithExcuse || 0,
        excusedLeaveCount: attendanceStats.excusedLeave || 0,
        humanCaseCount: attendanceStats.humanitarianCase || 0,
        totalAttendance: student.totalAttendance || 0,
        selectedDate: selectedDate,
        className: selectedClassId // This will be resolved in the notification
      };

      // Send the summary email - notifications now handled by backend
      // const result = await notificationGateway.send(
      //   NOTIFICATION_TRIGGERS.SUMMARY_REPORT,
      //   {
      //     userId: student.id,
      //     role: 'student',
      //     email: student.email,
      //     title: `📊 ${t('student_summary_report') || 'Student Summary Report'} - ${student.name}`,
      //     message: t('student_summary_email_message', {
      //       studentName: student.name,
      //       participation: student.participation || 0,
      //       behavior: student.behavior || 0,
      //       penalty: student.penalty || 0,
      //       attendanceStatus: getLocalizedAttendanceLabel(student.attendance || 'absent_no_excuse', t, lang)
      //     }) || `Hello ${student.name}, here is your summary report: Participation: ${student.participation || 0}, Behavior: ${student.behavior || 0}, Penalties: ${student.penalty || 0}, Attendance: ${getLocalizedAttendanceLabel(student.attendance || 'absent_no_excuse', t, lang)}`,
      //     variables: {
      //       userName: student.name,
      //       userEmail: student.email,
      //       studentName: student.name,
      //       studentEmail: student.email,
      //       studentId: student.studentId || student.id,
      //       participation: student.participation || 0,
      //       behavior: student.behavior || 0,
      //       penalty: student.penalty || 0,
      //       attendanceStatus: getLocalizedAttendanceLabel(student.attendance || 'absent_no_excuse', t, lang),
      //       presentCount: attendanceStats.present || 0,
      //       lateCount: attendanceStats.late || 0,
      //       absentCount: attendanceStats.absent || 0,
      //       absentExcusedCount: attendanceStats.absentWithExcuse || 0,
      //       excusedLeaveCount: attendanceStats.excusedLeave || 0,
      //       humanCaseCount: attendanceStats.humanitarianCase || 0,
      //       totalAttendance: student.totalAttendance || 0,
      //       selectedDate: selectedDate,
      //       reportDate: new Date().toLocaleDateString(),
      //       totalStudents: 1, // Single student report
      //       recipientCount: 1,
      //       downloadURL: null, // No file download for individual summary
      //       fileId: null,
      //       filename: null,
      //       storageFailed: false
      //     }
      //   }
      // );
      
      showSuccess(t('summary_email_sent_successfully') || 'Summary email sent successfully!');
      debug('✅ Summary email sent successfully to:', student.email);
    } catch (error) {
      error('❌ Error sending summary email:', error);
      // Show user-friendly error message
      alert(t('failed_to_send_email') || 'Failed to send summary email. Please try again.');
    } finally {
      setSendingEmails(prev => ({
        ...prev,
        [student.id]: {...prev[student.id], summary: false}
      }));
    }
  };

  const toggleFilter = useCallback((filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  }, []);

  const toggleDayExpansion = useCallback((dayKey) => {
    setExpandedDays(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(dayKey)) {
        newExpanded.delete(dayKey);
      } else {
        newExpanded.add(dayKey);
      }
      return newExpanded;
    });
  }, []);

  const expandAllDays = useCallback(() => {
    const allDates = new Set();
    Object.values(studentHistory).forEach(logs => {
      logs.forEach(log => {
        if (log.date) allDates.add(log.date);
      });
    });
    setExpandedDays(allDates);
  }, [studentHistory]);

  const collapseAllDays = useCallback(() => {
    setExpandedDays(new Set());
  }, []);

  // Memoized group logs by day for performance
  const groupLogsByDay = useCallback((logs) => {
    const grouped = {};

    logs.forEach(log => {
      const date = log.date;
      if (!grouped[date]) {
        grouped[date] = {
          date: date,
          attendance: [],
          penalties: [],
          participation: [],
          behavior: []
        };
      }

      if (log.type === RECORD_TYPES.ATTENDANCE) {
        grouped[date].attendance.push(log);
      } else if (log.type === RECORD_TYPES.PENALTY) {
        grouped[date].penalties.push(log);
      } else if (log.type === RECORD_TYPES.PARTICIPATION) {
        grouped[date].participation.push(log);
      } else if (log.type === RECORD_TYPES.BEHAVIOR) {
        grouped[date].behavior.push(log);
      } else if (log.points > 0) {
        // Fallback for older records
        grouped[date].participation.push(log);
      } else if (log.points < 0) {
        // Fallback for older records
        grouped[date].penalties.push(log);
      }
    });

    // Sort each array by time (newest first)
    Object.keys(grouped).forEach(date => {
      grouped[date].attendance.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA;
      });
      grouped[date].penalties.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA;
      });
      grouped[date].participation.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA;
      });
      grouped[date].behavior.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return timeB - timeA;
      });
    });

    return Object.values(grouped).sort((a, b) => {
      // Sort days by date (newest first)
      const result = new Date(b.date) - new Date(a.date);
      debug('🔍 StudentRoster day sort:', {
        dayA: { date: a.date, parsedDate: new Date(a.date) },
        dayB: { date: b.date, parsedDate: new Date(b.date) },
        result
      });
      return result;
    });
  }, []);

  // Memoized badge component for performance
  const getAttendanceBadge = useCallback((status) => {
    // If no status, show "None"
    if (!status) {
      return (
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: 'var(--panel-hover, #f3f4f6)',
            color: 'var(--text-muted, #9ca3af)',
            border: '1px solid var(--border, #e5e7eb)'
          }}>
          {t('none') || 'None'}
        </span>
      );
    }


    // Use the proper attendance status labels from lookup
    const statusInfo = ATTENDANCE_STATUS_LABELS[status];
    if (!statusInfo) {
      // If status is not found in lookup, show None
      return (
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: 'var(--panel-hover, #f3f4f6)',
            color: 'var(--text-muted, #9ca3af)',
            border: '1px solid var(--border, #e5e7eb)'
          }}>
          {t('none') || 'None'}
        </span>
      );
    }

    // Special handling for Present status with green checkmark
    if (status === 'present') {
      return (
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: 'var(--color-success, #16a34a)', // Darker green to match other interface elements
            color: 'var(--text-on-success, white)',
            border: '1px solid var(--color-success, #16a34a)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="3" strokeLinecap="round"
               strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
            {getLocalizedAttendanceLabel(status, t, lang)}
        </span>
      );
    }

    return (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          background: statusInfo.color,
          color: 'var(--text-on-colored, white)',
          border: `1px solid ${statusInfo.color}`
        }}>
        {getLocalizedAttendanceLabel(status, t, lang)}
      </span>
    );
  }, [lang, t]);

  const getSortIcon = useCallback((field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  }, [sortField, sortDirection]);

  // Calculate column sums for footer
  const columnSums = useMemo(() => {
    const displayStudents = students.filter(student => !showFavoritesOnly || favoriteStudents.includes(student.id));

    const sums = {
      participation: 0,
      behavior: 0,
      penalty: 0,
      present: 0,
      late: 0,
      absent: 0,
      absentExcused: 0,
      excusedLeave: 0,
      human: 0,
      // Standup stats
      standupPresent: 0,
      standupLate: 0,
      standupAbsent: 0,
      standupClinic: 0
    };

    displayStudents.forEach(student => {
      sums.participation += student.participation || 0;
      sums.behavior += student.behavior || 0;
      sums.penalty += student.penalty || 0;

      // Attendance statistics
      const stats = student.attendanceStats || {};
      sums.present += stats.present || 0;
      sums.late += stats.late || 0;
      sums.absent += stats.absent || 0;
      sums.absentExcused += stats.absentWithExcuse || 0;
      sums.excusedLeave += stats.excusedLeave || 0;
      sums.human += stats.humanitarianCase || 0;

      // Standup statistics
      const standupStats = student.standupStats || {};
      sums.standupPresent += standupStats.present || 0;
      sums.standupLate += standupStats.late || 0;
      sums.standupAbsent += standupStats.absent || 0;
      sums.standupClinic += standupStats.clinic || 0;
    });

    return sums;
  }, [students, showFavoritesOnly, favoriteStudents]);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      background: 'var(--panel, white)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border, #e5e7eb)',
      padding: '1.5rem',
      width: '100%',
      maxWidth: '100%'
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{
            fontSize: '0.875rem',
            color: theme === 'dark' ? '#ffffff' : 'var(--text-muted, #6b7280)',
            marginTop: '0.25rem',
            marginBottom: 0
          }}>
            {totalStudents} {t('students') || 'Students'}
          </p>
          {isMobile && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" size="icon" onClick={onFilter}>
                {getThemedIcon('ui', 'filter', 16, theme)}
              </Button>
              <Button 
                variant={showFavoritesOnly ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                {getThemedIcon('ui', 'star', 16, theme)}
              </Button>
              <PortalTooltip content={t('export_csv')} position="top">
                <Button variant="ghost" size="icon" onClick={onDownload}>
                  {getThemedIcon('ui', 'download', 16, theme)}
                </Button>
              </PortalTooltip>
              <PortalTooltip content={t('refresh')} position="top">
                <Button variant="ghost" size="icon" onClick={onRefresh}>
                  {getThemedIcon('ui', 'refresh', 16, theme)}
                </Button>
              </PortalTooltip>
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <div style={{ position: 'relative', width: isMobile ? '100%' : '16rem' }}>
            <div style={{
              position: 'absolute',
              [isRTL ? 'right' : 'left']: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1rem',
              height: '1rem',
              color: 'var(--text-muted, #6b7280)'
            }}>
              {getThemedIcon('ui', 'search', 16, theme)}
            </div>
            <Input
              placeholder={t('search_student')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: '2.5rem', width: '100%' }}
            />
          </div>
          {/* Compact highlight toggle */}
          <PortalTooltip content={highlightEnabled ? t('highlight_attention_rows') : (t('highlight_disabled') || 'Highlighting disabled')} position="top">
            <button
              onClick={() => onHighlightToggle?.(!highlightEnabled)}
              style={{
                padding: '0.5rem',
                background: highlightEnabled ? 'var(--color-primary, #8b5cf6)' : 'transparent',
                color: highlightEnabled ? 'white' : 'var(--text-muted, #6b7280)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title={highlightEnabled ? t('highlight_attention_rows') : (t('highlight_disabled') || 'Highlighting disabled')}
            >
              {getThemedIcon('ui', 'alert', 16, highlightEnabled ? 'white' : theme)}
            </button>
          </PortalTooltip>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* <Button variant="ghost" size="icon" onClick={onFilter}>
                {getThemedIcon('ui', 'filter', 16, theme)}
              </Button> */}
              <PortalTooltip 
                content={`${showFavoritesOnly ? t('show_all_students') : t('show_favorites_only')} (${favoriteStudents.length} ${t('bookmarked') || 'bookmarked'})`} 
                position="top"
              >
                <Button 
                  variant={showFavoritesOnly ? 'default' : 'ghost'} 
                  size="icon" 
                  onClick={() => {
                    console.log('🔖 Filter Filter button clicked, showFavoritesOnly:', showFavoritesOnly);
                    console.log('🔖 Filter Total bookmarked students:', favoriteStudents.length);
                    setShowFavoritesOnly(!showFavoritesOnly);
                  }}
                  style={{ position: 'relative' }}
                >
                  {getThemedIcon('ui', 'star', 16, showFavoritesOnly ? '#fbbf24' : theme)}
                  {favoriteStudents.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '0.625rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white'
                    }}>
                      {favoriteStudents.length > 99 ? '99+' : favoriteStudents.length}
                    </span>
                  )}
                </Button>
              </PortalTooltip>
              <PortalTooltip content={t('export_csv')} position="top">
                <Button variant="ghost" size="icon" onClick={onDownload}>
                  {getThemedIcon('ui', 'download', 16, theme)}
                </Button>
              </PortalTooltip>
              <PortalTooltip content={t('refresh')} position="top">
                <Button variant="ghost" size="icon" onClick={onRefresh}>
                  {getThemedIcon('ui', 'refresh', 16, theme)}
                </Button>
              </PortalTooltip>
            </div>
          )}
        </div>
      </div>

      {/* Students Display */}
      <div style={{ overflowX: isMobile ? 'auto' : 'auto', maxWidth: '100%' }}>
        {isMobile ? (
          // Mobile Card Layout
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {students
              .filter(student => !showFavoritesOnly || favoriteStudents.includes(student.id))
              .map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  isExpanded={expandedRows.has(student.id)}
                  favoriteStudents={favoriteStudents}
                  toggleFavorite={toggleFavorite}
                  toggleRowExpansion={toggleRowExpansion}
                  onStudentAction={onStudentAction}
                  onStudentSelect={onStudentSelect}
                  studentHistory={studentHistory}
                  expandedDays={expandedDays}
                  activeFilters={activeFilters}
                  toggleDayExpansion={toggleDayExpansion}
                  expandAllDays={expandAllDays}
                  collapseAllDays={collapseAllDays}
                  handleDeleteAttendance={canDeleteAttendance ? handleDeleteAttendance : null}
                  handleDeleteParticipation={canDeleteAttendance ? handleDeleteParticipation : null}
                  handleDeleteBehavior={canDeleteAttendance ? handleDeleteBehavior : null}
                  handleDeletePenalty={canDeleteAttendance ? handleDeletePenalty : null}
                  canDeleteAttendance={canDeleteAttendance}
                  canUseStatsPanel={canUseStatsPanel}
                  canUseZapPanel={canUseZapPanel}
                  getAttendanceBadge={getAttendanceBadge}
                  t={t}
                  isRTL={isRTL}
                  groupLogsByDay={groupLogsByDay}
                  toggleFilter={toggleFilter}
                  sendingEmails={sendingEmails}
                  setSendingEmails={setSendingEmails}
                  sendStudentSummaryEmail={sendStudentSummaryEmail}
                  lang={lang}
                  historyLoading={historyLoading}
                />
              ))}
          </div>
        ) : (
          // Desktop Table Layout
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                {/* Student Number/ID Column - First */}
                <th
                  style={{
                    textAlign: 'center',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-muted, #6b7280)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '80px'
                  }}
                >
                  {t('id')}
                </th>
                <th style={{ width: '30px', padding: '0.5rem 0.5rem' }}></th>
                <th 
                  onClick={() => onSort('name')}
                  style={{
                    textAlign: isRTL ? 'right' : 'left',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-muted, #6b7280)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {t('student')} {getSortIcon('name')}
                </th>
                {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <th
                    onClick={() => onSort(RECORD_TYPES.ATTENDANCE)}
                    style={{
                      textAlign: isRTL ? 'right' : 'left',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {t('todays_attendance') || "TODAY"} {getSortIcon(RECORD_TYPES.ATTENDANCE)}
                  </th>
                )}
                {attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <th
                    onClick={() => onSort('standupStatus')}
                    style={{
                      textAlign: isRTL ? 'right' : 'left',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {t('standup') || "STANDUP"} {getSortIcon('standupStatus')}
                  </th>
                )}
                {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <th
                    onClick={() => onSort('participation')}
                    style={{
                      textAlign: 'center',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {t('part')} {getSortIcon('participation')}
                  </th>
                )}
                {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <th
                    onClick={() => onSort('behavior')}
                    style={{
                      textAlign: 'center',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {t('behavior')} {getSortIcon('behavior')}
                  </th>
                )}
                {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <th
                    onClick={() => onSort('penalty')}
                    style={{
                      textAlign: 'center',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {t('penalties')} {getSortIcon('penalty')}
                  </th>
                )}
                {/* Attendance Statistics Headers */}
                {attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (
                  // Standup Mode: Show standup-specific headers
                  <>
                    <th
                      onClick={() => onSort('standupPresent')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('present')} {getSortIcon('standupPresent')}
                    </th>
                    <th
                      onClick={() => onSort('standupLate')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('late')} {getSortIcon('standupLate')}
                    </th>
                    <th
                      onClick={() => onSort('standupAbsent')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('absent')} {getSortIcon('standupAbsent')}
                    </th>
                    <th
                      onClick={() => onSort('standupClinic')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('clinic')} {getSortIcon('standupClinic')}
                    </th>
                  </>
                ) : (
                  // Regular Mode: Show regular attendance headers
                  <>
                    <th
                      onClick={() => onSort('present')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('present')} {getSortIcon('present')}
                    </th>
                    <th
                      onClick={() => onSort('late')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('late')} {getSortIcon('late')}
                    </th>
                    <th
                      onClick={() => onSort('absent')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('absent')} {getSortIcon('absent')}
                    </th>
                    <th
                      onClick={() => onSort('absentExcused')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('absent_excused')} {getSortIcon('absentExcused')}
                    </th>
                    <th
                      onClick={() => onSort('excusedLeave')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('excused_leave')} {getSortIcon('excusedLeave')}
                    </th>
                    <th
                      onClick={() => onSort('human')}
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-muted, #6b7280)',
                        textTransform: isRTL ? 'none' : 'uppercase',
                        letterSpacing: '0.05em',
                        width: '80px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {t('human')} {getSortIcon('human')}
                    </th>
                  </>
                )}
                <th style={{
                  textAlign: 'center',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '60px'
                }}>
                </th>
              </tr>
            </thead>
            <tbody>
              {students
                .filter(student => !showFavoritesOnly || favoriteStudents.includes(student.id))
                .map((student) => {
                  const attentionScore = calculateAttentionScore(student.attendanceStats || {}, effectiveAttendanceMode);
                  const rowHighlightStyle = getRowHighlightStyle(attentionScore, highlightEnabled);
                  return (
                  <StudentTableRow
                    key={student.id}
                    student={student}
                    isExpanded={expandedRows.has(student.id)}
                    favoriteStudents={favoriteStudents}
                    toggleFavorite={toggleFavorite}
                    toggleRowExpansion={toggleRowExpansion}
                    onStudentAction={onStudentAction}
                    onStudentSelect={onStudentSelect}
                    onQuickAttendance={canUseQuickAttendance ? handleQuickAttendance : null}
                    programId={selectedProgramId}
                    studentHistory={studentHistory}
                    expandedDays={expandedDays}
                    activeFilters={activeFilters}
                    toggleDayExpansion={toggleDayExpansion}
                    attendanceMode={effectiveAttendanceMode}
                    expandAllDays={expandAllDays}
                    collapseAllDays={collapseAllDays}
                    handleDeleteAttendance={canDeleteAttendance ? handleDeleteAttendance : null}
                    handleDeleteParticipation={canDeleteAttendance ? handleDeleteParticipation : null}
                    handleDeleteBehavior={canDeleteAttendance ? handleDeleteBehavior : null}
                    canDeleteAttendance={canDeleteAttendance}
                    handleDeletePenalty={canDeleteAttendance ? handleDeletePenalty : null}
                    canUseStatsPanel={canUseStatsPanel}
                    canUseZapPanel={canUseZapPanel}
                    canSeeQuickButtons={canSeeQuickButtons}
                    canMarkAttendance={canMarkAttendance}
                    canEditAttendance={canEditAttendance}
                    getAttendanceBadge={getAttendanceBadge}
                    showTotalAttendance={showTotalAttendance}
                    selectedStudentId={selectedStudentId}
                    sendingEmails={sendingEmails}
                    setSendingEmails={setSendingEmails}
                    sendStudentSummaryEmail={sendStudentSummaryEmail}
                    t={t}
                    isRTL={isRTL}
                    groupLogsByDay={groupLogsByDay}
                    toggleFilter={toggleFilter}
                    lang={lang}
                    historyLoading={historyLoading}
                    theme={theme}
                    rowHighlightStyle={rowHighlightStyle}
                  />
                )})}
            </tbody>
            {/* Footer Row with Sums */}
            <tfoot>
              <tr style={{
                borderTop: '2px solid var(--border, #e5e7eb)',
                background: 'var(--background-secondary, #f9fafb)',
                fontWeight: 600
              }}>
                <td colSpan="2" style={{
                  padding: '0.75rem 0.5rem',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: theme === 'dark' ? '#ffffff' : 'var(--text-primary, #111827)'
                }}>
                  {t('total') || 'Total'}
                </td>
                <td style={{
                  padding: '0.75rem',
                  textAlign: isRTL ? 'right' : 'left',
                  fontSize: '0.875rem',
                  color: theme === 'dark' ? '#ffffff' : 'var(--text-primary, #111827)'
                }}>
                  {students.filter(student => !showFavoritesOnly || favoriteStudents.includes(student.id)).length} {t('students') || 'students'}
                </td>
                {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <td style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted, #6b7280)'
                  }}>
                  </td>
                )}
                {attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <td style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted, #6b7280)'
                  }}>
                  </td>
                )}
                {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
                  <>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-info, #3b82f6)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'users', 16, '#3b82f6')}
                        {columnSums.participation}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-warning, #f59e0b)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'zap', 16, '#f59e0b')}
                        {columnSums.behavior}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-danger, #ef4444)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'alert_triangle', 16, '#ef4444')}
                        {columnSums.penalty}
                      </div>
                    </td>
                  </>
                )}
                {attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? (
                  <>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-success, #10b981)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'check_circle', 16, '#10b981')}
                        {columnSums.standupPresent}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-warning, #f59e0b)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'clock', 16, '#f59e0b')}
                        {columnSums.standupLate}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-danger, #ef4444)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'x_circle', 16, '#ef4444')}
                        {columnSums.standupAbsent}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: '#ec4899',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'bed', 16, '#ec4899')}
                        {columnSums.standupClinic}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-success, #10b981)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'check_circle', 16, '#10b981')}
                        {columnSums.present}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-warning, #f59e0b)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'clock', 16, '#f59e0b')}
                        {columnSums.late}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-danger, #ef4444)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'x_circle', 16, '#ef4444')}
                        {columnSums.absent}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--color-danger, #ef4444)',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'x_circle', 16, '#ef4444')}
                        {columnSums.absentExcused}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: '#ec4899',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'heart', 16, '#ec4899')}
                        {columnSums.excusedLeave}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: '#8b5cf6',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        {getThemedIcon('ui', 'heart', 16, '#8b5cf6')}
                        {columnSums.human}
                      </div>
                    </td>
                  </>
                )}
                <td style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontSize: '0.875rem'
                }}>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        deleteType={deleteType}
        studentName={t('this_student')}
        deleteLoading={deleteLoading}
        t={t}
      />
    </div>
  );
});


export default StudentRoster;

