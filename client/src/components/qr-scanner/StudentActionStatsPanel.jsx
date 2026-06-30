import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { getThemedIcon, getIconWithColor } from '@constants/iconTypes';
import { Button } from '@ui';
import { Card, CardBody } from '@ui';
import { getAttendanceByStudent, deleteAttendance } from '@services/business/attendanceService';
import { getPenaltiesByStudent, deletePenalty } from '@services/business/penaltyService';
import { getParticipationsByStudent, deleteParticipation } from '@services/business/participationService';
import { getBehaviorsByStudent, deleteBehavior } from '@services/business/behaviorService';
import { getFunctions } from '@services/other/config';
import eventBus, { EVENTS } from '@utils/eventBus';
import { SimpleLoading } from '@ui';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { useQRPermissions } from '@hooks/useQRPermissions';
import { useMobileDetect } from '@hooks/useMobileDetect';
// OLD: import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
// OLD: import { PARTICIPATION_TYPES } from '@constants/participationTypes';
// OLD: import { PENALTY_TYPES } from '@constants/penaltyTypes';
// NOW: Using useLookupTypes hook for all lookup data
import { RECORD_TYPES, getRecordTypeLabel } from '@utils/sharedTypes';
import {ParticipationIcon, PenaltyIcon, StudentHistory, DeleteModal} from '@ui/history';
import {CircleIcon, CheckSmallIcon, ClockSmallIcon, XSmallIcon, HeartIcon, HelpCircleIcon, UserIcon, ZapIcon} from "@utils/icons.jsx";
import PanelHeader from './PanelHeader';
import { getAttendanceMethodLabel, shouldShowMethodLabel } from '@constants/attendanceMethods';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_COLORS, ATTENDANCE_TYPE_CATEGORY, getAttendanceIcon, getAttendanceColor, getAttendanceLabel, getLocalizedAttendanceLabel, DB_CODE_TO_FRONTEND_STATUS, getStatusCodeFromRecord } from '@constants/attendanceTypes';
import { MANUAL_NOTE_TYPES, getNoteTypeFromStatus, getLocalizedNoteText } from '@constants/noteTypes';
import PortalTooltip from '@ui/PortalTooltip';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useToast } from '@ui';

