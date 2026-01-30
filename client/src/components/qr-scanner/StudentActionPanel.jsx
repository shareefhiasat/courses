import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { X, Star, Mail, QrCode, Users, AlertCircle, Zap, ChevronDown, ExternalLink, Trophy, Grid, List, Trash2 } from 'lucide-react';
import { Button } from '@ui';
import { Card, CardBody } from '@ui';
import { ATTENDANCE_STATUS_LABELS, getAttendanceByStudent, deleteAttendance } from '@firebaseServices/attendance';
import { getPenalties, deletePenalty } from '@firebaseServices/penalties';
import { getFunctions } from '@firebaseServices/config';
import eventBus, { EVENTS } from '@utils/eventBus';
import { FancyLoading } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { Type } from 'lucide-react';
import { BEHAVIOR_TYPES, getBehaviorTypeById, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes';
import { PARTICIPATION_TYPES, getParticipationTypeById, getParticipationLabel, getParticipationIcon, getParticipationColor } from '@constants/participationTypes';
import { PENALTY_TYPES, getPenaltyTypeById, getPenaltyLabel, getPenaltyDescription, getPenaltyIcon, getPenaltyColor } from '@constants/penaltyTypes';
import { StudentHistory } from '@ui/history';

const renderIcon = (iconName, style = {}) => {
  // Try to get icon from behavior types first
  const behaviorIcon = getBehaviorIcon(iconName);
  const behaviorColor = getBehaviorColor(iconName);
  
  // Try to get icon from participation types
  const participationIcon = getParticipationIcon(iconName);
  const participationColor = getParticipationColor(iconName);
  
  // Try to get icon from penalty types
  const penaltyIcon = getPenaltyIcon(iconName);
  const penaltyColor = getPenaltyColor(iconName);
  
  // Determine which type and color to use
  let finalIconName = iconName;
  let finalColor = style.color || '#374151';
  
  if (BEHAVIOR_TYPES.find(bt => bt.id === iconName)) {
    finalIconName = behaviorIcon;
    finalColor = behaviorColor;
  } else if (PARTICIPATION_TYPES.find(pt => pt.id === iconName)) {
    finalIconName = participationIcon;
    finalColor = participationColor;
  } else if (PENALTY_TYPES.find(pt => pt.id === iconName)) {
    finalIconName = penaltyIcon;
    finalColor = penaltyColor;
  }
  
  return <Type iconName={finalIconName} style={style} color={finalColor} />;
};


export default function StudentActionPanel({
  student,
  onClose,
  onBehaviorSubmit,
  onMarkAttendance,
  behaviorTypes,
  participationTypes,
  showFavoritesOnly = false,
  onToggleFavorites,
  favoriteBehaviors = [],
  onToggleFavorite,
  sendNotifications = false,
  onToggleNotifications
}) {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const [selectedActions, setSelectedActions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [deleteLogId, setDeleteLogId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionPoints, setActionPoints] = useState({});
  const [internalNote, setInternalNote] = useState('');
  const [activeTab, setActiveTab] = useState('behavior');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [todayLogs, setTodayLogs] = useState([]);
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [sendingQRCode, setSendingQRCode] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    behavior: false,
    participation: false,
    penalty: false
  });
  const [activeFilters, setActiveFilters] = useState({
    attendance: true,
    participation: true,
    behavior: true,
    penalties: true
  });

  // Debounced resize handler for performance
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Send QR code email
  const sendQRCodeEmail = async () => {
    if (!student?.id || !student?.email) {
      logger.error('Student information missing');
      return;
    }

    setSendingQRCode(true);
    try {
      const functions = getFunctions();
      const sendQRCodeEmail = functions.httpsCallable('sendQRCodeEmail');

      const result = await sendQRCodeEmail({
        studentId: student.id,
        studentEmail: student.email
      });

      if (result.success) {
        logger.debug('QR code email sent successfully');
      } else {
        logger.error('Failed to send QR code email:', result.message);
      }
    } catch (error) {
      logger.error('Error sending QR code email:', error);
    } finally {
      setSendingQRCode(false);
    }
  };

  // Send student summary email
  const sendStudentSummaryEmail = async () => {
    if (!student?.id || !student?.email) {
      logger.error('Student information missing');
      return;
    }

    setSendingSummary(true);
    try {
      // Calculate statistics from the logs we already have
      const attendanceStats = {
        present: logs.filter(log => log.type === 'attendance' && log.data.status === 'present').length,
        late: logs.filter(log => log.type === 'attendance' && log.data.status === 'late').length,
        absent: logs.filter(log => log.type === 'attendance' && log.data.status === 'absent').length,
        percentage: 0 // Will be calculated
      };

      const totalAttendance = attendanceStats.present + attendanceStats.late + attendanceStats.absent;
      if (totalAttendance > 0) {
        attendanceStats.percentage = Math.round((attendanceStats.present / totalAttendance) * 100);
      }

      const participationStats = {
        total: student.participation || 0,
        positive: logs.filter(log => log.type === 'participation' && log.points > 0).reduce((sum, log) => sum + log.points, 0),
        neutral: logs.filter(log => log.type === 'participation' && log.points === 0).length
      };

      const behaviorStats = {
        total: student.behavior || 0,
        positive: logs.filter(log => log.type === 'behavior' && log.points > 0).reduce((sum, log) => sum + log.points, 0),
        negative: Math.abs(logs.filter(log => log.type === 'behavior' && log.points < 0).reduce((sum, log) => sum + log.points, 0))
      };

      const penaltyStats = {
        total: logs.filter(log => log.type === 'penalty').length,
        minor: logs.filter(log => log.type === 'penalty' && log.severity === 'minor').length,
        major: logs.filter(log => log.type === 'penalty' && log.severity === 'major').length,
        recentPenalties: logs.filter(log => log.type === 'penalty').slice(0, 3).map(log =>
          `${log.label} (${new Date(log.time).toLocaleDateString()})`
        ).join(', ')
      };

      // Calculate overall grade based on all factors
      const attendanceScore = attendanceStats.percentage;
      const participationScore = Math.min(100, participationStats.total * 2);
      const behaviorScore = Math.max(0, Math.min(100, 50 + behaviorStats.total));
      const penaltyDeduction = penaltyStats.total * 5;

      const overallScore = Math.max(0, Math.min(100,
        (attendanceScore * 0.4) +
        (participationScore * 0.3) +
        (behaviorScore * 0.2) +
        (100 - penaltyDeduction) * 0.1
      ));

      let overallGrade = 'F';
      if (overallScore >= 90) overallGrade = 'A+';
      else if (overallScore >= 85) overallGrade = 'A';
      else if (overallScore >= 80) overallGrade = 'B+';
      else if (overallScore >= 75) overallGrade = 'B';
      else if (overallScore >= 70) overallGrade = 'C+';
      else if (overallScore >= 65) overallGrade = 'C';
      else if (overallScore >= 60) overallGrade = 'D+';
      else if (overallScore >= 55) overallGrade = 'D';

      const functions = getFunctions();
      const sendSummaryEmail = functions.httpsCallable('sendSummaryEmail');

      const result = await sendSummaryEmail({
        to: student.email,
        templateId: 'student_summary_report',
        templateData: {
          studentName: student.displayName || student.realName || student.name,
          studentEmail: student.email,
          studentId: student.studentNumber || student.id,
          className: selectedClass?.name || selectedClass?.code || 'Class',
          attendanceStats,
          participationStats,
          behaviorStats,
          penaltyStats,
          overallGrade,
          reportPeriod: 'This Term',
          siteName: 'CS Learning Hub',
          currentDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
      });

      if (result.success) {
        logger.debug('Student summary email sent successfully');
      } else {
        logger.error('Failed to send student summary email:', result.message);
      }
    } catch (error) {
      logger.error('Error sending student summary email:', error);
    } finally {
      setSendingSummary(false);
    }
  };

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

  const toggleSectionExpansion = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Memoized detailed statistics calculation for performance
  const getDetailedStats = useCallback(() => {
    const stats = {
      behavior: {},
      participation: {},
      penalty: {}
    };

    // Calculate behavior stats
    BEHAVIOR_TYPES.forEach(type => {
      stats.behavior[type.id] = {
        count: 0,
        totalPoints: 0,
        label: type.label_en,
        color: type.color,
        icon: type.icon
      };
    });

    // Calculate participation stats
    PARTICIPATION_TYPES.forEach(type => {
      stats.participation[type.id] = {
        count: 0,
        totalPoints: 0,
        label: type.label_en,
        color: '#3b82f6',
        icon: type.icon
      };
    });

    // Calculate penalty stats using dedicated PENALTY_TYPES
    PENALTY_TYPES.forEach(type => {
      stats.penalty[type.id] = {
        count: 0,
        totalPoints: 0,
        label: lang === 'ar' ? type.label_ar : type.label_en,
        color: type.color,
        icon: type.icon
      };
    });

    // Process logs to calculate stats
    todayLogs.forEach((log) => {
      if (log.type === 'behavior') {
        const behaviorType = log.data.type || 'other';

        if (stats.behavior[behaviorType]) {
          stats.behavior[behaviorType].count++;
          stats.behavior[behaviorType].totalPoints += log.points || 0;
        }
        // Also add to penalty if it's a negative behavior
        if (log.points < 0 && stats.penalty[behaviorType]) {
          stats.penalty[behaviorType].count++;
          stats.penalty[behaviorType].totalPoints += log.points || 0;
        }
      } else if (log.type === 'participation') {
        const participationType = log.data.type || 'other';

        if (stats.participation[participationType]) {
          stats.participation[participationType].count++;
          stats.participation[participationType].totalPoints += log.points || 0;
        }
      } else if (log.type === 'penalty') {
        const penaltyType = log.data.type || 'other';

        if (stats.penalty[penaltyType]) {
          stats.penalty[penaltyType].count++;
          stats.penalty[penaltyType].totalPoints += log.points || 0;
        }
      }
    });

    return stats;
  }, [todayLogs]);

  // Fetch historical logs for student - defined before usage
  const fetchHistoricalLogs = useCallback(async () => {
    if (!student?.id) return;

    setLogsLoading(true);
    try {
      // Small delay to ensure Firestore has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get all attendance records for this student (no date filter)
      const attendanceResponse = await getAttendanceByStudent(student.id);
      const attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];

      // Get all penalties for this student
      const penaltiesResponse = await getPenalties();
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const studentPenalties = allPenalties.filter(p => p.studentId === student.id);

      // Combine and format logs with date information
      const logs = [
        ...attendanceRecords.map(record => ({
          id: record.id || record.docId,
          type: record.category || (record.delta ? (record.delta > 0 ? 'participation' : 'behavior') : 'attendance'),
          date: record.date || (record.timestamp?.toDate ? record.timestamp.toDate().toISOString().split('T')[0] : new Date(record.timestamp).toISOString().split('T')[0]),
          time: record.timestamp || record.date,
          data: record,
          label: ATTENDANCE_STATUS_LABELS[record.status]?.en || record.status,
          points: record.delta || 0,
          comment: record.reason || record.notes || '',
          severity: 'low',
          color: ATTENDANCE_STATUS_LABELS[record.status]?.color || '#6b7280'
        })),
        ...studentPenalties.map(penalty => ({
          id: penalty.id || penalty.docId,
          type: 'penalty',
          date: penalty.date || (penalty.createdAt?.toDate ? penalty.createdAt.toDate().toISOString().split('T')[0] : new Date(penalty.createdAt).toISOString().split('T')[0]),
          time: penalty.createdAt,
          data: penalty,
          label: penalty.reason || 'Penalty',
          points: penalty.points || 0,
          comment: penalty.comment || '',
          severity: penalty.severity || 'medium',
          color: penalty.points > 0 ? '#dcfce7' : '#fee2e2'
        }))
      ].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Most recent first
      });

      setHistoricalLogs(logs);
      setLogsError('');
    } catch (error) {
      logger.error('Error fetching historical logs:', error);
      setLogsError('Failed to load history');
      setHistoricalLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [student?.id]);

  // Fetch today's logs when student changes or manual refresh triggered
  useEffect(() => {
    // Reset when student changes
    setSelectedActions([]);
    setActionPoints({});
    setInternalNote('');

    // Fetch historical logs for the student
    if (student?.id) {
      fetchHistoricalLogs();
    }
  }, [student?.id, historyRefreshKey, fetchHistoricalLogs]);

  // Real-time updates for history
  useEffect(() => {
    if (!student?.id) return;

    const unsubscribeAttendance = eventBus.on(EVENTS.ATTENDANCE_MARKED, (data) => {
      if (data.studentId === student.id) fetchHistoricalLogs();
    });

    const unsubscribeBehavior = eventBus.on(EVENTS.BEHAVIOR_LOGGED, (data) => {
      if (data.studentId === student.id) fetchHistoricalLogs();
    });

    const unsubscribeParticipation = eventBus.on(EVENTS.PARTICIPATION_ADDED, (data) => {
      if (data.studentId === student.id) fetchHistoricalLogs();
    });

    const unsubscribePenalty = eventBus.on(EVENTS.PENALTY_ASSIGNED, (data) => {
      if (data.studentId === student.id) fetchHistoricalLogs();
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeBehavior();
      unsubscribeParticipation();
      unsubscribePenalty();
    };
  }, [student?.id, fetchHistoricalLogs]);

  // Fetch real data from Firebase - memoized
  const handleMarkAttendance = useCallback(async (studentId, status) => {
    setShowLoadingOverlay(true);
    try {
      await onMarkAttendance(studentId, status);
      // Force refresh the history by incrementing the key
      setHistoryRefreshKey(prev => prev + 1);
      // Refresh data after marking attendance
      await fetchHistoricalLogs();
    } catch (error) {
      logger.error('Error marking attendance:', error);
    } finally {
      setShowLoadingOverlay(false);
    }
  }, [onMarkAttendance, fetchHistoricalLogs]);

  // Delete attendance log
  const handleDeleteAttendance = useCallback((logId) => {
    setDeleteType('attendance');
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  }, []);

  // Delete penalty log
  const handleDeletePenalty = useCallback((logId) => {
    setDeleteType('penalty');
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  }, []);

  // Handle actual deletion after confirmation - memoized
  const handleConfirmDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      let result;
      if (deleteType === 'attendance') {
        result = await deleteAttendance(deleteLogId);
        if (result.success) {
          // Refresh the history
          setHistoryRefreshKey(prev => prev + 1);
          await fetchHistoricalLogs();
          
          // Emit event for real-time updates
          eventBus.emit(EVENTS.ATTENDANCE_MARKED, {
            studentId: student.id,
            classId: student.classId,
            status: 'deleted',
            performedBy: user,
            timestamp: new Date()
          });
        } else {
          console.error('Failed to delete attendance record:', result.error);
          alert('Failed to delete attendance record: ' + result.error);
        }
      } else if (deleteType === 'penalty') {
        result = await deletePenalty(deleteLogId);
        if (result.success) {
          // Refresh the history
          setHistoryRefreshKey(prev => prev + 1);
          await fetchHistoricalLogs();
          
          // Emit event for real-time updates
          eventBus.emit(EVENTS.PENALTY_ASSIGNED, {
            studentId: student.id,
            classId: student.classId,
            status: 'deleted',
            performedBy: user,
            timestamp: new Date()
          });
        } else {
          logger.error('Failed to delete penalty record:', result.error);
          alert('Failed to delete penalty record: ' + result.error);
        }
      }
    } catch (error) {
      logger.error(`Error deleting ${deleteType} record:`, error);
      alert(`Error deleting ${deleteType} record: ` + error.message);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setDeleteType('');
      setDeleteLogId('');
    }
  }, [deleteType, deleteLogId, student, user, fetchHistoricalLogs]);

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

  // Memoized grouped logs for display
  const memoizedGroupedLogs = useMemo(() => groupLogsByDay(historicalLogs), [historicalLogs, groupLogsByDay]);

  if (!student) return null;

  // Memoized available options for performance
  const options = useMemo(() => {
    if (activeTab === 'participation') {
      return participationTypes.map(pt => ({
        ...pt,
        category: 'participation'
      }));
    } else if (activeTab === 'behavior') {
      return behaviorTypes.filter(bt => bt.points !== 0).map(bt => ({
        ...bt,
        category: 'behavior'
      }));
    } else if (activeTab === 'penalty') {
      return behaviorTypes.filter(bt => bt.points < 0).map(bt => ({
        ...bt,
        category: 'penalty'
      }));
    }
    return [];
  }, [activeTab, participationTypes, behaviorTypes]);

  const toggleAction = useCallback((option) => {
    setSelectedActions((prev) => {
      const exists = prev.find(a => a.id === option.id);
      if (exists) {
        // Remove action and its points
        setActionPoints(prevPoints => {
          const newPoints = { ...prevPoints };
          delete newPoints[option.id];
          return newPoints;
        });
        return prev.filter(a => a.id !== option.id);
      } else {
        // Add action with default points
        setActionPoints(prev => ({
          ...prev,
          [option.id]: option.points || 0
        }));
        return [...prev, option];
      }
    });
  }, []);

  const handlePointsChange = useCallback((optionId, value) => {
    const numValue = parseInt(value) || 0;
    setActionPoints(prev => ({
      ...prev,
      [optionId]: numValue
    }));
  }, []);

  const handleApply = useCallback(() => {
    if (selectedActions.length === 0) return;

    const actions = selectedActions.map((action) => ({
      type: action.id,
      points: actionPoints[action.id] || 0, // Use the mandatory points field
      timestamp: new Date(),
      category: action.category
    }));

    onBehaviorSubmit(student.id, actions, internalNote);
    setSelectedActions([]);
    setActionPoints({});
    setInternalNote('');
  }, [selectedActions, actionPoints, internalNote, student.id, onBehaviorSubmit]);

  const toggleFilter = useCallback((filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  }, []);

  const getInitials = useCallback((name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getAvatarColor = (name) => {
    const colors = [
      { bg: '#e9d5ff', color: '#6b21a8' },
      { bg: '#fed7aa', color: '#9a3412' },
      { bg: '#fecaca', color: '#991b1b' },
      { bg: '#d1fae5', color: '#065f46' },
      { bg: '#dbeafe', color: '#1e40af' },
      { bg: '#f3e8ff', color: '#6b21a8' }
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Memoized computed values for performance
  const avatarColor = useMemo(() => getAvatarColor(student?.name || ''), [student?.name, getAvatarColor]);
  const attendanceStatus = useMemo(() => {
    // Check if there are actual attendance records for today (not participation/behavior/penalty)
    const hasTodayAttendance = todayLogs.some(log => 
      log.type === 'attendance' && 
      log.data?.status && 
      ['present', 'absent_no_excuse', 'absent_with_excuse', 'late', 'excused_leave', 'human_case'].includes(log.data.status)
    );
    
    // If no actual attendance records for today, show NOTHING YET
    if (!hasTodayAttendance) {
      return {
        en: t('nothing_yet') || 'NOTHING YET',
        ar: t('nothing_yet') || 'لا شيء بعد',
        color: '#fbbf24'
      };
    }
    
    // If there's a specific attendance status, use it
    if (student?.attendance) {
      const statusInfo = ATTENDANCE_STATUS_LABELS[student?.attendance];
      if (statusInfo) {
        return statusInfo;
      }
    }
    
    // Fallback to NOTHING YET if no valid status found
    return {
      en: t('nothing_yet') || 'NOTHING YET',
      ar: t('nothing_yet') || 'لا شيء بعد',
      color: '#fbbf24'
    };
  }, [student?.attendance, todayLogs, t]);

  // Memoized attendance statistics calculation (TODAY ONLY)
  const attendanceStats = useMemo(() => {
    return todayLogs.reduce((acc, log) => {
      if (log.type === 'attendance') {
        const status = log.data?.status;
        if (status === 'present') acc.present++;
        else if (status === 'absent_no_excuse') acc.absent_no_excuse++;
        else if (status === 'absent_with_excuse') acc.absent_with_excuse++;
        else if (status === 'late') acc.late++;
        else if (status === 'excused_leave') acc.excused_leave++;
        else if (status === 'human_case') acc.human_case++;
      }
      return acc;
    }, { present: 0, late: 0, absent_no_excuse: 0, absent_with_excuse: 0, excused_leave: 0, human_case: 0 });
  }, [todayLogs]);

  // Memoized TOTAL attendance statistics calculation (ALL TIME)
  const totalAttendanceStats = useMemo(() => {
    return historicalLogs.reduce((acc, log) => {
      if (log.type === 'attendance') {
        const status = log.data?.status;
        if (status === 'present') acc.present++;
        else if (status === 'absent_no_excuse') acc.absent_no_excuse++;
        else if (status === 'absent_with_excuse') acc.absent_with_excuse++;
        else if (status === 'late') acc.late++;
        else if (status === 'excused_leave') acc.excused_leave++;
        else if (status === 'human_case') acc.human_case++;
      }
      return acc;
    }, { present: 0, late: 0, absent_no_excuse: 0, absent_with_excuse: 0, excused_leave: 0, human_case: 0 });
  }, [historicalLogs]);

  const totalPoints = useMemo(() => 
    (student?.participation || 0) + (student?.behavior || 0) + (student?.penalty || 0),
    [student?.participation, student?.behavior, student?.penalty]
  );

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--overlay, rgba(0, 0, 0, 0.5))',
          zIndex: 1999
        }}
        onClick={onClose}
      />
      
      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--panel, white)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FancyLoading />
        </div>
      )}
      
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{
        position: 'fixed',
        top: 0,
        [isRTL ? 'left' : 'right']: 0,
        width: isMobile ? '100%' : '100%',
        maxWidth: isMobile ? '100%' : '28rem',
        height: '100%',
        background: 'var(--panel, white)',
        boxShadow: isRTL ? '4px 0 24px rgba(0,0,0,0.1)' : '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border, #e5e7eb)', paddingBottom: '0.15rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text, #111827)', margin: 0, fontSize: '0.875rem' }}>
                    {student.displayName || student.realName || student.name || student.email || t('unknown_student')}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{
                      width: '0.375rem',
                      height: '0.375rem',
                      background: attendanceStatus.color,
                      borderRadius: '9999px'
                    }} />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {lang === 'ar' ? (attendanceStatus.ar || attendanceStatus.en) : attendanceStatus.en}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '0.625rem', 
                  color: 'var(--text-muted, #6b7280)', 
                  marginTop: '0.125rem',
                  fontFamily: 'monospace',
                  background: 'var(--panel-hover, #f3f4f6)',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  display: 'inline-block'
                }}>
                  ID: STU-{student.studentNumber || student.id?.slice(-4) || '0000'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }}>
              <div
                onClick={onToggleNotifications}
                title={sendNotifications ? t('notifications_on') : t('notifications_off')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.5rem',
                  background: sendNotifications ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  border: `1px solid ${sendNotifications ? '#bbf7d0' : '#fecaca'}`,
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  width: '1.75rem',
                  height: '0.875rem',
                  background: sendNotifications ? '#10b981' : '#ef4444',
                  borderRadius: '1rem',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: '0.625rem',
                    height: '0.625rem',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '0.125rem',
                    left: sendNotifications ? (isRTL ? '0.125rem' : '1rem') : (isRTL ? '1rem' : '0.125rem'),
                    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
                <span style={{ 
                  fontSize: '0.625rem', 
                  fontWeight: 600, 
                  color: sendNotifications ? '#166534' : '#991b1b',
                }}>
                  {t('notifs')}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} title={t('close')}>
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </Button>
              {/* <Button 
                variant="ghost" 
                size="icon" 
                onClick={async () => {
                  const referenceId = student.studentNumber ? `STU-${student.studentNumber}` : generateReferenceId(student.id || student.docId);
                  const qrDataUrl = await generateStudentQRCode(referenceId, { width: 512, margin: 4 });
                  const newTab = window.open();
                  newTab.document.write(`<html><head><title>QR Code</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f3f4f6;"><img src="${qrDataUrl}" style="width:300px;height:300px;"/><h1 style="margin:1rem 0 0;">${student.displayName || student.name}</h1></body></html>`);
                }}
                title={t('open_qr_code')}
              >
                <ExternalLink style={{ width: '1.25rem', height: '1.25rem' }} />
              </Button> */}
            </div>
          </div>

          {/* Attendance Status - Moved to top */}
          <div style={{ marginBottom: '0.5rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text, #111827)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              {/*Attendance Status*/}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '0.25rem'
            }}>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'present');
                }}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #10b981',
                  background: student.attendance === 'present' ? '#10b981' : 'white',
                  color: student.attendance === 'present' ? 'white' : '#10b981',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {attendanceStats.present && Number(attendanceStats.present) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'present' ? 'white' : '#10b981',
                      background: student.attendance === 'present' ? '#10b981' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.present}
                    </span>
                  )}
                </div>
                <div>{t('present')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'late');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #f59e0b',
                  background: student.attendance === 'late' ? '#f59e0b' : 'white',
                  color: student.attendance === 'late' ? 'white' : '#f59e0b',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 12 12"></polyline>
                  </svg>
                  {attendanceStats.late && Number(attendanceStats.late) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'late' ? 'white' : '#f59e0b',
                      background: student.attendance === 'late' ? '#f59e0b' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.late}
                    </span>
                  )}
                </div>
                <div>{t('late')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'absent_no_excuse');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #ef4444',
                  background: student.attendance === 'absent_no_excuse' ? '#ef4444' : 'white',
                  color: student.attendance === 'absent_no_excuse' ? 'white' : '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  {attendanceStats.absent_no_excuse && Number(attendanceStats.absent_no_excuse) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'absent_no_excuse' ? 'white' : '#ef4444',
                      background: student.attendance === 'absent_no_excuse' ? '#ef4444' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.absent_no_excuse}
                    </span>
                  )}
                </div>
                <div>{t('absent')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'absent_with_excuse');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #ef4444',
                  background: student.attendance === 'absent_with_excuse' ? '#ef4444' : 'white',
                  color: student.attendance === 'absent_with_excuse' ? 'white' : '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  {attendanceStats.absent_with_excuse && Number(attendanceStats.absent_with_excuse) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'absent_with_excuse' ? 'white' : '#ef4444',
                      background: student.attendance === 'absent_with_excuse' ? '#ef4444' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.absent_with_excuse}
                    </span>
                  )}
                </div>
                <div>{t('absent_excused')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'excused_leave');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #ef4444',
                  background: student.attendance === 'excused_leave' ? '#ef4444' : 'white',
                  color: student.attendance === 'excused_leave' ? 'white' : '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                  {attendanceStats.excused_leave && Number(attendanceStats.excused_leave) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'excused_leave' ? 'white' : '#ef4444',
                      background: student.attendance === 'excused_leave' ? '#ef4444' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.excused_leave}
                    </span>
                  )}
                </div>
                <div>{t('excused_leave')}</div>
              </button>
              <button
                onClick={async () => {
                  await handleMarkAttendance(student.id, 'human_case');
                }}
                disabled={showLoadingOverlay}
                style={{
                  padding: '0.375rem',
                  borderRadius: '0.25rem',
                  border: '2px solid #8b5cf6',
                  background: student.attendance === 'human_case' ? '#8b5cf6' : 'white',
                  color: student.attendance === 'human_case' ? 'white' : '#8b5cf6',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.125rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  minWidth: '3rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {attendanceStats.human_case && Number(attendanceStats.human_case) > 0 && (
                    <span style={{
                      fontSize: '0.5rem',
                      fontWeight: 600,
                      color: student.attendance === 'human_case' ? 'white' : '#8b5cf6',
                      background: student.attendance === 'human_case' ? '#8b5cf6' : 'transparent',
                      borderRadius: '0.125rem',
                      padding: '0.125rem 0.25rem',
                      minWidth: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {attendanceStats.human_case}
                    </span>
                  )}
                </div>
                <div>{t('human_case')}</div>
              </button>
            </div>
          </div>

          {/* Points Summary */}
          <div style={{ marginBottom: '0.5rem' }}>
            {/* 4 Total Cards Only - without Late */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.15rem',
              marginBottom: '0.5rem'
            }}>
              {/* Total Present */}
              <div style={{
                padding: '0.375rem',
                background: '#16a34a',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {totalAttendanceStats.present}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('present')}
                </div>
              </div>

              {/* Total Penalty */}
              <div style={{
                padding: '0.5rem',
                background: '#dc2626',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {student.penalty || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('penalty')}
                </div>
              </div>

              {/* Total Behavior */}
              <div style={{
                padding: '0.5rem',
                background: '#f97316',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {student.behavior >= 0 ? '+' : ''}{student.behavior || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('behavior')}
                </div>
              </div>

              {/* Total Participation */}
              <div style={{
                padding: '0.5rem',
                background: '#3b82f6',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {student.participation || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('participation')}
                </div>
              </div>
            </div>

            {/* Additional Attendance Totals Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.25rem',
              marginBottom: '0.5rem'
            }}>
              {/* Total Late */}
              <div style={{
                padding: '0.5rem',
                background: '#eab308',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {totalAttendanceStats.late}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('late')}
                </div>
              </div>

              {/* Total Human Case */}
              <div style={{
                padding: '0.5rem',
                background: '#8b5cf6',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {attendanceStats.human_case}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('human_case')}
                </div>
              </div>

              {/* Total Excused Leave */}
              <div style={{
                padding: '0.5rem',
                background: '#06b6d4',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {attendanceStats.excused_leave}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('excused_leave')}
                </div>
              </div>

              {/* Total Absent (Excused) */}
              <div style={{
                padding: '0.5rem',
                background: '#f59e0b',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {attendanceStats.absent_with_excuse}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('absent_excused')}
                </div>
              </div>

              {/* Total Absent (No Excuse) */}
              <div style={{
                padding: '0.5rem',
                background: '#ef4444',
                borderRadius: '0.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '3rem'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                  {attendanceStats.absent_no_excuse}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                  {t('absent')}
                </div>
              </div>
            </div>

            {/* Entries Tabs Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.5rem',
              background: 'var(--panel-hover, #f8fafc)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light, #e2e8f0)',
              marginBottom: '0.5rem'
            }}>
              {/* Participation Section */}
              <div style={{ marginBottom: '0.15rem' }}>
              <div
                onClick={() => toggleSectionExpansion('participation')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#3b82f6',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '0.15rem'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                  {t('participation_details')} ({student.participation || 0} {t('points')}, {(() => {
                    const stats = getDetailedStats();
                    return PARTICIPATION_TYPES.reduce((sum, type) => sum + (stats.participation[type.id]?.count || 0), 0);
                  })()} {t('entries')})
                </span>
                <ChevronDown
                  style={{
                    width: '16px',
                    height: '16px',
                    transform: expandedSections.participation ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>

              {expandedSections.participation && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  {(() => {
                    const stats = getDetailedStats();
                    return PARTICIPATION_TYPES.map(type => {
                      const stat = stats.participation[type.id];
                      return (
                        <div key={type.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: '#dbeafe', // Light blue background
                          borderRadius: '0.375rem',
                          border: '1px solid #3b82f6', // Blue border
                          opacity: stat.count > 0 ? 1 : 0.8
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#1e3a8a', // Dark blue text
                            flex: 1
                          }}>
                            {lang === 'ar' ? (type.label_ar || type.label_en) : type.label_en}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#1e3a8a', // Dark blue text
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            Total: {stat.totalPoints}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#1e3a8a', // Dark blue text
                            minWidth: '3rem',
                            textAlign: 'right'
                          }}>
                            Count: ({stat.count})
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Total Participation Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: '#3b82f6',
                    borderRadius: '0.375rem',
                    marginTop: '0.25rem',
                    border: '2px solid white'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'white',
                      flex: 1
                    }}>
                      Participation
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: 'center'
                    }}>
                      Total: {student.participation || 0}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: isRTL ? 'left' : 'right'
                    }}>
                      {t('count')}: ({(() => {
                        const stats = getDetailedStats();
                        return PARTICIPATION_TYPES.reduce((sum, type) => sum + (stats.participation[type.id]?.count || 0), 0);
                      })()})
                    </div>
                  </div>
                </div>
              )}
            </div>

              {/* Behavior Section */}
              <div style={{ marginBottom: '0.15rem' }}>
              <div
                onClick={() => toggleSectionExpansion('behavior')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#f97316',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '0.15rem'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                  {t('behavior_details')} ({student.behavior || 0} {t('points')}, {(() => {
                    const stats = getDetailedStats();
                    return BEHAVIOR_TYPES.reduce((sum, type) => sum + (stats.behavior[type.id]?.count || 0), 0);
                  })()} {t('entries')})
                </span>
                <ChevronDown
                  style={{
                    width: '16px',
                    height: '16px',
                    transform: expandedSections.behavior ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>

              {expandedSections.behavior && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  {(() => {
                    const stats = getDetailedStats();
                    return BEHAVIOR_TYPES.map(type => {
                      const stat = stats.behavior[type.id];
                      return (
                        <div key={type.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: '#fed7aa', // Light orange background
                          borderRadius: '0.375rem',
                          border: '1px solid #f97316', // Orange border
                          opacity: stat.count > 0 ? 1 : 0.8
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#9a3412', // Dark orange text
                            flex: 1
                          }}>
                            {lang === 'ar' ? (type.label_ar || type.label_en) : type.label_en}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#9a3412', // Dark orange text
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            {t('total')}: {stat.totalPoints >= 0 ? '+' : ''}{stat.totalPoints}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#9a3412', // Dark orange text
                            minWidth: '3rem',
                            textAlign: isRTL ? 'left' : 'right'
                          }}>
                            {t('count')}: ({stat.count})
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Total Behavior Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: '#f97316',
                    borderRadius: '0.375rem',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'white',
                      flex: 1
                    }}>
                      {t('behavior')}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: 'center'
                    }}>
                      {t('total')}: {student.behavior > 0 ? '+' : ''}{student.behavior || 0}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: isRTL ? 'left' : 'right'
                    }}>
                      {t('count')}: ({(() => {
                        const stats = getDetailedStats();
                        return BEHAVIOR_TYPES.reduce((sum, type) => sum + (stats.behavior[type.id]?.count || 0), 0);
                      })()})
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Penalty Section */}
            <div style={{ marginBottom: '0.0rem' }}>
              <div
                onClick={() => toggleSectionExpansion('penalty')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#dc2626',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  marginBottom: '0.2rem'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                  {t('penalty_details')} ({student.penalty || 0} {t('points')}, {(() => {
                    const stats = getDetailedStats();
                    return PENALTY_TYPES.reduce((sum, type) => sum + (stats.penalty[type.id]?.count || 0), 0);
                  })()} {t('entries')})
                </span>
                <ChevronDown
                  style={{
                    width: '16px',
                    height: '16px',
                    transform: expandedSections.penalty ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>

              {expandedSections.penalty && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  {(() => {
                    const stats = getDetailedStats();

                    return PENALTY_TYPES.map(type => {
                      const stat = stats.penalty[type.id];
                      return (
                        <div key={type.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: '#fee2e2',
                          borderRadius: '0.375rem',
                          border: '1px solid #dc2626',
                          opacity: stat.count > 0 ? 1 : 0.8
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#dc2626',
                            flex: 1
                          }}>
                            {lang === 'ar' ? (type.label_ar || type.label_en) : type.label_en}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#991b1b',
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            Total: {stat.totalPoints}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#dc2626',
                            minWidth: '3rem',
                            textAlign: 'right'
                          }}>
                            Count: ({stat.count})
                          </div>
                          {stat.count > 0 && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Delete all ${type.label_en} entries for ${student?.name || 'this student'}?`)) {
                                  try {
                                    // Get all penalty logs for this type
                                    const penaltyLogs = todayLogs.filter(log => 
                                      log.type === 'penalty' && log.data?.penaltyType === type.id
                                    );
                                    
                                    // Delete each penalty
                                    for (const log of penaltyLogs) {
                                      await deletePenalty(log.id);
                                    }
                                    
                                    // Refresh data
                                    eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
                                    eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
                                  } catch (error) {
                                    logger.error('Failed to delete penalty entries:', error);
                                    alert('Failed to delete penalty entries');
                                  }
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                color: '#dc2626',
                                marginLeft: '0.5rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#dc2626';
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'none';
                                e.target.style.color = '#dc2626';
                              }}
                              title={`Delete all ${type.label_en} entries`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}

                  {/* Total Penalty Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: '#dc2626',
                    borderRadius: '0.375rem',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'white',
                      flex: 1
                    }}>
                      {t('penalty')}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: 'center'
                    }}>
                      {t('total')}: {student.penalty || 0}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'white',
                      minWidth: '3rem',
                      textAlign: isRTL ? 'left' : 'right'
                    }}>
                      {t('count')}: ({(() => {
                        const stats = getDetailedStats();
                        return PENALTY_TYPES.reduce((sum, type) => sum + (stats.penalty[type.id]?.count || 0), 0);
                      })()})
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>

        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          <div>
            {/* History Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background: 'var(--panel-hover, #f8fafc)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light, #e2e8f0)'
            }}>
              <div style={{
                display: 'flex',
                gap: '0.25rem'
              }}>
                <button
                  onClick={() => toggleFilter('attendance')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.1rem',
                    padding: '0.1rem 0.2rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    background: activeFilters.attendance ? '#065f46' : 'var(--panel, #ffffff)',
                    color: activeFilters.attendance ? 'white' : 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    boxShadow: activeFilters.attendance ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  {t('attendance')}
                </button>
                <button
                  onClick={() => toggleFilter('participation')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.1rem',
                    padding: '0.1rem 0.2rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    background: activeFilters.participation ? '#3b82f6' : 'var(--panel, #ffffff)',
                    color: activeFilters.participation ? 'white' : 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    boxShadow: activeFilters.participation ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  {t('participation')}
                </button>
                <button
                  onClick={() => toggleFilter('behavior')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.1rem',
                    padding: '0.1rem 0.2rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    background: activeFilters.behavior ? '#f97316' : 'var(--panel, #ffffff)',
                    color: activeFilters.behavior ? 'white' : 'var(--text-muted, #64748b)',
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
                    gap: '0.1rem',
                    padding: '0.1rem 0.2rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0',
                    background: activeFilters.penalties ? '#dc2626' : '#ffffff',
                    color: activeFilters.penalties ? 'white' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: activeFilters.penalties ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {t('penalties')}
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem'
            }}>
              {logsLoading ? (
                <div style={{
                  padding: '1rem',
                  color: 'var(--text-muted, #9ca3af)',
                  fontSize: '0.875rem',
                  textAlign: 'center'
                }}>
                  {t('loading')}...
                </div>
              ) : historicalLogs.length === 0 ? (
                <div style={{
                  padding: '1rem',
                  color: 'var(--text-muted, #9ca3af)',
                  fontSize: '0.875rem'
                }}>
                  {t('no_history_found')}
                </div>
              ) : (
                <StudentHistory 
                  groupedLogs={memoizedGroupedLogs}
                  expandedDays={expandedDays}
                  activeFilters={activeFilters}
                  toggleDayExpansion={toggleDayExpansion}
                  handleDeleteAttendance={(studentId, logId) => handleDeleteAttendance(logId)}
                  handleDeletePenalty={(studentId, logId) => handleDeletePenalty(logId)}
                  t={t}
                  isRTL={isRTL}
                  studentId={student?.id}
                />
              )}
            </div>
          </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ maxWidth: '400px', margin: '1rem' }}>
            <CardBody>
              <h3>{t('delete_activity_title', { type: deleteType === 'attendance' ? t('attendance') : t('penalty') })}</h3>
              <p>{t('delete_activity_msg', { studentName: student.displayName || student.name || t('this_student') })}</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button variant="primary" onClick={handleConfirmDelete} loading={deleteLoading} style={{ backgroundColor: '#dc2626' }}>
                  {t('delete') || 'Delete'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
