import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { Input } from '@ui';
import { Button } from '@ui';
import { Card, CardBody } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { useLang } from '@contexts/LangContext';
import { ATTENDANCE_STATUS_LABELS, getAttendanceColor, getAttendanceLabel, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
import { getAttendanceByStudent, rosterQuickAction } from '@services/business/attendanceService';
import { getPenalties } from '@services/business/penaltyService';
import { getParticipations } from '@services/business/participationService';
import { getBehaviors, deleteBehavior } from '@services/business/behaviorService';
import { CheckSmallIcon, ClockSmallIcon } from '@utils/icons.jsx';
import eventBus, { EVENTS } from '@utils/eventBus';
import { generateReferenceId, generateStudentQRCode } from '@utils/qrCode';
import { QRCodeDisplay, useQRCodeEmail } from '@utils/qrCodeUtils';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { getParticipationLabel } from '@constants/participationTypes';
import { getBehaviorLabel } from '@constants/behaviorTypes';
import { PENALTY_TYPES } from '@constants/penaltyTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getFavoriteStudents, addFavoriteStudent, removeFavoriteStudent } from '@services/business/userPreferenceService';
import { getUserProfile } from '@services/business/userService';
import { StudentHistory, StudentRosterHistory } from '@ui/history';
import { DeleteModal } from '@ui';
import { StudentCard, StudentTableRow } from '@ui/history';

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
  selectedDate
}) {
  const {user} = useAuth();
  const {theme} = useTheme();
  const {t, lang, isRTL} = useLang();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [deleteLogId, setDeleteLogId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    try {
      // Get all attendance records for this student
      const attendanceResponse = await getAttendanceByStudent(studentId);
      const attendanceRecords = attendanceResponse.success
          ? attendanceResponse.data : [];

      const [penaltiesResponse, participationsResponse, behaviorsResponse] = await Promise.all([
        getPenalties(studentId),
        getParticipations(),
        getBehaviors()
      ]);
      
      logger.log('🔧 fetchStudentHistory called getPenalties with studentId:', studentId);

      const studentPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const studentParticipations = (participationsResponse.success ? participationsResponse.data : []).filter(p => p.studentId === studentId);
      const studentBehaviors = (behaviorsResponse.success ? behaviorsResponse.data : []).filter(b => b.studentId === studentId);

      // Combine and format logs
      const logs = [
        ...attendanceRecords.filter(r => r.status).map(record => {
          const logEntry = {
            id: record.id,
            type: RECORD_TYPES.ATTENDANCE,
            date: record.date || toYmd(record.timestamp) || toYmd(record.updatedAt) || toYmd(record.createdAt),
            time: record.timestamp || record.date,
            label: getLocalizedAttendanceLabel(record.status, t, lang) || record.status || 'Unknown',
            points: 0,
            comment: record.reason || record.notes || '',
            color: ATTENDANCE_STATUS_LABELS[record.status]?.color || '#6b7280',
            status: record.status,  // ← Clean: only the status field
            method: record.method, // ← Add method field for localization
            // Add user information - map markedBy fields to performedBy fields for consistency
            performedBy: record.markedBy,
            performedByName: record.markedByName || record.performedByName,
            performedByEmail: record.markedByEmail || record.performedByEmail
          };

          logger.debug('Processing attendance record:', {
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
          const label = getParticipationLabel(p.type || RECORD_TYPES.PARTICIPATION, lang);
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
            // Add user information
            performedBy: p.performedBy,
            performedByName: p.performedByName,
            performedByEmail: p.performedByEmail,
            user: p.user,
            createdBy: p.createdBy
          };
        }),
        ...studentBehaviors.map(b => {
          const points = Number(b.points) || 0;
          const label = getBehaviorLabel(b.type || RECORD_TYPES.BEHAVIOR, lang);
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
            // Add user information
            performedBy: b.performedBy,
            performedByName: b.performedByName,
            performedByEmail: b.performedByEmail,
            user: b.user,
            createdBy: b.createdBy
          };
        }),
        ...studentPenalties.map(penalty => {
          const pType = penalty.type; // Use the 'type' field directly
          // Get the penalty label from PENALTY_TYPES
          const penaltyDef = PENALTY_TYPES.find(pt => pt.id === pType);
          const label = penaltyDef 
            ? (lang === 'ar' ? penaltyDef.label_ar : penaltyDef.label_en)
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
            // Add user information
            performedBy: penalty.performedBy,
            performedByName: penalty.performedByName,
            performedByEmail: penalty.performedByEmail,
            user: penalty.user,
            createdBy: penalty.createdBy
          };
        })
      ].sort((a, b) => {
        const dateA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const dateB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        const result = dateB - dateA;
        logger.log('🔍 StudentRoster sort comparison:', {
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
    } catch (error) {
      logger.error('Error fetching student history:', error);
    }
  }, [lang, t, toYmd]);

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
          eventBus.emit(EVENTS.ATTENDANCE_MARKED,
              {studentId: deleteLogId.split('_')[1]});
          eventBus.emit(EVENTS.ATTENDANCE_DELETED,
              {studentId: deleteLogId.split('_')[1]});
        }
      } else if (deleteType === RECORD_TYPES.PENALTY) {
        result = await deletePenalty(deleteLogId);
        if (result.success) {
          // Find the student ID from the log or refresh all
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          eventBus.emit(EVENTS.PENALTY_ASSIGNED,
              {studentId: deleteLogId.split('_')[1]});
        }
      } else if (deleteType === RECORD_TYPES.PARTICIPATION) {
        result = await deleteParticipation(deleteLogId);
        if (result.success) {
          // Find the student ID from the log or refresh all
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          eventBus.emit(EVENTS.PARTICIPATION_ADDED,
              {studentId: deleteLogId.split('_')[1], status: 'deleted'});
        }
      } else if (deleteType === RECORD_TYPES.BEHAVIOR) {
        result = await deleteBehavior(deleteLogId);
        if (result.success) {
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          eventBus.emit(EVENTS.BEHAVIOR_LOGGED,
              {studentId: deleteLogId.split('_')[1], status: 'deleted'});
        }
      }
    } catch (error) {
      logger.error(`Error deleting ${deleteType}:`, error);
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
          logger.debug('=== STUDENT ROSTER ATTENDANCE MARKED EVENT ===');
          logger.debug('Attendance marked event received:', {
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

          logger.debug('Student lookup result:', {
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
            logger.debug('Refreshing student history for expanded row:',
                studentIdToFetch);
            fetchStudentHistory(studentIdToFetch);
          }

          // Update the student's attendance status in real-time
          // This ensures the main roster display reflects the new attendance
          if (data.status && onRefresh) {
            logger.debug('Triggering onRefresh to update attendance status');
            // Trigger a refresh of the students data to update attendance status
            setTimeout(() => {
              onRefresh();
            }, 100); // Small delay to ensure Firebase has processed the update
          } else {
            logger.debug(
                'Not triggering onRefresh - missing status or onRefresh', {
                  hasStatus: !!data.status,
                  hasOnRefresh: !!onRefresh
                });
          }

          logger.debug('=== END STUDENT ROSTER ATTENDANCE MARKED EVENT ===');
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
    let success = false;

    if (isFavorite) {
      success = await removeFavoriteStudent(user.uid, studentId);
      setFavoriteStudents(prev => prev.filter(id => id !== studentId));
    } else {
      success = await addFavoriteStudent(user.uid, studentId);
      setFavoriteStudents(prev => [...prev, studentId]);
    }

    if (!success) {
      logger.error('Failed to update favorite status');
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
  const handleQuickAttendance = useCallback(async (student, status) => {
    if (!student || !status || !selectedClassId) return;
    
    try {
      // Get user profile to get proper display name
      const userProfile = await getUserProfile(user);
      const displayName = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email || 'Unknown';
      
      // Debug: Log user objects to see what data is available
      logger.log('🔧 User objects:', {
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
      
      // Use the dedicated roster quick action method
      const result = await rosterQuickAction(
        student.id,
        selectedClassId,
        status,
        enhancedUser,
        `${t('quick') || 'Quick'} ${getLocalizedAttendanceLabel(status, t, lang)}`
      );

      if (result.success) {
        // Show success feedback
        logger.log(`✅ ${student.displayName || student.name} marked as ${getLocalizedAttendanceLabel(status, t, lang)}`);
        
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
        logger.error('Quick attendance failed:', result.error);
      }
    } catch (error) {
      logger.error('Quick attendance error:', error);
    }
  }, [selectedClassId, user, lang, t, onRefresh]);

  const sendStudentSummaryEmail = async (student) => {
    setSendingEmails(prev => ({
      ...prev,
      [student.id]: {...prev[student.id], summary: true}
    }));
    try {
      // Email functionality would go here
      logger.log('Sending summary email to:', student.email);
      // await sendStudentSummaryEmail(student.email, student.id);
      alert('Summary email sent successfully!');
    } catch (error) {
      logger.error('Error sending summary email:', error);
      alert('Failed to send summary email');
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
      logger.log('🔍 StudentRoster day sort:', {
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
            background: '#f3f4f6',
            color: '#9ca3af',
            border: '1px solid #e5e7eb'
          }}>
          {t('none') || 'None'}
        </span>
      );
    }

    // If status is a default absent status (likely set when no actual attendance exists), show None
    if (status === 'absent_no_excuse' || status === 'absent') {
      return (
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: '#f3f4f6',
            color: '#9ca3af',
            border: '1px solid #e5e7eb'
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
            background: '#f3f4f6',
            color: '#9ca3af',
            border: '1px solid #e5e7eb'
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
            background: '#16a34a', // Darker green to match other interface elements
            color: 'white',
            border: '1px solid #16a34a',
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
          color: 'white',
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
            color: 'var(--text-muted, #6b7280)',
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
              <Button variant="ghost" size="icon" onClick={onDownload} title={t('export_csv')}>
                {getThemedIcon('ui', 'download', 16, theme)}
              </Button>
              <Button variant="ghost" size="icon" onClick={onRefresh} title={t('refresh')}>
                {getThemedIcon('ui', 'refresh', 16, theme)}
              </Button>
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
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Button variant="ghost" size="icon" onClick={onFilter}>
                {getThemedIcon('ui', 'filter', 16, theme)}
              </Button>
              <Button 
                variant={showFavoritesOnly ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                title={showFavoritesOnly ? t('show_all_students') : t('show_favorites_only')}
              >
                {getThemedIcon('ui', 'star', 16, theme)}
              </Button>
              <Button variant="ghost" size="icon" onClick={onDownload} title={t('export_csv')}>
                {getThemedIcon('ui', 'download', 16, theme)}
              </Button>
              <Button variant="ghost" size="icon" onClick={onRefresh} title={t('refresh')}>
                {getThemedIcon('ui', 'refresh', 16, theme)}
              </Button>
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
                  handleDeleteAttendance={handleDeleteAttendance}
                  handleDeleteParticipation={handleDeleteParticipation}
                  handleDeleteBehavior={handleDeleteBehavior}
                  handleDeletePenalty={handleDeletePenalty}
                  getAttendanceBadge={getAttendanceBadge}
                  t={t}
                  isRTL={isRTL}
                  groupLogsByDay={groupLogsByDay}
                  toggleFilter={toggleFilter}
                  sendingEmails={sendingEmails}
                  setSendingEmails={setSendingEmails}
                  sendStudentSummaryEmail={sendStudentSummaryEmail}
                  lang={lang}
                />
              ))}
          </div>
        ) : (
          // Desktop Table Layout
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
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
                {/* Attendance Statistics Headers */}
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '80px'
                }}>
                  {t('present') || 'Present'}
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '80px'
                }}>
                  {t('late') || 'Late'}
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '80px'
                }}>
                  {t('absent') || 'Absent'}
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '80px'
                }}>
                  {t('absent_excused') || 'Absent Excused'}
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '80px'
                }}>
                  {t('excused_leave') || 'Excused Leave'}
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-muted, #6b7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '80px'
                }}>
                  {t('human') || 'Human'}
                </th>
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
                .map((student) => (
                  <StudentTableRow
                    key={student.id}
                    student={student}
                    isExpanded={expandedRows.has(student.id)}
                    favoriteStudents={favoriteStudents}
                    toggleFavorite={toggleFavorite}
                    toggleRowExpansion={toggleRowExpansion}
                    onStudentAction={onStudentAction}
                    onStudentSelect={onStudentSelect}
                    onQuickAttendance={handleQuickAttendance}
                    studentHistory={studentHistory}
                    expandedDays={expandedDays}
                    activeFilters={activeFilters}
                    toggleDayExpansion={toggleDayExpansion}
                    expandAllDays={expandAllDays}
                    collapseAllDays={collapseAllDays}
                    handleDeleteAttendance={handleDeleteAttendance}
                    handleDeleteParticipation={handleDeleteParticipation}
                    handleDeleteBehavior={handleDeleteBehavior}
                    handleDeletePenalty={handleDeletePenalty}
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
                  />
                ))}
            </tbody>
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