export default function StudentActionStatsPanel({
  student,
  onClose,
  onBehaviorSubmit,
  onMarkAttendance,
  behaviorTypes = [],
  participationTypes = [],
  showFavoritesOnly = false,
  onToggleFavorites,
  favoriteBehaviors = [],
  onToggleFavorite,
  sendNotifications = false,
  onToggleNotifications,
  attendanceMode = 'regular',
  programId = null,
  subjectId = null
}) {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const { canDeleteAttendance, canEditAttendance } = useQRPermissions();
  const { data: lookupData, loading: lookupLoading, error: lookupError } = useLookupTypes({
    types: ['behavior-types', 'participation-types', 'penalty-types']
  });
  
  // DEBUG: Log attendanceMode
  console.log('🔍 StudentActionStatsPanel - attendanceMode:', attendanceMode);
  console.log('🔍 StudentActionStatsPanel - ATTENDANCE_TYPE_CATEGORY.STANDUP:', ATTENDANCE_TYPE_CATEGORY.STANDUP);
  console.log('🔍 StudentActionStatsPanel - isStandupMode:', attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP);
  
  // 🔍 DEBUG: Log incoming student data structure
  console.log('🔍 StudentActionStatsPanel - Incoming Student Data:', {
    student: student,
    keys: student ? Object.keys(student) : 'no student',
    hasAttendance: !!student?.attendance,
    hasParticipation: !!student?.participation,
    hasBehavior: !!student?.behavior,
    hasPenalty: !!student?.penalty,
    attendanceValue: student?.attendance,
    participationValue: student?.participation,
    behaviorValue: student?.behavior,
    penaltyValue: student?.penalty,
    hasBehaviorHistory: !!student?.behaviorHistory,
    hasParticipationHistory: !!student?.participationHistory,
    hasPenaltyHistory: !!student?.penaltyHistory,
    behaviorHistoryLength: student?.behaviorHistory?.length || 0,
    participationHistoryLength: student?.participationHistory?.length || 0,
    penaltyHistoryLength: student?.penaltyHistory?.length || 0
  });
  
  const [selectedActions, setSelectedActions] = useState([]);
  const { isMobile } = useMobileDetect();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [deleteLogId, setDeleteLogId] = useState('');
  const [bulkDeleteType, setBulkDeleteType] = useState(null); // For bulk delete operations
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState(() => {
    // Initialize from student prop to prevent initial flash of "None"
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      return student?.standupStatus || null;
    } else {
      // Regular attendance mode - use attendance field and normalize to uppercase
      return student?.attendance ? student.attendance.toUpperCase() : null;
    }
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionPoints, setActionPoints] = useState({});
  const [internalNote, setInternalNote] = useState('');
  const [activeTab, setActiveTab] = useState(RECORD_TYPES.BEHAVIOR);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [todayLogs, setTodayLogs] = useState([]);
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(!!student?.id);
  const [logsError, setLogsError] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [sendingQRCode, setSendingQRCode] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [showExpandAllButton, setShowExpandAllButton] = useState(false);
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

  // Initialize current attendance status from student data
  useEffect(() => {
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      setCurrentAttendanceStatus(student?.standupStatus || null);
    } else {
      // Regular attendance mode - use attendance field and normalize to uppercase
      setCurrentAttendanceStatus(student?.attendance ? student.attendance.toUpperCase() : null);
    }
  }, [student?.attendance, student?.standupStatus, attendanceMode]);

  // Send QR code email
  const sendQRCodeEmail = async () => {
    if (!student?.id || !student?.email) {
      error('Student information missing');
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
        debug('QR code email sent successfully');
      } else {
        error('Failed to send QR code email:', result.message);
      }
    } catch (err) {
      error('Error sending QR code email:', err);
    } finally {
      setSendingQRCode(false);
    }
  };

  // Send student summary email
  const sendStudentSummaryEmail = async () => {
    if (!student?.id || !student?.email) {
      error('Student information missing');
      return;
    }

    setSendingSummary(true);
    try {
      // Calculate statistics from the logs we already have
      const allLogs = [...historicalLogs, ...todayLogs];
      const attendanceStats = {
        present: allLogs.filter(log => log.type === RECORD_TYPES.ATTENDANCE && log.status === ATTENDANCE_STATUS.PRESENT).length,
        late: allLogs.filter(log => log.type === RECORD_TYPES.ATTENDANCE && log.status === ATTENDANCE_STATUS.LATE).length,
        absent: allLogs.filter(log => log.type === RECORD_TYPES.ATTENDANCE && log.status === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE).length,
        percentage: 0 // Will be calculated
      };

      const totalAttendance = attendanceStats.present + attendanceStats.late + attendanceStats.absent;
      if (totalAttendance > 0) {
        attendanceStats.percentage = Math.round((attendanceStats.present / totalAttendance) * 100);
      }

      const participationStats = {
        total: student.participation || 0,
        positive: allLogs.filter(log => log.type === RECORD_TYPES.PARTICIPATION && log.points > 0).reduce((sum, log) => sum + log.points, 0),
        neutral: allLogs.filter(log => log.type === RECORD_TYPES.PARTICIPATION && log.points === 0).length
      };

      const behaviorStats = {
        total: student.behavior || 0,
        positive: allLogs.filter(log => log.type === RECORD_TYPES.BEHAVIOR && log.points > 0).reduce((sum, log) => sum + log.points, 0),
        negative: Math.abs(allLogs.filter(log => log.type === RECORD_TYPES.BEHAVIOR && log.points < 0).reduce((sum, log) => sum + log.points, 0))
      };

      const penaltyStats = {
        total: allLogs.filter(log => log.type === RECORD_TYPES.PENALTY).length,
        minor: allLogs.filter(log => log.type === RECORD_TYPES.PENALTY && log.severity === 'minor').length,
        major: allLogs.filter(log => log.type === RECORD_TYPES.PENALTY && log.severity === 'major').length,
        recentPenalties: allLogs.filter(log => log.type === RECORD_TYPES.PENALTY).slice(0, 3).map(log =>
            `${log.label} (${new Date(log.time).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })})`
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
          currentDate: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        }
      });

      if (result.success) {
        debug('Student summary email sent successfully');
      } else {
        error('Failed to send student summary email:', result.message);
      }
    } catch (err) {
      error('Error sending student summary email:', err);
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

  const expandAllDays = useCallback(() => {
    const allDates = [...new Set(historicalLogs.map(log => log.date))];
    setExpandedDays(new Set(allDates));
  }, [historicalLogs]);

  const collapseAllDays = useCallback(() => {
    setExpandedDays(new Set());
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

    // Calculate behavior stats using lookup data
    const behaviorTypes = lookupData['behavior-types'] || [];
    behaviorTypes.forEach(type => {
      stats.behavior[type.id] = {
        count: 0,
        totalPoints: 0,
        label: lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn,
        color: type.color,
        icon: type.icon
      };
    });

    // Calculate participation stats using lookup data
    const participationTypes = lookupData['participation-types'] || [];
    participationTypes.forEach(type => {
      stats.participation[type.id] = {
        count: 0,
        totalPoints: 0,
        label: lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn,
        color: '#3b82f6',
        icon: type.icon
      };
    });

    // Calculate penalty stats using lookup data
    const penaltyTypes = lookupData['penalty-types'] || [];
    penaltyTypes.forEach(type => {
      stats.penalty[type.id] = {
        count: 0,
        totalPoints: 0,
        label: lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn,
        color: type.color,
        icon: type.icon
      };
    });

    // Process logs to calculate stats
    todayLogs.forEach((log) => {
      if (log.type === RECORD_TYPES.BEHAVIOR) {
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
      } else if (log.type === RECORD_TYPES.PARTICIPATION) {
        const participationType = log.data.type || 'other';

        if (stats.participation[participationType]) {
          stats.participation[participationType].count++;
          stats.participation[participationType].totalPoints += log.points || 0;
        }
      } else if (log.type === RECORD_TYPES.PENALTY) {
        const penaltyType = log.data.type || 'other';

        if (stats.penalty[penaltyType]) {
          stats.penalty[penaltyType].count++;
          stats.penalty[penaltyType].totalPoints += log.points || 0;
        }
      }
    });

    return stats;
  }, [todayLogs, lookupData, lang]);

  // Fetch historical logs for student - defined before usage
  const fetchHistoricalLogs = useCallback(async () => {
    console.log('🔍 StudentActionStatsPanel - fetchHistoricalLogs called:', {
      studentId: student?.id,
      studentName: student?.displayName || student?.name
    });
    
    if (!student?.id) {
      console.log('🔍 StudentActionStatsPanel - No student ID, returning');
      return;
    }

    console.log('🔍 StudentActionStatsPanel - Setting logsLoading to TRUE in fetchHistoricalLogs');
    setLogsLoading(true);
    try {
      // Small delay to ensure Firestore has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get all attendance records for this student (no date filter)
      const attendanceResponse = await getAttendanceByStudent(student.id);
      const attendanceRecords = (attendanceResponse.success ? attendanceResponse.data : []).map(r => ({
        ...r,
        status: getStatusCodeFromRecord(r),
        studentId: r.studentId ?? r.userId
      }));

      // Get penalties for this student
      const penaltiesResponse = await getPenaltiesByStudent(student.id);
      const studentPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];

      // Get behavior records for this student
      const behaviorResponse = await getBehaviorsByStudent(student.id);
      const studentBehaviors = behaviorResponse.success ? behaviorResponse.data : [];

      // Get participation records for this student
      const participationResponse = await getParticipationsByStudent(student.id);
      const studentParticipations = participationResponse.success ? participationResponse.data : [];

      // Combine and format logs with date information
      const logs = [
        ...attendanceRecords.map(record => ({
          id: record.id,
          type: record.category || (record.delta ? (record.delta > 0 ? RECORD_TYPES.PARTICIPATION : RECORD_TYPES.BEHAVIOR) : RECORD_TYPES.ATTENDANCE),
          date: record.date || new Date(record.timestamp).toISOString().split('T')[0],
          time: record.updatedAt || record.createdAt || record.timestamp || null,
          status: record.status,
          method: record.method, // ← Include method field for attendance method display
          label: record.category === RECORD_TYPES.PARTICIPATION
              ? getRecordTypeLabel(RECORD_TYPES.PARTICIPATION, lang)
              : (record.category === RECORD_TYPES.BEHAVIOR
                  ? getRecordTypeLabel(RECORD_TYPES.BEHAVIOR, lang)
                  : (getLocalizedAttendanceLabel(record.status, lang) || record.status || t('unknown') || 'Unknown')),
          points: record.delta || 0,
          comment: (() => {
            const noteContent = record.reason || record.notes || '';
            // Check if it's a note constant (uppercase with underscores)
            if (/^[A-Z_]+$/.test(noteContent)) {
              return getLocalizedNoteText(noteContent, t) || noteContent;
            }
            return noteContent;
          })(),
          severity: 'low',
          color: record.category === RECORD_TYPES.PARTICIPATION
              ? '#3b82f6'
              : (record.category === RECORD_TYPES.BEHAVIOR
                  ? '#f97316'
                  : (getAttendanceColor(record.status) || '#6b7280'))
        })),
        ...studentBehaviors.map(behavior => ({
          id: behavior.id,
          type: RECORD_TYPES.BEHAVIOR,
          date: behavior.date || new Date(behavior.createdAt).toISOString().split('T')[0],
          time: behavior.createdAt,
          data: behavior,
          label: behavior.type ? (() => { const bt = (lookupData['behavior-types'] || []).find(b => b.id === behavior.type); return bt ? (lang === 'ar' ? (bt.nameAr || bt.nameEn) : bt.nameEn) : behavior.type; })() : getRecordTypeLabel(RECORD_TYPES.BEHAVIOR, lang),
          points: behavior.points || 0,
          comment: behavior.comment || behavior.description || behavior.reason || '',
          severity: behavior.severity || 'medium',
          color: '#f97316'
        })),
        ...studentParticipations.map(participation => ({
          id: participation.id,
          type: RECORD_TYPES.PARTICIPATION,
          date: participation.date || new Date(participation.createdAt).toISOString().split('T')[0],
          time: participation.createdAt,
          data: participation,
          label: participation.type ? (() => { const pt = (lookupData['participation-types'] || []).find(p => p.id === participation.type); return pt ? (lang === 'ar' ? (pt.nameAr || pt.nameEn) : pt.nameEn) : participation.type; })() : getRecordTypeLabel(RECORD_TYPES.PARTICIPATION, lang),
          points: participation.points || 0,
          comment: participation.comment || participation.description || participation.reason || '',
          severity: 'low',
          color: '#3b82f6'
        })),
        ...studentPenalties.map(penalty => {
          // Try multiple possible fields for the penalty type
          const penaltyTypeId = penalty.type || penalty.penaltyType || penalty.category;
          const penaltyType = penaltyTypeId ? (lookupData['penalty-types'] || []).find(pt => pt.id === penaltyTypeId) : null;

          const mappedPenalty = {
            id: penalty.id,
            type: RECORD_TYPES.PENALTY,
            date: penalty.date || new Date(penalty.createdAt).toISOString().split('T')[0],
            time: penalty.createdAt,
            data: penalty,
            label: penaltyType
                ? (lang === 'ar' ? (penaltyType.nameAr || penaltyType.nameEn) : penaltyType.nameEn)
                : (penalty.reason || penalty.description || penaltyTypeId || getRecordTypeLabel(RECORD_TYPES.PENALTY, lang)),
            points: penalty.points !== undefined ? -Math.abs(penalty.points) : (penaltyType ? -Math.abs(penaltyType.points) : -1), // Always negative for penalties
            comment: penalty.comment || penalty.description || penalty.reason || '',
            severity: penalty.severity || 'medium',
            color: penalty.points > 0 ? '#dcfce7' : '#fee2e2'
          };
          return mappedPenalty;
        })
      ].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Most recent first
      });

      debug('StudentActionStatsPanel - total logs fetched:', logs.length);
      debug('StudentActionStatsPanel - logs:', logs);

      // Helper function to check if a date matches today (handles both ISO and human-readable formats)
      const isToday = (dateString) => {
        try {
          const today = new Date();
          const logDate = new Date(dateString);
          
          // Check if both dates represent the same day
          return today.toDateString() === logDate.toDateString();
        } catch (err) {
          warn('StudentActionStatsPanel - Error parsing date:', dateString, err);
          return false;
        }
      };
      
      // Filter today's logs (handles both ISO and human-readable formats)
      const todayLogsFiltered = logs.filter(log => isToday(log.date));

      debug('StudentActionStatsPanel - today logs filtered:', todayLogsFiltered.length);
      debug('StudentActionStatsPanel - historical logs to set:', logs.length);

      console.log('🔍 StudentActionStatsPanel - Fetch results:', {
        totalLogs: logs.length,
        todayLogs: todayLogsFiltered.length,
        attendanceRecords: attendanceRecords.length,
        studentPenalties: studentPenalties.length,
        studentBehaviors: studentBehaviors.length,
        studentParticipations: studentParticipations.length
      });

      // Set historicalLogs to ALL logs (including today)
      setHistoricalLogs(logs);
      // Set todayLogs to only today's logs
      setTodayLogs(todayLogsFiltered);

      // Don't auto-expand - let user choose what to expand
      setExpandedDays(new Set());

      setLogsError('');
      console.log('🔍 StudentActionStatsPanel - Setting logsLoading to FALSE (success)');
    } catch (err) {
      error('Error fetching historical logs:', err);
      setLogsError('Failed to load history');
      setHistoricalLogs([]);
      setTodayLogs([]);
      console.log('🔍 StudentActionStatsPanel - Setting logsLoading to FALSE (error)');
    } finally {
      setLogsLoading(false);
      console.log('🔍 StudentActionStatsPanel - fetchHistoricalLogs completed, logsLoading set to FALSE');
    }
  }, [student?.id, lookupData, lang]);

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

  // Reset loading state when student changes
  useEffect(() => {
    console.log('🔍 StudentActionStatsPanel - Student changed:', {
      studentId: student?.id,
      studentName: student?.displayName || student?.name,
      logsLoading: logsLoading
    });

    if (student?.id) {
      setLogsLoading(true);
      console.log('🔍 StudentActionStatsPanel - Set logsLoading to TRUE');
    } else {
      setLogsLoading(false);
      console.log('🔍 StudentActionStatsPanel - Set logsLoading to FALSE');
    }
  }, [student?.id]);

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

    // Add refresh event listeners
    const unsubscribeRefreshStudent = eventBus.on(EVENTS.REFRESH_STUDENT_DATA, (data) => {
      if (data?.studentId === student.id || !data?.studentId) fetchHistoricalLogs();
    });

    const unsubscribeRefreshRecent = eventBus.on(EVENTS.REFRESH_RECENT_ACTIVITY, () => {
      fetchHistoricalLogs();
    });

    const unsubscribeRefreshToday = eventBus.on(EVENTS.REFRESH_TODAY_ACTIVITY, () => {
      fetchHistoricalLogs();
    });

    return () => {
      unsubscribeAttendance();
      unsubscribeBehavior();
      unsubscribeParticipation();
      unsubscribePenalty();
      unsubscribeRefreshStudent();
      unsubscribeRefreshRecent();
      unsubscribeRefreshToday();
    };
  }, [student?.id, fetchHistoricalLogs]);

  // Fetch real data from Firebase - memoized
  const handleMarkAttendance = useCallback(async (studentId, status) => {
    // Check if attendance already exists and user doesn't have edit permission
    if (currentAttendanceStatus && !canEditAttendance) {
      showError('You do not have permission to edit existing attendance');
      return;
    }

    setShowLoadingOverlay(true);
    try {
      const result = await onMarkAttendance(studentId, status, programId, subjectId);
      if (result && !result.success) {
        showError(result.error || 'Failed to mark attendance');
        return;
      }
      // Update the current attendance status immediately for UI feedback
      setCurrentAttendanceStatus(status);
      // Force refresh the history by incrementing the key
      setHistoryRefreshKey(prev => prev + 1);
      // Refresh data after marking attendance
      await fetchHistoricalLogs();
    } catch (err) {
      error('Error marking attendance:', err);
      showError(err.message || 'Failed to mark attendance');
    } finally {
      setShowLoadingOverlay(false);
    }
  }, [onMarkAttendance, fetchHistoricalLogs, programId, subjectId, currentAttendanceStatus, canEditAttendance, showError]);

  // Delete attendance log
  const handleDeleteAttendance = useCallback((logId) => {
    setDeleteType(RECORD_TYPES.ATTENDANCE);
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  }, []);

  // Delete participation log
  const handleDeleteParticipation = useCallback((studentId, logId) => {
    setDeleteType(RECORD_TYPES.PARTICIPATION);
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  }, []);

  // Delete penalty log
  const handleDeletePenalty = useCallback((logId) => {
    setDeleteType(RECORD_TYPES.PENALTY);
    setDeleteLogId(logId);
    setDeleteModalOpen(true);
  }, []);

  // Handle actual deletion after confirmation - memoized
  const handleConfirmDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      let result;

      // Handle bulk delete operations
      if (bulkDeleteType) {
        if (bulkDeleteType.type === RECORD_TYPES.PENALTY) {
          // Get all penalty logs for this type
          const penaltyLogs = todayLogs.filter(log =>
              log.type === RECORD_TYPES.PENALTY && log.data?.type === bulkDeleteType.typeId
          );

          // Delete each penalty
          for (const log of penaltyLogs) {
            await deletePenalty(log.id);
          }

          // Refresh data
          eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
          eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
          eventBus.emit(EVENTS.REFRESH_ROSTER);
          eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);

          // Show success feedback
          showSuccess(`Successfully deleted ${penaltyLogs.length} penalty records`);

          // Close panel
          onClose();
        } else if (bulkDeleteType.type === RECORD_TYPES.PARTICIPATION) {
          // Get all participation logs for this type
          const participationLogs = todayLogs.filter(log =>
              log.type === RECORD_TYPES.PARTICIPATION && log.data?.type === bulkDeleteType.typeId
          );

          // Delete each participation
          for (const log of participationLogs) {
            await deleteParticipation(log.id);
          }

          // Refresh data
          eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
          eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
          eventBus.emit(EVENTS.REFRESH_ROSTER);
          eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);

          // Show success feedback
          showSuccess(`Successfully deleted ${participationLogs.length} participation records`);

          // Close panel
          onClose();
        } else if (bulkDeleteType.type === RECORD_TYPES.BEHAVIOR) {
          // Get all behavior logs for this type
          const behaviorLogs = todayLogs.filter(log =>
              log.type === RECORD_TYPES.BEHAVIOR && log.data?.type === bulkDeleteType.typeId
          );

          // Delete each behavior
          for (const log of behaviorLogs) {
            await deleteBehavior(log.id);
          }

          // Refresh data
          eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
          eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
          eventBus.emit(EVENTS.REFRESH_ROSTER);
          eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);

          // Show success feedback
          showSuccess(`Successfully deleted ${behaviorLogs.length} behavior records`);

          // Close panel
          onClose();
        }

        // Reset bulk delete
        setBulkDeleteType(null);
      } else {
        // Handle single item delete (existing logic)
        if (deleteType === RECORD_TYPES.ATTENDANCE) {
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

            // Refresh roster and activity
            eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
            eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
            eventBus.emit(EVENTS.REFRESH_ROSTER);
            eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);

            // Show success feedback
            showSuccess('Attendance record deleted successfully');
          } else {
            console.error('Failed to delete attendance record:', result.error);
            showError('Failed to delete attendance record: ' + result.error);
          }
        } else if (deleteType === RECORD_TYPES.PARTICIPATION) {
          result = await deleteParticipation(deleteLogId);
          if (result.success) {
            // Refresh the history
            setHistoryRefreshKey(prev => prev + 1);
            await fetchHistoricalLogs();

            // Emit event for real-time updates
            eventBus.emit(EVENTS.PARTICIPATION_ADDED, {
              studentId: student.id,
              classId: student.classId,
              status: 'deleted',
              performedBy: user,
              timestamp: new Date()
            });

            // Refresh roster and activity
            eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
            eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
            eventBus.emit(EVENTS.REFRESH_ROSTER);
            eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);

            // Show success feedback
            showSuccess('Participation record deleted successfully');
          } else {
            error('Failed to delete participation record:', result.error);
            showError('Failed to delete participation record: ' + result.error);
          }
        } else if (deleteType === RECORD_TYPES.PENALTY) {
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

            // Refresh roster and activity
            eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
            eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
            eventBus.emit(EVENTS.REFRESH_ROSTER);
            eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);

            // Show success feedback
            showSuccess('Penalty record deleted successfully');
          } else {
            error('Failed to delete penalty record:', result.error);
            showError('Failed to delete penalty record: ' + result.error);
          }
        } else if (deleteType === RECORD_TYPES.BEHAVIOR) {
          result = await deleteBehavior(deleteLogId);
          if (result.success) {
            // Refresh the history
            setHistoryRefreshKey(prev => prev + 1);
            await fetchHistoricalLogs();

            // Emit event for real-time updates
            eventBus.emit(EVENTS.BEHAVIOR_LOGGED, {
              studentId: student.id,
              classId: student.classId,
              status: 'deleted',
              performedBy: user,
              timestamp: new Date()
            });

            // Refresh roster and activity
            eventBus.emit(EVENTS.REFRESH_RECENT_ACTIVITY);
            eventBus.emit(EVENTS.REFRESH_STUDENT_DATA);
            eventBus.emit(EVENTS.REFRESH_ROSTER);
            eventBus.emit(EVENTS.REFRESH_TODAY_ACTIVITY);

            // Show success feedback
            showSuccess('Behavior record deleted successfully');
          } else {
            error('Failed to delete behavior record:', result.error);
            showError('Failed to delete behavior record: ' + result.error);
          }
        }
      }
    } catch (err) {
      error(`Error deleting ${deleteType} record:`, err);
      showError(`Error deleting ${deleteType} record: ` + err.message);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setDeleteType('');
      setDeleteLogId('');
    }
  }, [deleteType, deleteLogId, student, user, fetchHistoricalLogs, bulkDeleteType, todayLogs, onClose, showSuccess, showError]);

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

    // Sort logs within each day by time (newest first)
    Object.keys(grouped).forEach(date => {
      const sortLogs = (logs) => {
        return logs.sort((a, b) => {
          const timeA = new Date(a.time);
          const timeB = new Date(b.time);
          return timeB - timeA; // Newest first
        });
      };

      grouped[date].attendance = sortLogs(grouped[date].attendance);
      grouped[date].penalties = sortLogs(grouped[date].penalties);
      grouped[date].participation = sortLogs(grouped[date].participation);
      grouped[date].behavior = sortLogs(grouped[date].behavior);
    });

    // Sort days by date (newest first)
    const sortedGrouped = Object.values(grouped).sort((a, b) => {
      // Sort days by date (newest first)
      const result = new Date(b.date) - new Date(a.date);
      return result;
    });

    debug('StudentActionStatsPanel final grouped logs:', sortedGrouped.map(g => ({ date: g.date, counts: { attendance: g.attendance.length, penalties: g.penalties.length, participation: g.participation.length, behavior: g.behavior.length } })));

    return sortedGrouped;
  }, []);

  // Memoized grouped logs for display
  const memoizedGroupedLogs = useMemo(() => {
    const grouped = groupLogsByDay(historicalLogs);
    debug('StudentActionStatsPanel - memoizedGroupedLogs:', grouped);
    debug('StudentActionStatsPanel - historicalLogs length:', historicalLogs.length);
    debug('StudentActionStatsPanel - activeFilters:', activeFilters);

    // Debug today's logs specifically
    const today = new Date().toISOString().split('T')[0];
    const todayGroup = grouped.find(g => g.date === today);

    return grouped;
  }, [historicalLogs, groupLogsByDay, activeFilters]);

  if (!student) return null;

  // Memoized available options for performance
  const options = useMemo(() => {
    if (activeTab === RECORD_TYPES.PARTICIPATION) {
      return participationTypes.map(pt => ({
        ...pt,
        category: RECORD_TYPES.PARTICIPATION
      }));
    } else if (activeTab === RECORD_TYPES.BEHAVIOR) {
      return behaviorTypes.filter(bt => bt.points !== 0).map(bt => ({
        ...bt,
        category: RECORD_TYPES.BEHAVIOR
      }));
    } else if (activeTab === RECORD_TYPES.PENALTY) {
      return behaviorTypes.filter(bt => bt.points < 0).map(bt => ({
        ...bt,
        category: RECORD_TYPES.PENALTY
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
  
  // Check if there are actual attendance records for today (not participation/behavior/penalty)
  const hasTodayAttendance = useMemo(() => 
    todayLogs.some(log =>
        log.type === RECORD_TYPES.ATTENDANCE &&
        log.status &&
        [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, ATTENDANCE_STATUS.LATE, ATTENDANCE_STATUS.EXCUSED_LEAVE, ATTENDANCE_STATUS.HUMAN_CASE].includes(log.status)
    ), [todayLogs]);
  
  const attendanceStatus = useMemo(() => {
    // First check currentAttendanceStatus (from student prop) - this is the most up-to-date
    if (currentAttendanceStatus) {
      const statusLabel = getLocalizedAttendanceLabel(currentAttendanceStatus, lang);
      const statusColor = getAttendanceColor(currentAttendanceStatus);
      if (statusLabel && statusColor) {
        return {
          en: statusLabel,
          ar: getLocalizedAttendanceLabel(currentAttendanceStatus, 'ar'),
          color: statusColor
        };
      }
    }

    // If no currentAttendanceStatus, check todayLogs for attendance records
    if (!hasTodayAttendance) {
      return {
        en: t('none') || 'None',
        ar: t('none') || 'لا شيء',
        color: '#9ca3af'
      };
    }

    // If there are attendance records but no currentAttendanceStatus, use the latest from todayLogs
    // This shouldn't normally happen since todayLogs should set currentAttendanceStatus
    return {
      en: t('none') || 'None',
      ar: t('none') || 'لا شيء',
      color: '#9ca3af'
    };
  }, [hasTodayAttendance, todayLogs, currentAttendanceStatus, t, lang]);

  // Helper variable to check if attendance status is None (no attendance recorded)
  // Consider both todayLogs and currentAttendanceStatus from student prop
  const isAttendanceNone = !hasTodayAttendance && !currentAttendanceStatus;
  
  // Debug logs to track attendance state
  debug('StudentActionStatsPanel - Attendance State Debug:', {
    studentId: student.id,
    studentNumber: student.studentNumber,
    hasTodayAttendance,
    currentAttendanceStatus,
    studentAttendanceValue: student.attendanceValue,
    studentAttendance: student.attendance,
    todayLogsCount: todayLogs.length,
    attendanceLogs: todayLogs.filter(log => log.type === RECORD_TYPES.ATTENDANCE).map(log => ({
      status: log.status,
      timestamp: log.timestamp
    }))
  });

  // Memoized attendance statistics calculation (TODAY ONLY)
  const attendanceStats = useMemo(() => {
    // Start with todayLogs calculation
    const stats = todayLogs.reduce((acc, log) => {
      if (log.type === RECORD_TYPES.ATTENDANCE) {
        const status = log.status;
        if (status === ATTENDANCE_STATUS.PRESENT) acc.present++;
        else if (status === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) acc.absent_no_excuse++;
        else if (status === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) acc.absent_with_excuse++;
        else if (status === ATTENDANCE_STATUS.LATE) acc.late++;
        else if (status === ATTENDANCE_STATUS.EXCUSED_LEAVE) acc.excused_leave++;
        else if (status === ATTENDANCE_STATUS.HUMAN_CASE) acc.human_case++;
      }
      return acc;
    }, { present: 0, late: 0, absent_no_excuse: 0, absent_with_excuse: 0, excused_leave: 0, human_case: 0 });

    // If there's a current attendance status that's different from todayLogs,
    // increment the appropriate counter (for immediate UI feedback during selection)
    if (currentAttendanceStatus) {
      // Check if this status is already counted in todayLogs
      const isInTodayLogs = todayLogs.some(log =>
          log.type === RECORD_TYPES.ATTENDANCE && log.status === currentAttendanceStatus
      );

      // Only add to stats if it's not already in todayLogs
      if (!isInTodayLogs) {
        if (currentAttendanceStatus === ATTENDANCE_STATUS.PRESENT) stats.present++;
        else if (currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) stats.absent_no_excuse++;
        else if (currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) stats.absent_with_excuse++;
        else if (currentAttendanceStatus === ATTENDANCE_STATUS.LATE) stats.late++;
        else if (currentAttendanceStatus === ATTENDANCE_STATUS.EXCUSED_LEAVE) stats.excused_leave++;
        else if (currentAttendanceStatus === ATTENDANCE_STATUS.HUMAN_CASE) stats.human_case++;
      }
    }

    return stats;
  }, [todayLogs, currentAttendanceStatus]);

  // Memoized TOTAL attendance statistics calculation (ALL TIME)
  const totalAttendanceStats = useMemo(() => {
    return historicalLogs.reduce((acc, log) => {
      if (log.type === RECORD_TYPES.ATTENDANCE) {
        const status = log.status;
        if (status === ATTENDANCE_STATUS.PRESENT) acc.present++;
        else if (status === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) acc.absent_no_excuse++;
        else if (status === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) acc.absent_with_excuse++;
        else if (status === ATTENDANCE_STATUS.LATE) acc.late++;
        else if (status === ATTENDANCE_STATUS.EXCUSED_LEAVE) acc.excused_leave++;
        else if (status === ATTENDANCE_STATUS.HUMAN_CASE) acc.human_case++;
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
              <SimpleLoading loading fullscreen type="brand" size="lg" />
            </div>
        )}

        <div dir={isRTL ? 'rtl' : 'ltr'} style={{
          position: 'fixed',
          top: 0,
          [isRTL ? 'left' : 'right']: 0,
          width: isMobile ? '100%' : '100%',
          maxWidth: isMobile ? '100%' : '36rem',
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

              <PanelHeader
                student={student}
                attendanceStatus={attendanceStatus}
                t={t}
                lang={lang}
                isRTL={isRTL}
                theme={theme}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }}>
                {/* Notifications toggle hidden
                <PortalTooltip 
                    content={sendNotifications ? t('notifications_on') : t('notifications_off')}
                    position="top"
                  >
                    <div
                        onClick={onToggleNotifications}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.5rem',
                          background: sendNotifications ? 'var(--color-success-light, #f0fdf4)' : 'var(--color-danger-light, #fef2f2)',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          border: `1px solid ${sendNotifications ? 'var(--color-success-border, #bbf7d0)' : 'var(--color-danger-border, #fecaca)'}`,
                          transition: 'all 0.2s',
                          userSelect: 'none'
                        }}
                    >
                      <div style={{
                        width: '1.75rem',
                        height: '0.875rem',
                        background: sendNotifications ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)',
                        borderRadius: '1rem',
                        position: 'relative',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{
                          width: '0.625rem',
                          height: '0.625rem',
                          background: 'var(--toggle-knob, white)',
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
                        color: sendNotifications ? 'var(--color-success-dark, #166534)' : 'var(--color-danger-dark, #991b1b)',
                      }}>
                      {t('notifs')}
                    </span>
                    </div>
                  </PortalTooltip>
                */}
                <PortalTooltip content={t('close')} position="top">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  {getThemedIcon('ui', 'close', 20)}
                </Button>
              </PortalTooltip>
                {/* <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  const referenceId = student.studentNumber ? `STU-${student.studentNumber}` : generateReferenceId(student.id);
                  const qrDataUrl = await generateStudentQRCode(referenceId, { width: 512, margin: 4 });
                  const newTab = window.open();
                  newTab.document.write(`<html><head><title>QR Code</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f3f4f6;"><img src="${qrDataUrl}" style="width:300px;height:300px;"/><h1 style="margin:1rem 0 0;">${student.displayName || student.name}</h1></body></html>`);
                }}
              >
                {getThemedIcon('ui', 'external_link', 20)}
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
                      console.log('🔍 Present button clicked - attendanceMode:', attendanceMode, 'programId:', programId, 'subjectId:', subjectId);
                      const statusToMark = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT';
                      await handleMarkAttendance(student.id, statusToMark);
                    }}
                    disabled={showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT'))}
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.375rem',
                      border: '2px solid #10b981',
                      background: !isAttendanceNone && currentAttendanceStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT') ? 'var(--color-success, #10b981)' : 'var(--panel, white)',
                      color: !isAttendanceNone && currentAttendanceStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT') ? 'var(--text-on-success, white)' : 'var(--color-success, #10b981)',
                      cursor: showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_PRESENT' : 'PRESENT')) ? 'not-allowed' : 'pointer',
                      opacity: showLoadingOverlay ? 0.5 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      minWidth: '3.5rem'
                    }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckSmallIcon style={{ width: '16px', height: '16px' }} />
                    {/*{attendanceStats.present && Number(attendanceStats.present) > 0 ? (*/}
                    {/*  <span style={{*/}
                    {/*    fontSize: '0.5rem',*/}
                    {/*    fontWeight: 600,*/}
                    {/*    color: (currentAttendanceStatus || student.attendance) === 'present' ? 'white' : '#10b981',*/}
                    {/*    background: (currentAttendanceStatus || student.attendance) === 'present' ? '#10b981' : 'transparent',*/}
                    {/*    borderRadius: '0.125rem',*/}
                    {/*    padding: '0.125rem 0.25rem',*/}
                    {/*    minWidth: '0.75rem',*/}
                    {/*    textAlign: 'center'*/}
                    {/*  }}>*/}
                    {/*    {attendanceStats.present}*/}
                    {/*  </span>*/}
                    {/*) : null}*/}
                  </div>
                  <div>{t('present')}</div>
                </button>
                <button
                    onClick={async () => {
                      const statusToMark = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE';
                      await handleMarkAttendance(student.id, statusToMark);
                    }}
                    disabled={showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE'))}
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.375rem',
                      border: '2px solid #f59e0b',
                      background: !isAttendanceNone && currentAttendanceStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE') ? 'var(--color-warning, #f59e0b)' : 'var(--panel, white)',
                      color: !isAttendanceNone && currentAttendanceStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE') ? 'var(--text-on-success, white)' : 'var(--color-warning, #f59e0b)',
                      cursor: showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'STANDUP_LATE' : 'LATE')) ? 'not-allowed' : 'pointer',
                      opacity: showLoadingOverlay ? 0.5 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      minWidth: '3.5rem'
                    }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ClockSmallIcon style={{ width: '16px', height: '16px' }} />
                    {/*{attendanceStats.late && Number(attendanceStats.late) > 0 ? (*/}
                    {/*  <span style={{*/}
                    {/*    fontSize: '0.5rem',*/}
                    {/*    fontWeight: 600,*/}
                    {/*    color: (currentAttendanceStatus || student.attendance) === 'late' ? 'white' : '#f59e0b',*/}
                    {/*    background: (currentAttendanceStatus || student.attendance) === 'late' ? '#f59e0b' : 'transparent',*/}
                    {/*    borderRadius: '0.125rem',*/}
                    {/*    padding: '0.125rem 0.25rem',*/}
                    {/*    minWidth: '0.75rem',*/}
                    {/*    textAlign: 'center'*/}
                    {/*  }}>*/}
                    {/*    {attendanceStats.late}*/}
                    {/*  </span>*/}
                    {/*) : null}*/}
                  </div>
                  <div>{t('late')}</div>
                </button>
                <button
                    onClick={async () => {
                      await handleMarkAttendance(student.id, ATTENDANCE_STATUS.ABSENT_NO_EXCUSE);
                    }}
                    disabled={showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE)}
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.375rem',
                      border: '2px solid var(--color-danger, #ef4444)',
                      background: !isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE ? 'var(--color-danger, #ef4444)' : 'var(--panel, white)',
                      color: !isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE ? 'var(--text-on-primary, white)' : 'var(--color-danger, #ef4444)',
                      cursor: showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_NO_EXCUSE) ? 'not-allowed' : 'pointer',
                      opacity: showLoadingOverlay ? 0.5 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      minWidth: '3.5rem'
                    }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <XSmallIcon style={{ width: '16px', height: '16px' }} />
                    {/*{attendanceStats.absent_no_excuse && Number(attendanceStats.absent_no_excuse) > 0 ? (*/}
                    {/*  <span style={{*/}
                    {/*    fontSize: '0.5rem',*/}
                    {/*    fontWeight: 600,*/}
                    {/*    color: (currentAttendanceStatus || student.attendance) === 'absent_no_excuse' ? 'white' : '#ef4444',*/}
                    {/*    background: (currentAttendanceStatus || student.attendance) === 'absent_no_excuse' ? '#ef4444' : 'transparent',*/}
                    {/*    borderRadius: '0.125rem',*/}
                    {/*    padding: '0.125rem 0.25rem',*/}
                    {/*    minWidth: '0.75rem',*/}
                    {/*    textAlign: 'center'*/}
                    {/*  }}>*/}
                    {/*    {attendanceStats.absent_no_excuse}*/}
                    {/*  </span>*/}
                    {/*) : null}*/}
                  </div>
                  <div>{t('absent')}</div>
                </button>
                <button
                    onClick={async () => {
                      await handleMarkAttendance(student.id, ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE);
                    }}
                    disabled={showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE)}
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.375rem',
                      border: '2px solid #ef4444',
                      background: !isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE ? 'var(--color-danger, #ef4444)' : 'var(--panel, white)',
                      color: !isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE ? 'var(--text-on-success, white)' : 'var(--color-danger, #ef4444)',
                      cursor: showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE) ? 'not-allowed' : 'pointer',
                      opacity: showLoadingOverlay ? 0.5 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      minWidth: '3.5rem'
                    }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <XSmallIcon style={{ width: '16px', height: '16px' }} />
                    {/*{attendanceStats.absent_with_excuse && Number(attendanceStats.absent_with_excuse) > 0 && (*/}
                    {/*  <span style={{*/}
                    {/*    fontSize: '0.5rem',*/}
                    {/*    fontWeight: 600,*/}
                    {/*    color: (currentAttendanceStatus || student.attendance) === 'absent_with_excuse' ? 'white' : '#ef4444',*/}
                    {/*    background: (currentAttendanceStatus || student.attendance) === 'absent_with_excuse' ? '#ef4444' : 'transparent',*/}
                    {/*    borderRadius: '0.125rem',*/}
                    {/*    padding: '0.125rem 0.25rem',*/}
                    {/*    minWidth: '0.75rem',*/}
                    {/*    textAlign: 'center'*/}
                    {/*  }}>*/}
                    {/*    {attendanceStats.absent_with_excuse}*/}
                    {/*  </span>*/}
                    {/*)}*/}
                  </div>
                  <div>{t('absent_excused')}</div>
                </button>
                <button
                    onClick={async () => {
                      await handleMarkAttendance(student.id, ATTENDANCE_STATUS.EXCUSED_LEAVE);
                    }}
                    disabled={showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.EXCUSED_LEAVE)}
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.375rem',
                      border: '2px solid #ec4899',
                      background: !isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.EXCUSED_LEAVE ? '#ec4899' : 'var(--panel, white)',
                      color: !isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.EXCUSED_LEAVE ? 'white' : '#ec4899',
                      cursor: showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.EXCUSED_LEAVE) ? 'not-allowed' : 'pointer',
                      opacity: showLoadingOverlay ? 0.5 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      minWidth: '3.5rem'
                    }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <HeartIcon style={{ width: '16px', height: '16px' }} />
                    {/*{attendanceStats.excused_leave && Number(attendanceStats.excused_leave) > 0 && (*/}
                    {/*  <span style={{*/}
                    {/*    fontSize: '0.5rem',*/}
                    {/*    fontWeight: 600,*/}
                    {/*    color: (currentAttendanceStatus || student.attendance) === 'excused_leave' ? 'white' : '#ef4444',*/}
                    {/*    background: (currentAttendanceStatus || student.attendance) === 'excused_leave' ? '#ef4444' : 'transparent',*/}
                    {/*    borderRadius: '0.125rem',*/}
                    {/*    padding: '0.125rem 0.25rem',*/}
                    {/*    minWidth: '0.75rem',*/}
                    {/*    textAlign: 'center'*/}
                    {/*  }}>*/}
                    {/*    {attendanceStats.excused_leave}*/}
                    {/*  </span>*/}
                    {/*)}*/}
                  </div>
                  <div>{t('excused_leave')}</div>
                </button>
                <button
                    onClick={async () => {
                      await handleMarkAttendance(student.id, ATTENDANCE_STATUS.HUMAN_CASE);
                    }}
                    disabled={showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.HUMAN_CASE)}
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.375rem',
                      border: '2px solid #8b5cf6',
                      background: !isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.HUMAN_CASE ? 'var(--color-purple, #8b5cf6)' : 'var(--panel, white)',
                      color: !isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.HUMAN_CASE ? 'var(--text-on-success, white)' : 'var(--color-purple, #8b5cf6)',
                      cursor: showLoadingOverlay || (!isAttendanceNone && currentAttendanceStatus === ATTENDANCE_STATUS.HUMAN_CASE) ? 'not-allowed' : 'pointer',
                      opacity: showLoadingOverlay ? 0.5 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      minWidth: '3.5rem',
                      position: 'relative'
                    }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <HeartIcon style={{ width: '16px', height: '16px' }} />
                    {/*{attendanceStats.human_case && Number(attendanceStats.human_case) > 0 && (*/}
                    {/*  <span style={{*/}
                    {/*    fontSize: '0.5rem',*/}
                    {/*    fontWeight: 600,*/}
                    {/*    color: (currentAttendanceStatus || student.attendance) === 'human_case' ? 'white' : '#8b5cf6',*/}
                    {/*    background: (currentAttendanceStatus || student.attendance) === 'human_case' ? '#8b5cf6' : 'transparent',*/}
                    {/*    borderRadius: '0.125rem',*/}
                    {/*    padding: '0.125rem 0.25rem',*/}
                    {/*    minWidth: '0.75rem',*/}
                    {/*    textAlign: 'center'*/}
                    {/*  }}>*/}
                    {/*    {attendanceStats.human_case}*/}
                    {/*  </span>*/}
                    {/*)}*/}
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
                  background: 'var(--color-success, #16a34a)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                    {totalAttendanceStats.present}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-success, white)', fontWeight: 500 }}>
                    {t('present')}
                  </div>
                </div>

                {/* Total Penalty */}
                <div style={{
                  padding: '0.5rem',
                  background: 'var(--color-danger, #dc2626)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                    {student.penalty || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-success, white)', fontWeight: 500 }}>
                    {t('penalty')}
                  </div>
                </div>

                {/* Total Behavior */}
                <div style={{
                  padding: '0.5rem',
                  background: 'var(--color-warning, #f97316)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                    {student.behavior || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-success, white)', fontWeight: 500 }}>
                    {t('behavior')}
                  </div>
                </div>

                {/* Total Participation */}
                <div style={{
                  padding: '0.5rem',
                  background: 'var(--color-info, #3b82f6)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                    {student.participation || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-success, white)', fontWeight: 500 }}>
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
                  background: 'var(--color-warning, #f97316)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-warning, white)' }}>
                    {totalAttendanceStats.late}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-warning, white)', fontWeight: 500 }}>
                    {t('late')}
                  </div>
                </div>

                {/* Total Excused Leave */}
                <div style={{
                  padding: '0.5rem',
                  background: 'var(--color-danger, #ef4444)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                    {attendanceStats.excused_leave}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-success, white)', fontWeight: 500 }}>
                    {t('excused_leave')}
                  </div>
                </div>

                {/* Total Absent (Excused) */}
                <div style={{
                  padding: '0.5rem',
                  background: 'var(--color-danger, #ef4444)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                    {attendanceStats.absent_with_excuse}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-success, white)', fontWeight: 500 }}>
                    {t('absent_excused')}
                  </div>
                </div>

                {/* Total Absent (No Excuse) */}
                <div style={{
                  padding: '0.5rem',
                  background: 'var(--color-danger, #ef4444)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                    {attendanceStats.absent_no_excuse}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-success, white)', fontWeight: 500 }}>
                    {t('absent')}
                  </div>
                </div>

                {/* Total Human Case */}
                <div style={{
                  padding: '0.5rem',
                  background: 'var(--color-purple, #8b5cf6)',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '3rem'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                    {attendanceStats.human_case}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-on-success, white)', fontWeight: 500 }}>
                    {t('human_case')}
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
                marginBottom: '0.5rem',
                maxHeight: '60vh',
                overflowY: 'auto'
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
                        background: 'var(--color-info, #3b82f6)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        marginBottom: '0.15rem'
                      }}
                  >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                  {t('participation_details')} ({student.participation || 0} {t('points')}, {(() => {
                  const stats = getDetailedStats();
                  return (lookupData['participation-types'] || []).reduce((sum, type) => sum + (stats.participation[type.id]?.count || 0), 0);
                })()} {t('entries')})
                </span>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      transform: expandedSections.participation ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block'
                    }}>
                      {getThemedIcon('ui', 'chevron_down', 16)}
                    </span>
                  </div>

                  {expandedSections.participation && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        {(() => {
                          const stats = getDetailedStats();
                          return (lookupData["participation-types"] || []).map(type => { console.log("🔴 StatsPanel participation type:", { id: type.id, nameAr: type.nameAr, nameEn: type.nameEn, lang });
                            const stat = stats.participation[type.id];
                            return (
                                <div key={type.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem',
                                  background: 'var(--color-info-light, #dbeafe)', // Light blue background
                                  borderRadius: '0.375rem',
                                  border: '1px solid var(--color-info, #3b82f6)', // Blue border
                                  opacity: stat.count > 0 ? 1 : 0.8
                                }}>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'var(--color-info-dark, #1e3a8a)', // Dark blue text
                                    flex: 1
                                  }}>
                                    {lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'var(--color-info-dark, #1e3a8a)', // Dark blue text
                                    minWidth: '3rem',
                                    textAlign: 'center'
                                  }}>
                                    Total: {stat.totalPoints}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-info-dark, #1e3a8a)', // Dark blue text
                                    minWidth: '3rem',
                                    textAlign: 'right'
                                  }}>
                                    Count: ({stat.count})
                                  </div>
                                  {/* Favorite star toggle */}
                                  <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(type.id);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        flexShrink: 0
                                      }}
                                  >
                                    {favoriteBehaviors.includes(type.id)
                                      ? getIconWithColor('ui', 'star', 14, '#fbbf24')
                                      : getThemedIcon('ui', 'star', 14, theme)}
                                  </button>
                                  {stat.count > 0 && (
                                      <PortalTooltip content={t('delete_all_entries').replace('{type}', type.nameEn)} position="top">
                                      <button
                                          onClick={() => {
                                            setDeleteType('participation');
                                            setBulkDeleteType({ type: 'participation', typeId: type.id, typeName: type.nameEn });
                                            setDeleteModalOpen(true);
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
                                      >
                                        {getThemedIcon('ui', 'trash2', 14)}
                                      </button>
                                    </PortalTooltip>
                                  )}
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
                          background: 'var(--color-info, #3b82f6)',
                          borderRadius: '0.375rem',
                          marginTop: '0.25rem',
                          border: '2px solid var(--text-on-success, white)'
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-on-success, white)',
                            flex: 1
                          }}>
                            Participation
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-on-success, white)',
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            Total: {student.participation || 0}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-on-success, white)',
                            minWidth: '3rem',
                            textAlign: isRTL ? 'left' : 'right'
                          }}>
                            {t('count')}: ({(() => {
                            const stats = getDetailedStats();
                            return (lookupData['participation-types'] || []).reduce((sum, type) => sum + (stats.participation[type.id]?.count || 0), 0);
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
                        background: 'var(--color-warning, #f97316)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        marginBottom: '0.15rem'
                      }}
                  >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                  {t('behavior_details')} ({student.behavior || 0} {t('points')}, {(() => {
                  const stats = getDetailedStats();
                  return (lookupData['behavior-types'] || []).reduce((sum, type) => sum + (stats.behavior[type.id]?.count || 0), 0);
                })()} {t('entries')})
                </span>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      transform: expandedSections.behavior ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block'
                    }}>
                      {getThemedIcon('ui', 'chevron_down', 16)}
                    </span>
                  </div>

                  {expandedSections.behavior && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        {(() => {
                          const stats = getDetailedStats();
                          return (lookupData['behavior-types'] || []).map(type => {
                            const stat = stats.behavior[type.id];
                            return (
                                <div key={type.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem',
                                  background: 'var(--color-warning-light, #fed7aa)', // Light orange background
                                  borderRadius: '0.375rem',
                                  border: '1px solid var(--color-warning, #f97316)', // Orange border
                                  opacity: stat.count > 0 ? 1 : 0.8
                                }}>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'var(--color-warning-dark, #9a3412)', // Dark orange text
                                    flex: 1
                                  }}>
                                    {lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'var(--color-warning-dark, #9a3412)', // Dark orange text
                                    minWidth: '3rem',
                                    textAlign: 'center'
                                  }}>
                                    {t('total')}: {stat.totalPoints >= 0 ? '+' : ''}{stat.totalPoints}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-warning-dark, #9a3412)', // Dark orange text
                                    minWidth: '3rem',
                                    textAlign: isRTL ? 'left' : 'right'
                                  }}>
                                    {t('count')}: ({stat.count})
                                  </div>
                                  {/* Favorite star toggle */}
                                  <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(type.id);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        flexShrink: 0
                                      }}
                                  >
                                    {favoriteBehaviors.includes(type.id)
                                      ? getIconWithColor('ui', 'star', 14, '#fbbf24')
                                      : getThemedIcon('ui', 'star', 14, theme)}
                                  </button>
                                  {stat.count > 0 && (
                                      <PortalTooltip content={t('delete_all_entries').replace('{type}', type.nameEn)} position="top">
                                      <button
                                          onClick={() => {
                                            setDeleteType('behavior');
                                            setBulkDeleteType({ type: 'behavior', typeId: type.id, typeName: type.nameEn });
                                            setDeleteModalOpen(true);
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
                                      >
                                        {getThemedIcon('ui', 'trash2', 14)}
                                      </button>
                                    </PortalTooltip>
                                  )}
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
                          background: 'var(--color-warning, #f97316)',
                          borderRadius: '0.375rem',
                          marginTop: '0.25rem'
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-on-success, white)',
                            flex: 1
                          }}>
                            {t('behavior')}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-on-success, white)',
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            {t('total')}: {student.behavior || 0}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-on-success, white)',
                            minWidth: '3rem',
                            textAlign: isRTL ? 'left' : 'right'
                          }}>
                            {t('count')}: ({(() => {
                            const stats = getDetailedStats();
                            return (lookupData['behavior-types'] || []).reduce((sum, type) => sum + (stats.behavior[type.id]?.count || 0), 0);
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
                        background: 'var(--color-danger, #dc2626)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        marginBottom: '0.2rem'
                      }}
                  >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-on-success, white)' }}>
                  {t('penalty_details')} ({student.penalty || 0} {t('points')}, {(() => {
                  const stats = getDetailedStats();
                  return (lookupData['penalty-types'] || []).reduce((sum, type) => sum + (stats.penalty[type.id]?.count || 0), 0);
                })()} {t('entries')})
                </span>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      transform: expandedSections.penalty ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block'
                    }}>
                      {getThemedIcon('ui', 'chevron_down', 16)}
                    </span>
                  </div>

                  {expandedSections.penalty && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        {(() => {
                          const stats = getDetailedStats();

                          return (lookupData['penalty-types'] || []).map(type => {
                            const stat = stats.penalty[type.id];
                            return (
                                <div key={type.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem',
                                  background: 'var(--color-danger-light, #fee2e2)',
                                  borderRadius: '0.375rem',
                                  border: '1px solid var(--color-danger, #dc2626)',
                                  opacity: stat.count > 0 ? 1 : 0.8
                                }}>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'var(--color-danger, #dc2626)',
                                    flex: 1
                                  }}>
                                    {lang === 'ar' ? (type.nameAr || type.nameEn) : type.nameEn}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'var(--color-danger-dark, #991b1b)',
                                    minWidth: '3rem',
                                    textAlign: 'center'
                                  }}>
                                    Total: {stat.totalPoints}
                                  </div>
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-danger, #dc2626)',
                                    minWidth: '3rem',
                                    textAlign: 'right'
                                  }}>
                                    Count: ({stat.count})
                                  </div>
                                  {/* Favorite star toggle */}
                                  <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(type.id);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        flexShrink: 0
                                      }}
                                  >
                                    {favoriteBehaviors.includes(type.id)
                                      ? getIconWithColor('ui', 'star', 14, '#fbbf24')
                                      : getThemedIcon('ui', 'star', 14, theme)}
                                  </button>
                                  {stat.count > 0 && (
                                      <PortalTooltip content={t('delete_all_entries').replace('{type}', type.nameEn)} position="top">
                                      <button
                                          onClick={() => {
                                            setDeleteType('penalty');
                                            setBulkDeleteType({ type: 'penalty', typeId: type.id, typeName: type.nameEn });
                                            setDeleteModalOpen(true);
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
                                      >
                                        {getThemedIcon('ui', 'trash2', 14)}
                                      </button>
                                    </PortalTooltip>
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
                          background: 'var(--color-danger, #dc2626)',
                          borderRadius: '0.375rem',
                          marginTop: '0.25rem'
                        }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-on-success, white)',
                            flex: 1
                          }}>
                            {t('penalty')}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-on-success, white)',
                            minWidth: '3rem',
                            textAlign: 'center'
                          }}>
                            {t('total')}: {student.penalty || 0}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-on-success, white)',
                            minWidth: '3rem',
                            textAlign: isRTL ? 'left' : 'right'
                          }}>
                            {t('count')}: ({(() => {
                            const stats = getDetailedStats();
                            return (lookupData['penalty-types'] || []).reduce((sum, type) => sum + (stats.penalty[type.id]?.count || 0), 0);
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
                padding: '0.2rem',
                background: 'var(--panel-hover, #f8fafc)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-light, #e2e8f0)'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.05rem',
                  flex: 1,
                  flexWrap: 'nowrap'
                }}>
                  <button
                      onClick={() => toggleFilter(RECORD_TYPES.ATTENDANCE)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.02rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        background: activeFilters.attendance ? 'var(--color-success, #065f46)' : 'var(--panel, #ffffff)',
                        color: activeFilters.attendance ? 'var(--text-on-success, white)' : 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        boxShadow: activeFilters.attendance ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                  >
                    <UserIcon style={{ width: '16px', height: '16px' }} />
                    {t('attendance')}
                  </button>
                  <button
                      onClick={() => toggleFilter('participation')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        background: activeFilters.participation ? 'var(--color-info, #3b82f6)' : 'var(--panel, #ffffff)',
                        color: activeFilters.participation ? 'var(--text-on-success, white)' : 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        boxShadow: activeFilters.participation ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                  >
                    <ParticipationIcon style={{ width: '16px', height: '16px' }} />
                    {t('participation')}
                  </button>
                  <button
                      onClick={() => toggleFilter('behavior')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        background: activeFilters.behavior ? 'var(--color-warning, #f97316)' : 'var(--panel, #ffffff)',
                        color: activeFilters.behavior ? 'var(--text-on-success, white)' : 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        boxShadow: activeFilters.behavior ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                  >
                    <ZapIcon style={{ width: '16px', height: '16px' }} />
                    {t('behavior')}
                  </button>
                  <button
                      onClick={() => toggleFilter('penalties')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0',
                        background: activeFilters.penalties ? 'var(--color-danger, #dc2626)' : 'var(--panel, #ffffff)',
                        color: activeFilters.penalties ? 'var(--text-on-success, white)' : 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        boxShadow: activeFilters.penalties ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                  >
                    <PenaltyIcon style={{ width: '16px', height: '16px' }}/>
                    {t('penalties')}
                  </button>
                </div>
                {historicalLogs.length > 0 && (
                    <PortalTooltip content={t('expand_all')} position="top">
                    <button
                        onClick={expandAllDays}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#64748b',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                    >
                      <>
                            <span style={{ width: '14px', height: '14px', display: 'inline-block' }}>
                              {getThemedIcon('ui', 'chevron_down', 16)}
                            </span>
                          </>
                    </button>
                    </PortalTooltip>
                )}
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem'
              }}>

                {(() => {
                  console.log('🔍 StudentActionStatsPanel - Render state:', {
                    logsLoading,
                    historicalLogsLength: historicalLogs.length,
                    studentId: student?.id,
                    studentName: student?.displayName || student?.name
                  });

                  return logsLoading ? (
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
                        handleDeleteParticipation={handleDeleteParticipation}
                        handleDeletePenalty={(studentId, logId) => handleDeletePenalty(logId)}
                        t={t}
                        isRTL={isRTL}
                        studentId={student?.id}
                        canDeleteAttendance={canDeleteAttendance}
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {canDeleteAttendance && deleteModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}>
                <Card style={{ maxWidth: '400px', margin: '1rem' }}>
                  <CardBody>
                    <h3>{t('delete_activity_title', { type: deleteType === RECORD_TYPES.ATTENDANCE ? t('attendance') : t('penalty') })}</h3>
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
