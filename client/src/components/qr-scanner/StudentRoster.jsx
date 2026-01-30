import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { Input } from '@ui';
import { Button } from '@ui';
import { Card, CardBody } from '@ui';
import { ATTENDANCE_STATUS_LABELS, getAttendanceByStudent, deleteAttendance } from '@firebaseServices/attendance';
import { getPenalties, deletePenalty } from '@firebaseServices/penalties';
import { deleteParticipation } from '@firebaseServices/participations';
import { getFavoriteStudents, addFavoriteStudent, removeFavoriteStudent } from '@firebaseServices/userPreferences';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Mail, ChevronDown, QrCode, User, Trash2, ExternalLink, RefreshCw, Star, ChevronRight, Download, SidebarOpen, Search, Filter, Users, Trophy, AlertCircle } from 'lucide-react';
import eventBus, { EVENTS } from '@utils/eventBus';
import { generateReferenceId, generateStudentQRCode } from '@utils/qrCode';
import { QRCodeDisplay, useQRCodeEmail } from '@utils/qrCodeUtils';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import StudentHistory from '@ui/history';
import StudentRosterHistory from '@ui/history/StudentRosterHistory';
import DeleteModal from '@ui/history/DeleteModal';
import StudentCard from '@ui/history/StudentCard';
import StudentTableRow from '@ui/history/StudentTableRow';

