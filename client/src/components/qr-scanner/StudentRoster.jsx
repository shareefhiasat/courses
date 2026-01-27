import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '../../utils/logger';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ATTENDANCE_STATUS_LABELS, getAttendanceByStudent, deleteAttendance } from '../../firebase/attendance';
import { getPenalties, deletePenalty } from '../../firebase/penalties';
import { getFavoriteStudents, addFavoriteStudent, removeFavoriteStudent } from '../../firebase/userPreferences';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { Mail, ChevronDown, QrCode, User, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import eventBus, { EVENTS } from '../../utils/eventBus';
import { generateReferenceId, generateStudentQRCode } from '../../utils/qrCode';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

const SearchIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const FilterIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const DownloadIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

const StarIcon = ({ style, filled }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const SidebarOpenIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

const ChevronDownIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const UserIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ChevronRightIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const AttendanceIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ParticipationIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const PenaltyIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const RefreshIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

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
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
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
      const attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];
      
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
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const studentPenalties = allPenalties.filter(p => p.studentId === studentId);
      
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
            type: record.category || (record.delta ? (record.delta > 0 ? 'participation' : 'behavior') : 'attendance'),
            date: record.date || (record.timestamp?.toDate ? record.timestamp.toDate().toISOString().split('T')[0] : new Date(record.timestamp).toISOString().split('T')[0]),
            time: record.timestamp || record.date,
            label: ATTENDANCE_STATUS_LABELS[record.status]?.en || record.status,
            points: record.delta || 0,
            comment: record.reason || record.notes || '',
            severity: 'low',
            color: ATTENDANCE_STATUS_LABELS[record.status]?.color || '#6b7280',
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
          date: penalty.date || (penalty.createdAt?.toDate ? penalty.createdAt.toDate().toISOString().split('T')[0] : new Date(penalty.createdAt).toISOString().split('T')[0]),
          time: penalty.createdAt,
          label: penalty.reason || 'Penalty',
          points: penalty.points || 0,
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
        participationLogs: logs.filter(log => log.type === 'participation').length,
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
          eventBus.emit(EVENTS.ATTENDANCE_MARKED, { studentId: deleteLogId.split('_')[1] });
          eventBus.emit(EVENTS.ATTENDANCE_DELETED, { studentId: deleteLogId.split('_')[1] });
        }
      } else if (deleteType === 'penalty') {
        result = await deletePenalty(deleteLogId);
        if (result.success) {
          // Find the student ID from the log or refresh all
          students.forEach(student => {
            fetchStudentHistory(student.id);
          });
          eventBus.emit(EVENTS.PENALTY_ASSIGNED, { studentId: deleteLogId.split('_')[1] });
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

  const openQRCodeInNewTab = async (student) => {
    try {
      const referenceId = student.studentNumber ? `STU-${student.studentNumber}` : generateReferenceId(student.id || student.docId);
      const qrDataUrl = await generateStudentQRCode(referenceId, { width: 512, margin: 4 });
      
      const newTab = window.open();
      newTab.document.write(`
        <html>
          <head>
            <title>QR Code - ${student.displayName || student.name}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: #f3f4f6; }
              .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center; }
              img { width: 300px; height: 300px; margin-bottom: 1rem; }
              h1 { margin: 0; color: #111827; font-size: 1.5rem; }
              p { margin: 0.5rem 0 0; color: #6b7280; font-size: 1rem; }
              .ref { font-family: monospace; font-weight: bold; color: #059669; margin-top: 0.5rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <img src="${qrDataUrl}" alt="QR Code" />
              <h1>${student.displayName || student.name}</h1>
              <p>${student.email || ''}</p>
              <div class="ref">${referenceId}</div>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      logger.error('Failed to open QR code:', error);
      alert('Failed to generate QR code');
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

    const unsubscribeAttendance = eventBus.on(EVENTS.ATTENDANCE_MARKED, (data) => {
      // console.log('StudentRoster: Attendance marked for', data.studentId);
      // Always refresh history if row is expanded
      if (expandedRows.has(data.studentId)) {
        fetchStudentHistory(data.studentId);
      }
      
      // Update the student's attendance status in real-time
      // This ensures the main roster display reflects the new attendance
      if (data.status && onRefresh) {
        // Trigger a refresh of the students data to update attendance status
        setTimeout(() => {
          onRefresh();
        }, 100); // Small delay to ensure Firebase has processed the update
      }
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

    const unsubscribeParticipation = eventBus.on(EVENTS.PARTICIPATION_ADDED, (data) => {
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

  // Email functions
  const sendQRCodeEmail = async (student) => {
    setSendingEmails(prev => ({ ...prev, [student.id]: { ...prev[student.id], qrCode: true } }));
    try {
      // Email functionality would go here
      logger.debug('Sending QR code email to:', student.email);
      // await sendQRCodeEmail(student.email, student.id);
      alert('QR Code email sent successfully!');
    } catch (error) {
      logger.error('Error sending QR code email:', error);
      alert('Failed to send QR Code email');
    } finally {
      setSendingEmails(prev => ({ ...prev, [student.id]: { ...prev[student.id], qrCode: false } }));
    }
  };

  const sendStudentSummaryEmail = async (student) => {
    setSendingEmails(prev => ({ ...prev, [student.id]: { ...prev[student.id], summary: true } }));
    try {
      // Email functionality would go here
      console.log('Sending summary email to:', student.email);
      // await sendStudentSummaryEmail(student.email, student.id);
      alert('Summary email sent successfully!');
    } catch (error) {
      logger.error('Error sending summary email:', error);
      alert('Failed to send summary email');
    } finally {
      setSendingEmails(prev => ({ ...prev, [student.id]: { ...prev[student.id], summary: false } }));
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
    // If no status, show "NOTHING YET" with indication color
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
    
    const statusInfo = ATTENDANCE_STATUS_LABELS[status] || ATTENDANCE_STATUS_LABELS.absent_no_excuse;
    
    // Special handling for Present status with green checkmark
    if (status === 'present') {
      return (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          background: '#22c55e',
          color: 'white',
          border: '1px solid #22c55e',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

  const getInitials = useCallback((name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getAvatarColor = useCallback((name) => {
    const colors = [
      { bg: '#e9d5ff', color: '#6b21a8' },
      { bg: '#fed7aa', color: '#9a3412' },
      { bg: '#bfdbfe', color: '#1e3a8a' },
      { bg: '#fbcfe8', color: '#831843' },
      { bg: '#d1fae5', color: '#065f46' },
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
                <FilterIcon style={{ width: '1rem', height: '1rem' }} />
              </Button>
              <Button 
                variant={showFavoritesOnly ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <StarIcon style={{ width: '1rem', height: '1rem', color: showFavoritesOnly ? '#f59e0b' : '#6b7280' }} filled={showFavoritesOnly} />
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
            <SearchIcon style={{
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
                <FilterIcon style={{ width: '1rem', height: '1rem' }} />
              </Button>
              <Button 
                variant={showFavoritesOnly ? 'default' : 'ghost'} 
                size="icon" 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                title={showFavoritesOnly ? t('show_all_students') : t('show_favorites_only')}
              >
                <StarIcon 
                  style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    color: showFavoritesOnly ? '#f59e0b' : '#6b7280'
                  }} 
                  filled={showFavoritesOnly} 
                />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDownload} title={t('export_csv')}>
                <DownloadIcon style={{ width: '1rem', height: '1rem' }} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onRefresh} title={t('refresh')}>
                <RefreshIcon style={{ width: '1rem', height: '1rem' }} />
              </Button>
            </div>
          )}
          {isMobile && (
            <Button 
              variant="outline" 
              style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }} 
              onClick={onDownload}
            >
              <DownloadIcon style={{ width: '1rem', height: '1rem' }} />
              {t('export_csv')}
            </Button>
          )}
        </div>
      </div>

      <div style={{ overflowX: isMobile ? 'auto' : 'auto', maxWidth: '100%' }}>
        {isMobile ? (
          // Mobile Card Layout
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {students
              .filter(student => !showFavoritesOnly || favoriteStudents.includes(student.id))
              .map((student) => {
              const avatarColor = getAvatarColor(student.displayName || student.realName || student.name || '');
              const isExpanded = expandedRows.has(student.id);
              
              return (
                <div
                  key={student.id}
                  style={{
                    background: selectedStudentId === student.id ? 'var(--panel-hover, #eff6ff)' : 'var(--panel, white)',
                    border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onClick={() => onStudentSelect(student)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(student.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <StarIcon 
                          style={{ 
                            width: '1rem', 
                            height: '1rem', 
                            color: favoriteStudents.includes(student.id) ? '#f59e0b' : 'var(--text-muted, #d1d5db)'
                          }} 
                          filled={favoriteStudents.includes(student.id)}
                        />
                      </button>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        background: avatarColor.bg,
                        color: avatarColor.color
                      }}>
                        {getInitials(student.displayName || student.realName || student.name || '')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, color: 'var(--text, #111827)', fontSize: '0.875rem' }}>
                          {student.displayName || student.realName || student.name || student.email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                          ID: STU-{student.studentNumber || student.studentId?.slice(-4) || '0000'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(student.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)' }} />
                      ) : (
                        isRTL ? (
                          <ChevronDownIcon style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)', transform: 'rotate(-90deg)' }} />
                        ) : (
                          <ChevronRightIcon style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)' }} />
                        )
                      )}
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>{t('attendance')}:</span>
                      {getAttendanceBadge(student.attendance)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>{t('part')}:</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '2rem',
                        height: '1.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 500,
                        background: '#dbeafe',
                        color: '#1e40af',
                        fontSize: '0.75rem',
                        padding: '0 0.5rem'
                      }}>
                        {student.participation}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>{t('behavior')}:</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '2rem',
                        height: '1.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 500,
                        background: student.behavior >= 0 ? '#d1fae5' : '#fee2e2',
                        color: student.behavior >= 0 ? '#065f46' : '#991b1b',
                        fontSize: '0.75rem',
                        padding: '0 0.5rem'
                      }}>
                        {student.behavior}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>{t('penalties')}:</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '2rem',
                        height: '1.75rem',
                        borderRadius: '0.375rem',
                        fontWeight: 500,
                        background: student.penalty < 0 ? '#fee2e2' : '#f3f4f6',
                        color: student.penalty < 0 ? '#991b1b' : '#374151',
                        fontSize: '0.75rem',
                        padding: '0 0.5rem'
                      }}>
                        {student.penalty}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          onStudentAction(student);
                        } catch (error) {
                          console.error('Error calling onStudentAction:', error);
                        }
                      }}
                      style={{ flex: 1 }}
                    >
                      {t('actions')}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStudentSelect(student);
                      }}
                      style={{ flex: 1 }}
                    >
                      {t('stats')}
                    </Button>
                  </div>
                  
                  {isExpanded && studentHistory[student.id] && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
                      {(() => {
                        const groupedLogs = groupLogsByDay(studentHistory[student.id] || []);
                        return groupedLogs.map((dayGroup, dayIndex) => {
                        const dateObj = new Date(dayGroup.date);
                        const dateStr = dateObj.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                        
                        const isDayExpanded = expandedDays.has(dayGroup.date);
                        const filteredCounts = {
                          attendance: activeFilters.attendance ? dayGroup.attendance.length : 0,
                          participation: activeFilters.participation ? dayGroup.participation.length : 0,
                          behavior: activeFilters.behavior ? (dayGroup.behavior ? dayGroup.behavior.length : 0) : 0,
                          penalties: activeFilters.penalties ? dayGroup.penalties.length : 0
                        };
                        const hasVisibleItems = filteredCounts.attendance + filteredCounts.participation + filteredCounts.behavior + filteredCounts.penalties > 0;
                        
                        if (!hasVisibleItems) return null;
                        
                        return (
                          <div key={dayIndex} style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            overflow: 'hidden',
                            marginBottom: '0.5rem'
                          }}>
                            <div
                              onClick={() => toggleDayExpansion(dayGroup.date)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                                background: 'var(--background-secondary, #f9fafb)',
                                cursor: 'pointer',
                                borderBottom: isDayExpanded ? '1px solid #e5e7eb' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
                                  {dateStr}
                                </span>
                                <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                  {filteredCounts.attendance > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.25rem 0.5rem',
                                      background: '#f0fdf4',
                                      border: '1px solid #bbf7d0',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      color: '#166534'
                                    }}>
                                      {filteredCounts.attendance}
                                    </div>
                                  )}
                                  {filteredCounts.participation > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.25rem 0.5rem',
                                      background: '#dbeafe',
                                      border: '1px solid #93c5fd',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      color: '#1e40af'
                                    }}>
                                      {filteredCounts.participation}
                                    </div>
                                  )}
                                  {filteredCounts.behavior > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.25rem 0.5rem',
                                      background: '#fed7aa',
                                      border: '1px solid #fdba74',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      color: '#c2410c'
                                    }}>
                                      {filteredCounts.behavior}
                                    </div>
                                  )}
                                  {filteredCounts.penalties > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.25rem 0.5rem',
                                      background: '#fee2e2',
                                      border: '1px solid #fca5a5',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      color: '#991b1b'
                                    }}>
                                      {filteredCounts.penalties}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                style={{
                                  transform: isDayExpanded ? 'rotate(180deg)' : 'rotate(90deg)',
                                  transition: 'transform 0.2s',
                                  color: '#6b7280'
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                            
                            {isDayExpanded && (
                              <div style={{ padding: '0.75rem' }}>
                                {activeFilters.attendance && dayGroup.attendance.length > 0 && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065f46', marginBottom: '0.25rem' }}>
                                      {t('attendance')}
                                    </div>
                                    {dayGroup.attendance.map((log, logIndex) => (
                                      <div key={logIndex} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.25rem 0',
                                        fontSize: '0.75rem',
                                        borderBottom: logIndex < dayGroup.attendance.length - 1 ? '1px solid #f3f4f6' : 'none'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <AttendanceIcon style={{ width: '12px', height: '12px' }} />
                                          <span>{log.label}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ color: '#6b7280' }}>
                                            {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (log.time instanceof Date ? log.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : log.time || '')}
                                          </span>
                                          {onDeleteActivity && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAttendance(student.id, log.id);
                                              }}
                                              style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-danger, #ef4444)',
                                                cursor: 'pointer',
                                                padding: '0.25rem'
                                              }}
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {activeFilters.participation && dayGroup.participation.length > 0 && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', marginBottom: '0.25rem' }}>
                                      {t('participation')}
                                    </div>
                                    {dayGroup.participation.map((log, logIndex) => (
                                      <div key={logIndex} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.25rem 0',
                                        fontSize: '0.75rem',
                                        borderBottom: logIndex < dayGroup.participation.length - 1 ? '1px solid #f3f4f6' : 'none'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <ParticipationIcon style={{ width: '12px', height: '12px' }} />
                                          <span>{log.label}</span>
                                          {log.points > 0 && (
                                            <span style={{ color: '#3b82f6', fontWeight: 600 }}>+{log.points}</span>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ color: '#6b7280' }}>
                                            {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (log.time instanceof Date ? log.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : log.time || '')}
                                          </span>
                                          {onDeleteActivity && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAttendance(student.id, log.id);
                                              }}
                                              style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-danger, #ef4444)',
                                                cursor: 'pointer',
                                                padding: '0.25rem'
                                              }}
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {activeFilters.behavior && dayGroup.behavior && dayGroup.behavior.length > 0 && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f97316', marginBottom: '0.25rem' }}>
                                      {t('behavior')}
                                    </div>
                                    {dayGroup.behavior.map((log, logIndex) => (
                                      <div key={logIndex} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.25rem 0',
                                        fontSize: '0.75rem',
                                        borderBottom: logIndex < dayGroup.behavior.length - 1 ? '1px solid #f3f4f6' : 'none'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                          </svg>
                                          <span>{log.label}</span>
                                          {log.points < 0 && (
                                            <span style={{ color: '#f97316', fontWeight: 600 }}>{log.points}</span>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ color: '#6b7280' }}>
                                            {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (log.time instanceof Date ? log.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : log.time || '')}
                                          </span>
                                          {onDeleteActivity && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAttendance(student.id, log.id);
                                              }}
                                              style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-danger, #ef4444)',
                                                cursor: 'pointer',
                                                padding: '0.25rem'
                                              }}
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {activeFilters.penalties && dayGroup.penalties.length > 0 && (
                                  <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem' }}>
                                      {t('penalties')}
                                    </div>
                                    {dayGroup.penalties.map((log, logIndex) => (
                                      <div key={logIndex} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.25rem 0',
                                        fontSize: '0.75rem',
                                        borderBottom: logIndex < dayGroup.penalties.length - 1 ? '1px solid #f3f4f6' : 'none'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <PenaltyIcon style={{ width: '12px', height: '12px' }} />
                                          <span>{log.label}</span>
                                          {log.points > 0 && (
                                            <span style={{ color: '#dc2626', fontWeight: 600 }}>-{log.points}</span>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <span style={{ color: '#6b7280' }}>
                                            {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (log.time instanceof Date ? log.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : log.time || '')}
                                          </span>
                                          {onDeleteActivity && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePenalty(student.id, log.id);
                                              }}
                                              style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-danger, #ef4444)',
                                                cursor: 'pointer',
                                                padding: '0.25rem'
                                              }}
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 6h18"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
                {t('attendance')} {getSortIcon('attendance')}
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
              .map((student) => {
              const avatarColor = getAvatarColor(student.displayName || student.realName || student.name || '');
              const isExpanded = expandedRows.has(student.id);
              
              
              return (
                <React.Fragment key={student.id}>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border, #e5e7eb)',
                      background: selectedStudentId === student.id ? 'var(--panel-hover, #eff6ff)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedStudentId !== student.id) {
                        e.currentTarget.style.background = '#eff6ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStudentId !== student.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(student.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDownIcon style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)' }} />
                        ) : (
                          isRTL ? (
                            <ChevronDownIcon style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)', transform: 'rotate(-90deg)' }} />
                          ) : (
                            <ChevronRightIcon style={{ width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)' }} />
                          )
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }} onClick={() => onStudentSelect(student)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(student.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <StarIcon 
                            style={{ 
                              width: '1rem', 
                              height: '1rem', 
                              color: favoriteStudents.includes(student.id) ? '#f59e0b' : 'var(--text-muted, #d1d5db)'
                            }} 
                            filled={favoriteStudents.includes(student.id)}
                          />
                        </button>
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          background: avatarColor.bg,
                          color: avatarColor.color
                        }}>
                          {getInitials(student.displayName || student.realName || student.name || '')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text, #111827)' }}>
                            {student.displayName || student.realName || student.name || student.email}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                            ID: STU-{student.studentNumber || student.studentId?.slice(-4) || '0000'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }} onClick={() => onStudentSelect(student)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getAttendanceBadge(student.attendance)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        background: '#dbeafe',
                        color: '#1e40af'
                      }}>
                        {student.participation}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        background: student.behavior >= 0 ? '#d1fae5' : '#fee2e2',
                        color: student.behavior >= 0 ? '#065f46' : '#991b1b'
                      }}>
                        {student.behavior}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        background: student.penalty < 0 ? '#fee2e2' : '#f3f4f6',
                        color: student.penalty < 0 ? '#991b1b' : '#374151'
                      }}>
                        {student.penalty}
                      </span>
                    </td>
                    {showTotalAttendance && (
                      <td style={{ padding: '1rem', textAlign: 'center' }} onClick={() => onStudentSelect(student)}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '0.5rem',
                          fontWeight: 600,
                          background: '#065f46',
                          color: 'white',
                          fontSize: '0.875rem'
                        }}>
                          {student.totalAttendance || 0}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              onStudentAction(student);
                            } catch (error) {
                              logger.error('Error calling onStudentAction:', error);
                            }
                          }}
                          title={t('actions')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title={t('stats')}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStudentSelect(student);
                          }}
                        >
                          <SidebarOpenIcon style={{ width: '1rem', height: '1rem' }} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await openQRCodeInNewTab(student);
                          }}
                          title={t('open_qr_code')}
                        >
                          <ExternalLink style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await sendQRCodeEmail(student);
                          }}
                          disabled={sendingEmails[student.id]?.qrCode}
                          title={t('send_qr_code')}
                        >
                          {sendingEmails[student.id]?.qrCode ? (
                            <div style={{
                              width: '1rem',
                              height: '1rem',
                              border: '2px solid #6b7280',
                              borderTop: '2px solid transparent',
                              borderRight: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                          ) : (
                            <QrCode style={{ width: '1rem', height: '1rem' }} />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await sendStudentSummaryEmail(student);
                          }}
                          disabled={sendingEmails[student.id]?.summary}
                          title={t('send_summary_report')}
                        >
                          {sendingEmails[student.id]?.summary ? (
                            <div style={{
                              width: '1rem',
                              height: '1rem',
                              border: '2px solid #6b7280',
                              borderTop: '2px solid transparent',
                              borderRight: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                          ) : (
                            <Mail style={{ width: '1rem', height: '1rem' }} />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded History Row */}
                  {isExpanded && (
                    <tr style={{ background: 'var(--background-secondary, #f9fafb)', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                      <td colSpan={showTotalAttendance ? "8" : "7"} style={{ padding: '0.5rem 1rem' }}>
                        {studentHistory[student.id] ? (
                          <div style={{ fontSize: '0.875rem' }}>
                            {/* History Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '1rem',
                              padding: '0.5rem',
                              background: 'var(--panel-hover, #f8fafc)',
                              borderRadius: '0.5rem',
                              border: '1px solid #e2e8f0'
                            }}>
                              <h4 style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary, #374151)',
                                margin: 0
                              }}>
                                {t('history')}
                              </h4>
                              <div style={{
                                display: 'flex',
                                gap: '0.25rem'
                              }}>
                                <button
                                  onClick={() => toggleFilter('attendance')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.8125rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #e2e8f0',
                                    background: activeFilters.attendance ? '#065f46' : '#ffffff',
                                    color: activeFilters.attendance ? 'white' : '#64748b',
                                    cursor: 'pointer',
                                    boxShadow: activeFilters.attendance ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                  }}
                                >
                                  <AttendanceIcon style={{ width: '14px', height: '14px' }} />
                                  {t('attendance')}
                                </button>
                                <button
                                  onClick={() => toggleFilter('participation')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.8125rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #e2e8f0',
                                    background: activeFilters.participation ? '#3b82f6' : '#ffffff',
                                    color: activeFilters.participation ? 'white' : '#64748b',
                                    cursor: 'pointer',
                                    boxShadow: activeFilters.participation ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                  }}
                                >
                                  <ParticipationIcon style={{ width: '14px', height: '14px' }} />
                                  {t('participation')}
                                </button>
                                <button
                                  onClick={() => toggleFilter('behavior')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.8125rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #e2e8f0',
                                    background: activeFilters.behavior ? '#f97316' : '#ffffff',
                                    color: activeFilters.behavior ? 'white' : '#64748b',
                                    cursor: 'pointer',
                                    boxShadow: activeFilters.behavior ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                  </svg>
                                  {t('behavior')}
                                </button>
                                <button
                                  onClick={() => toggleFilter('penalties')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.8125rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #e2e8f0',
                                    background: activeFilters.penalties ? '#dc2626' : '#ffffff',
                                    color: activeFilters.penalties ? 'white' : '#64748b',
                                    cursor: 'pointer',
                                    boxShadow: activeFilters.penalties ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                  }}
                                >
                                  <PenaltyIcon style={{ width: '14px', height: '14px' }} />
                                  {t('penalties')}
                                </button>
                              </div>
                            </div>
                            {/*<h4 style={{ */}
                            {/*  margin: '0 0 0.75rem 0', */}
                            {/*  fontSize: '0.75rem', */}
                            {/*  fontWeight: 600, */}
                            {/*  color: '#6b7280',*/}
                            {/*  textTransform: 'uppercase',*/}
                            {/*  letterSpacing: '0.05em'*/}
                            {/*}}>*/}
                            {/*  📅 Student History*/}
                            {/*</h4>*/}
                            
                            {(() => {
                              const groupedLogs = groupLogsByDay(studentHistory[student.id] || []);
                              return groupedLogs.map((dayGroup, dayIndex) => {
                              const dateObj = new Date(dayGroup.date);
                              const dateStr = dateObj.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              });
                              
                              const isDayExpanded = expandedDays.has(dayGroup.date);
                              const filteredCounts = {
                                attendance: activeFilters.attendance ? dayGroup.attendance.length : 0,
                                participation: activeFilters.participation ? dayGroup.participation.length : 0,
                                behavior: activeFilters.behavior ? (dayGroup.behavior ? dayGroup.behavior.length : 0) : 0,
                                penalties: activeFilters.penalties ? dayGroup.penalties.length : 0
                              };
                              const hasVisibleItems = filteredCounts.attendance + filteredCounts.participation + filteredCounts.behavior + filteredCounts.penalties > 0;
                              
                              if (!hasVisibleItems) return null;
                              
                              return (
                                <div key={dayIndex} style={{
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.375rem',
                                  overflow: 'hidden',
                                  marginBottom: '0.5rem'
                                }}>
                                  {/* Day Header */}
                                  <div
                                    onClick={() => toggleDayExpansion(dayGroup.date)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0.5rem 0.75rem',
                                      background: 'var(--background-secondary, #f9fafb)',
                                      cursor: 'pointer',
                                      borderBottom: isDayExpanded ? '1px solid #e5e7eb' : 'none'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
                                        {dateStr}
                                      </span>
                                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                        {filteredCounts.attendance > 0 && (
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            padding: '0.25rem 0.5rem',
                                            background: '#f0fdf4',
                                            border: '1px solid #bbf7d0',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            color: '#166534'
                                          }}>
                                            {filteredCounts.attendance}
                                          </div>
                                        )}
                                        {filteredCounts.participation > 0 && (
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            padding: '0.25rem 0.5rem',
                                            background: '#eff6ff',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            color: '#1e40af'
                                          }}>
                                            {filteredCounts.participation}
                                          </div>
                                        )}
                                        {filteredCounts.penalties > 0 && (
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            padding: '0.25rem 0.5rem',
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            color: '#b91c1c'
                                          }}>
                                            {filteredCounts.penalties}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {isDayExpanded ? (isRTL ? 'إخفاء التفاصيل' : 'Hide details') : (isRTL ? 'إظهار التفاصيل' : 'Show details')}
                                      </span>
                                      <ChevronDownIcon style={{ 
                                        width: '16px', 
                                        height: '16px',
                                        transform: isDayExpanded ? (isRTL ? 'rotate(180deg)' : 'rotate(0deg)') : (isRTL ? 'rotate(90deg)' : 'rotate(-90deg)'),
                                        transition: 'transform 0.2s'
                                      }} />
                                    </div>
                                  </div>
                                  
                                  {/* Expanded Content */}
                                  {isDayExpanded && (
                                    <div style={{ padding: '0.5rem 0.75rem' }}>
                                      {/* Attendance */}
                                      {activeFilters.attendance && dayGroup.attendance.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                          {dayGroup.attendance.map((log, idx) => (
                                            <div key={idx} style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '0.5rem', 
                                              padding: '0.375rem 0',
                                              fontSize: '0.8125rem',
                                              borderBottom: idx === dayGroup.attendance.length - 1 ? 'none' : '1px solid #f1f5f9'
                                            }}>
                                              <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                                                {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                              </span>
                                              <AttendanceIcon style={{ width: '16px', height: '16px', color: log.color || '#10b981', [isRTL ? 'marginLeft' : 'marginRight']: '0.5rem' }} />
                                              <span style={{ color: '#374151', fontWeight: 500 }}>
                                                {log.label}
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteAttendance(student.id, log.id);
                                                }}
                                                style={{ marginLeft: '0.5rem', color: '#ef4444' }}
                                                title={t('delete_attendance_record') || "Delete attendance record"}
                                              >
                                                <Trash2 style={{ width: '14px', height: '14px' }} />
                                              </Button>
                                              {log.comment && (
                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                  - {log.comment}
                                                </span>
                                              )}
                                              {/* User Attribution */}
                                              {log.performedBy && (
                                                <div style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.25rem',
                                                  [isRTL ? 'marginRight' : 'marginLeft']: 'auto',
                                                  padding: '0.125rem 0.5rem',
                                                  background: '#f0f9ff',
                                                  border: '1px solid #bae6fd',
                                                  borderRadius: '1rem',
                                                  fontSize: '0.625rem',
                                                  color: '#0369a1'
                                                }}>
                                                  <UserIcon style={{ width: '10px', height: '10px' }} />
                                                  <span style={{ fontWeight: 500 }}>
                                                    {log.performedBy.displayName || log.performedBy.email || 'Unknown'}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Participation */}
                                      {activeFilters.participation && dayGroup.participation.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                          {dayGroup.participation.map((log, idx) => (
                                            <div key={idx} style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '0.5rem',
                                              padding: '0.375rem 0',
                                              fontSize: '0.8125rem',
                                              borderBottom: idx === dayGroup.participation.length - 1 ? 'none' : '1px solid #e5e7eb'
                                            }}>
                                              <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                                                {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                              </span>
                                              <ParticipationIcon style={{ width: '16px', height: '16px', color: '#3b82f6', marginRight: '0.5rem' }} />
                                              <span style={{ color: '#374151', fontWeight: 500 }}>
                                                {log.label}
                                              </span>
                                              {log.comment && (
                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                  - {log.comment}
                                                </span>
                                              )}
                                              {log.points && (
                                                <span style={{ 
                                                  padding: '0.125rem 0.375rem',
                                                  background: '#eff6ff',
                                                  color: '#1e40af',
                                                  borderRadius: '0.25rem',
                                                  fontSize: '0.75rem'
                                                }}>
                                                  +{log.points}
                                                </span>
                                              )}
                                              {/* User Attribution */}
                                              {log.performedBy && (
                                                <div style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.25rem',
                                                  [isRTL ? 'marginRight' : 'marginLeft']: 'auto',
                                                  padding: '0.125rem 0.5rem',
                                                  background: '#eff6ff',
                                                  border: '1px solid #bfdbfe',
                                                  borderRadius: '1rem',
                                                  fontSize: '0.625rem',
                                                  color: '#1e40af'
                                                }}>
                                                  <UserIcon style={{ width: '10px', height: '10px' }} />
                                                  <span style={{ fontWeight: 500 }}>
                                                    {log.performedBy.displayName || log.performedBy.email || 'Unknown'}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Behavior */}
                                      {activeFilters.behavior && dayGroup.behavior && dayGroup.behavior.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                          {dayGroup.behavior.map((log, idx) => (
                                            <div key={idx} style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '0.5rem', 
                                              padding: '0.375rem 0',
                                              fontSize: '0.8125rem',
                                              borderBottom: idx === dayGroup.behavior.length - 1 ? 'none' : '1px solid #fed7aa'
                                            }}>
                                              <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                                                {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                              </span>
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f97316', marginRight: '0.5rem' }}>
                                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                              </svg>
                                              <span style={{ color: '#374151', fontWeight: 500 }}>
                                                {log.label}
                                              </span>
                                              {log.comment && (
                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                  - {log.comment}
                                                </span>
                                              )}
                                              {log.points && (
                                                <span style={{ 
                                                  padding: '0.125rem 0.375rem',
                                                  background: log.points > 0 ? '#f0fdf4' : '#fff7ed',
                                                  color: log.points > 0 ? '#166534' : '#c2410c',
                                                  borderRadius: '0.25rem',
                                                  fontSize: '0.75rem'
                                                }}>
                                                  {log.points > 0 ? '+' : ''}{log.points}
                                                </span>
                                              )}
                                              {/* User Attribution */}
                                              {log.performedBy && (
                                                <div style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.25rem',
                                                  [isRTL ? 'marginRight' : 'marginLeft']: 'auto',
                                                  padding: '0.125rem 0.5rem',
                                                  background: '#fff7ed',
                                                  border: '1px solid #fed7aa',
                                                  borderRadius: '1rem',
                                                  fontSize: '0.625rem',
                                                  color: '#c2410c'
                                                }}>
                                                  <UserIcon style={{ width: '10px', height: '10px' }} />
                                                  <span style={{ fontWeight: 500 }}>
                                                    {log.performedBy.displayName || log.performedBy.email || 'Unknown'}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Penalties */}
                                      {activeFilters.penalties && dayGroup.penalties.length > 0 && (
                                        <div>
                                          {dayGroup.penalties.map((log, idx) => (
                                            <div key={idx} style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '0.5rem',
                                              padding: '0.375rem 0',
                                              fontSize: '0.8125rem',
                                              borderBottom: idx === dayGroup.penalties.length - 1 ? 'none' : '1px solid #fecaca'
                                            }}>
                                              <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                                                {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                              </span>
                                              <PenaltyIcon style={{ width: '16px', height: '16px', color: '#ef4444', marginRight: '0.5rem' }} />
                                              <span style={{ color: '#374151', fontWeight: 500 }}>
                                                {log.label}
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeletePenalty(student.id, log.id);
                                                }}
                                                style={{ marginLeft: '0.5rem', color: '#ef4444' }}
                                                title={t('delete_penalty_record') || "Delete penalty record"}
                                              >
                                                <Trash2 style={{ width: '14px', height: '14px' }} />
                                              </Button>
                                              {log.comment && (
                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                  - {log.comment}
                                                </span>
                                              )}
                                              {log.severity && (
                                                <span style={{ 
                                                  padding: '0.125rem 0.375rem',
                                                  background: '#fef2f2',
                                                  color: '#b91c1c',
                                                  borderRadius: '0.25rem',
                                                  fontSize: '0.75rem'
                                                }}>
                                                  {log.severity}
                                                </span>
                                              )}
                                              {/* User Attribution */}
                                              {log.performedBy && (
                                                <div style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.25rem',
                                                  [isRTL ? 'marginRight' : 'marginLeft']: 'auto',
                                                  padding: '0.125rem 0.5rem',
                                                  background: '#fef2f2',
                                                  border: '1px solid #fecaca',
                                                  borderRadius: '1rem',
                                                  fontSize: '0.625rem',
                                                  color: '#b91c1c'
                                                }}>
                                                  <UserIcon style={{ width: '10px', height: '10px' }} />
                                                  <span style={{ fontWeight: 500 }}>
                                                    {log.performedBy.displayName || log.performedBy.email || 'Unknown'}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                          </div>
                        ): <div style={{
                          padding: '2rem',
                          textAlign: 'center',
                          color: 'var(--text-muted, #9ca3af)',
                          fontSize: '0.875rem'
                        }}>
                          {t('loading')}...
                        </div>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1.5rem'
      }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)', margin: 0 }}>
          {t('showing_of_students', { count: students.length, total: totalStudents })}
          {currentPage > 1 && ` (${t('page_of', { current: currentPage, total: totalPages })})`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button 
            variant="ghost" 
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            {t('previous')}
          </Button>
          <span style={{ fontSize: '0.875rem', color: '#6b7280', padding: '0 0.5rem' }}>
            {currentPage} / {totalPages}
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            {t('next')}
          </Button>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('delete_activity_title', { type: deleteType === 'attendance' ? t('attendance') : t('penalty') })}
        message={t('delete_activity_msg', { studentName: students.find(s => s.id === deleteLogId?.split('_')[1])?.name || t('this_student') })}
        loading={deleteLoading}
      />
    </div>
  );
});

export default StudentRoster;