const StudentRoster = React.memo(function StudentRoster({
  students,
  onStudentSelect,
  selectedStudentId,
  onTogglePin,
  onDownload,
  onFilter,
  onRefresh,
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
    logger.debug('=== FETCH STUDENT HISTORY DEBUG ===');
    logger.debug('Fetching history for studentId:', studentId);

    try {
      // Get all attendance records for this student
      logger.debug('Calling getAttendanceByStudent for studentId:', studentId);
      const attendanceResponse = await getAttendanceByStudent(studentId);
      const attendanceRecords = attendanceResponse.success
          ? attendanceResponse.data : [];

      logger.debug('Attendance response:', {
        success: attendanceResponse.success,
        totalRecords: attendanceRecords.length,
        records: attendanceRecords.map(record => ({
          id: record.id,
          status: record.status,
          date: record.date,
          timestamp: record.timestamp,
          category: record.category,
          delta: record.delta,
          reason: record.reason,
          notes: record.notes
        }))
      });

      // Check specifically for absent records
      const absentRecords = attendanceRecords.filter(record =>
          record.status === 'absent_no_excuse' ||
          record.status === 'absent_with_excuse' ||
          record.status === 'absent'
      );

      logger.debug('Absent records found:', {
        count: absentRecords.length,
        records: absentRecords.map(record => ({
          id: record.id,
          status: record.status,
          date: record.date,
          timestamp: record.timestamp
        }))
      });

      // Get all penalties for this student
      logger.debug('Fetching penalties for studentId:', studentId);
      const penaltiesResponse = await getPenalties();
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data
          : [];
      const studentPenalties = allPenalties.filter(
          p => p.studentId === studentId);

      logger.debug('Penalties response:', {
        success: penaltiesResponse.success,
        totalPenalties: allPenalties.length,
        studentPenalties: studentPenalties.length
      });

      // Combine and format logs
      const logs = [
        ...attendanceRecords.map(record => {
          const logEntry = {
            id: record.id,
            type: record.category || (record.delta ? (record.delta > 0
                ? 'participation' : 'behavior') : 'attendance'),
            date: record.date || (record.timestamp?.toDate
                ? record.timestamp.toDate().toISOString().split('T')[0]
                : new Date(record.timestamp).toISOString().split('T')[0]),
            time: record.timestamp || record.date,
            label: record.category === 'participation' 
              ? 'Participation' 
              : (record.category === 'behavior' 
                ? 'Behavior' 
                : (ATTENDANCE_STATUS_LABELS[record.status]?.en || record.status || 'Unknown')),
            points: record.delta || 0,
            comment: record.reason || record.notes || '',
            severity: 'low',
            color: record.category === 'participation' 
              ? '#3b82f6' 
              : (record.category === 'behavior' 
                ? '#f97316' 
                : (ATTENDANCE_STATUS_LABELS[record.status]?.color || '#6b7280')),
            originalStatus: record.status,
            originalCategory: record.category
          };

          logger.debug('Processing attendance record:', {
            id: record.id,
            status: record.status,
            category: record.category,
            delta: record.delta,
            resultingType: logEntry.type,
            resultingLabel: logEntry.label
          });

          return logEntry;
        }),
        ...studentPenalties.map(penalty => ({
          id: penalty.docId || penalty.id,
          type: 'penalty',
          date: penalty.date || (penalty.createdAt?.toDate
              ? penalty.createdAt.toDate().toISOString().split('T')[0]
              : new Date(penalty.createdAt).toISOString().split('T')[0]),
          time: penalty.createdAt,
          label: penalty.type || penalty.reason || 'Penalty',
          points: -Math.abs(penalty.points || 0), // Always negative for penalties
          comment: penalty.comment || '',
          severity: penalty.severity || 'medium',
          color: penalty.points > 0 ? '#dcfce7' : '#fee2e2'
        }))
      ].sort((a, b) => {
        const dateA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
        const dateB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
        return dateB - dateA;
      });

      logger.debug('Final combined logs:', {
        totalLogs: logs.length,
        attendanceLogs: logs.filter(log => log.type === 'attendance').length,
        participationLogs: logs.filter(
            log => log.type === 'participation').length,
        behaviorLogs: logs.filter(log => log.type === 'behavior').length,
        penaltyLogs: logs.filter(log => log.type === 'penalty').length,
        logs: logs.map(log => ({
          id: log.id,
          type: log.type,
          label: log.label,
          date: log.date,
          originalStatus: log.originalStatus
        }))
      });

      setStudentHistory(prev => ({
        ...prev,
        [studentId]: logs
      }));

      logger.debug('=== END FETCH STUDENT HISTORY DEBUG ===');
    } catch (error) {
      logger.error('Error fetching student history:', error);
      logger.debug('=== FETCH STUDENT HISTORY ERROR ===');
    }
  }, []);

  const handleDeleteAttendance = async (studentId, logId) => {
    setDeleteType('attendance');
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  };

  const handleDeletePenalty = async (studentId, logId) => {
    setDeleteType('penalty');
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  };

  const handleDeleteParticipation = async (studentId, logId) => {
    setDeleteType('participation');
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  };

  // Handle actual deletion after confirmation
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      let result;
      if (deleteType === 'attendance') {
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
      } else if (deleteType === 'penalty') {
        result = await deletePenalty(deleteLogId);
        if (result.success) {
          // Find the student ID from the log or refresh all
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          eventBus.emit(EVENTS.PENALTY_ASSIGNED,
              {studentId: deleteLogId.split('_')[1]});
        }
      } else if (deleteType === 'participation') {
        result = await deleteParticipation(deleteLogId);
        if (result.success) {
          // Find the student ID from the log or refresh all
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          eventBus.emit(EVENTS.PARTICIPATION_ADDED,
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

  // Listen for real-time activity updates
  useEffect(() => {
    const unsubscribeActivity = eventBus.on(EVENTS.ACTIVITY_UPDATE, () => {
      // console.log('StudentRoster: Activity update received');
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
      // console.log('StudentRoster: Behavior logged for', data.studentId);
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
          // console.log('StudentRoster: Participation added for', data.studentId);
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
      // console.log('StudentRoster: Penalty assigned for', data.studentId);
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

    return () => {
      unsubscribeActivity();
      unsubscribeAttendance();
      unsubscribeBehavior();
      unsubscribeParticipation();
      unsubscribePenalty();
    };
  }, [expandedRows, fetchStudentHistory, onRefresh]);

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

  const sendStudentSummaryEmail = async (student) => {
    setSendingEmails(prev => ({
      ...prev,
      [student.id]: {...prev[student.id], summary: true}
    }));
    try {
      // Email functionality would go here
      console.log('Sending summary email to:', student.email);
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

      if (log.type === 'attendance') {
        grouped[date].attendance.push(log);
      } else if (log.type === 'penalty') {
        grouped[date].penalties.push(log);
      } else if (log.type === 'participation') {
        grouped[date].participation.push(log);
      } else if (log.type === 'behavior') {
        grouped[date].behavior.push(log);
      } else if (log.points > 0) {
        // Fallback for older records
        grouped[date].participation.push(log);
      } else if (log.points < 0) {
        // Fallback for older records
        grouped[date].penalties.push(log);
      }
    });

    return Object.values(grouped);
  }, []);

  // Memoized badge component for performance
  const getAttendanceBadge = useCallback((status) => {
    // If no status, show "NOTHING YET"
    if (!status) {
      return (
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24'
          }}>
          {t('nothing_yet') || 'NOTHING YET'}
        </span>
      );
    }

    // If status is a default absent status (likely set when no actual attendance exists), show NOTHING YET
    if (status === 'absent_no_excuse' || status === 'absent') {
      return (
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24'
          }}>
          {t('nothing_yet') || 'NOTHING YET'}
        </span>
      );
    }

    // Use the proper attendance status labels from lookup
    const statusInfo = ATTENDANCE_STATUS_LABELS[status];
    if (!statusInfo) {
      // If status is not found in lookup, show NOTHING YET
      return (
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fbbf24'
          }}>
          {t('nothing_yet') || 'NOTHING YET'}
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
            {statusInfo.en}
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
        {statusInfo.en}
      </span>
    );
  }, []);

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
                <Filter style={{ width: '1rem', height: '1rem' }} />
              </Button>
              <Button 
                variant={showFavoritesOnly ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Star style={{ width: '1rem', height: '1rem', color: showFavoritesOnly ? '#f59e0b' : '#6b7280' }} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
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
            <Search style={{
              position: 'absolute',
              [isRTL ? 'right' : 'left']: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1rem',
              height: '1rem',
              color: 'var(--text-muted, #6b7280)'
            }} />
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
                <Filter style={{ width: '1rem', height: '1rem' }} />
              </Button>
              <Button 
                variant={showFavoritesOnly ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                title={showFavoritesOnly ? t('show_all_students') : t('show_favorites_only')}
              >
                <Star 
                  style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    color: showFavoritesOnly ? '#f59e0b' : '#6b7280'
                  }} 
                  fill={showFavoritesOnly ? 'currentColor' : 'none'} 
                />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDownload} title={t('export_csv')}>
                <Download style={{ width: '1rem', height: '1rem' }} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onRefresh} title={t('refresh')}>
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
              </Button>
            </div>
          )}
          {isMobile && (
            <Button 
              variant="outline" 
              style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }} 
              onClick={onDownload}
            >
              <Download style={{ width: '1rem', height: '1rem' }} />
              {t('export_csv')}
            </Button>
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
                  handleDeleteAttendance={handleDeleteAttendance}
                  handleDeleteParticipation={handleDeleteParticipation}
                  handleDeletePenalty={handleDeletePenalty}
                  getAttendanceBadge={getAttendanceBadge}
                  t={t}
                  isRTL={isRTL}
                  groupLogsByDay={groupLogsByDay}
                  toggleFilter={toggleFilter}
                  sendingEmails={sendingEmails}
                  setSendingEmails={setSendingEmails}
                  sendStudentSummaryEmail={sendStudentSummaryEmail}
                />
              ))}
          </div>
        ) : (
          // Desktop Table Layout
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                <th style={{ width: '40px', padding: '0.75rem 1rem' }}></th>
                <th 
                  onClick={() => onSort('name')}
                  style={{
                    textAlign: isRTL ? 'right' : 'left',
                    padding: '0.75rem 1rem',
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
                  onClick={() => onSort('attendance')}
                  style={{
                    textAlign: isRTL ? 'right' : 'left',
                    padding: '0.75rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-muted, #6b7280)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {t('todays_attendance') || "Today's Attendance"} {getSortIcon('attendance')}
                </th>
                <th 
                  onClick={() => onSort('participation')}
                  style={{
                    textAlign: 'center',
                    padding: '0.75rem 1rem',
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
                    padding: '0.75rem 1rem',
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
                    padding: '0.75rem 1rem',
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
                {showTotalAttendance && (
                  <th 
                    onClick={() => onSort('totalAttendance')}
                    style={{
                      textAlign: 'center',
                      padding: '0.75rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-muted, #6b7280)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {t('stats')} {getSortIcon('totalAttendance')}
                  </th>
                )}
                <th style={{
                  textAlign: 'center',
                  padding: '0.75rem 1rem',
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
                    studentHistory={studentHistory}
                    expandedDays={expandedDays}
                    activeFilters={activeFilters}
                    toggleDayExpansion={toggleDayExpansion}
                    handleDeleteAttendance={handleDeleteAttendance}
                    handleDeleteParticipation={handleDeleteParticipation}
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
        studentName={students.find(s => s.id === deleteLogId?.split('_')[1])?.name || t('this_student')}
        deleteLoading={deleteLoading}
        t={t}
      />
    </div>
  );
});


export default StudentRoster;
