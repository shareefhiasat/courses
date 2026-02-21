// DEPRECATED: This component is deprecated. Use StudentActionPanelNew instead.
// This file is kept for reference but should be removed in a future release.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@utils/logger';
import { X, Mail, Users, Zap, ChevronDown, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@ui';
import { Card, CardBody } from '@ui';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS } from '@constants/attendanceTypes';
import { getAttendanceByStudent, deleteAttendance } from '@services/business/attendanceService';
import { getPenalties, deletePenalty } from '@services/business/penaltyService';
import { getParticipations, deleteParticipation } from '@services/business/participationService';
import { getBehaviors, deleteBehavior } from '@services/business/behaviorService';
import { getFunctions } from '@services/other/config';
import eventBus, { EVENTS } from '@utils/eventBus';
import { SimpleLoading } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { BEHAVIOR_TYPES } from '@constants/behaviorTypes';
import { PARTICIPATION_TYPES } from '@constants/participationTypes';
import { PENALTY_TYPES } from '@constants/penaltyTypes';
import { RECORD_TYPES, getRecordTypeLabel } from '@utils/sharedTypes';
import {ParticipationIcon, PenaltyIcon, StudentHistory, DeleteModal} from '@ui/history';
import {CircleIcon, CheckSmallIcon, ClockSmallIcon, XSmallIcon, FileIcon, HeartIcon, HelpCircleIcon, UserIcon, UserPlusIcon, ZapIcon} from "@utils/icons.jsx";
import { getAttendanceMethodLabel, shouldShowMethodLabel } from '@constants/attendanceMethods';

export default function StudentActionPanel({
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
  onToggleNotifications
}) {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { showSuccess, showError } = useToast();
  const [selectedActions, setSelectedActions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [deleteLogId, setDeleteLogId] = useState('');
  const [bulkDeleteType, setBulkDeleteType] = useState(null); // For bulk delete operations
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionPoints, setActionPoints] = useState({});
  const [internalNote, setInternalNote] = useState('');
  const [activeTab, setActiveTab] = useState(RECORD_TYPES.BEHAVIOR);
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
    if (student?.attendance) {
      setCurrentAttendanceStatus(student.attendance);
    }
  }, [student?.attendance]);

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

      // Get penalties for this student
      const penaltiesResponse = await getPenalties(student.id);
      const studentPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];

      // Get behavior records for this student
      const behaviorResponse = await getBehaviors();
      const studentBehaviors = behaviorResponse.success ? behaviorResponse.data.filter(b => b.studentId === student.id) : [];

      // Get participation records for this student
      const participationResponse = await getParticipations();
      const studentParticipations = participationResponse.success ? participationResponse.data.filter(p => p.studentId === student.id) : [];

      // Combine and format logs with date information
      const logs = [
        ...attendanceRecords.map(record => ({
          id: record.id || record.docId,
          type: record.category || (record.delta ? (record.delta > 0 ? RECORD_TYPES.PARTICIPATION : RECORD_TYPES.BEHAVIOR) : RECORD_TYPES.ATTENDANCE),
          date: record.date || (record.timestamp?.toDate ? record.timestamp.toDate().toISOString().split('T')[0] : new Date(record.timestamp).toISOString().split('T')[0]),
          time: record.timestamp || record.date,
          status: record.status,  // ← Flatten status to top level
          method: record.method, // ← Include method field for attendance method display
          label: record.category === RECORD_TYPES.PARTICIPATION
              ? getRecordTypeLabel(RECORD_TYPES.PARTICIPATION, lang)
              : (record.category === RECORD_TYPES.BEHAVIOR
                  ? getRecordTypeLabel(RECORD_TYPES.BEHAVIOR, lang)
                  : (ATTENDANCE_STATUS_LABELS[record.status]?.[lang] || record.status || t('unknown') || 'Unknown')),
          points: record.delta || 0,
          comment: record.reason || record.notes || '',
          severity: 'low',
          color: record.category === RECORD_TYPES.PARTICIPATION
              ? '#3b82f6'
              : (record.category === RECORD_TYPES.BEHAVIOR
                  ? '#f97316'
                  : (ATTENDANCE_STATUS_LABELS[record.status]?.color || '#6b7280'))
        })),
        ...studentBehaviors.map(behavior => ({
          id: behavior.id || behavior.docId,
          type: RECORD_TYPES.BEHAVIOR,
          date: behavior.date || (behavior.createdAt?.toDate ? behavior.createdAt.toDate().toISOString().split('T')[0] : new Date(behavior.createdAt).toISOString().split('T')[0]),
          time: behavior.createdAt,
          data: behavior,
          label: behavior.type ? (BEHAVIOR_TYPES.find(bt => bt.id === behavior.type)?.label_en || behavior.type) : getRecordTypeLabel(RECORD_TYPES.BEHAVIOR, lang),
          points: behavior.points || 0,
          comment: behavior.comment || behavior.description || behavior.reason || '',
          severity: behavior.severity || 'medium',
          color: '#f97316'
        })),
        ...studentParticipations.map(participation => ({
          id: participation.id || participation.docId,
          type: RECORD_TYPES.PARTICIPATION,
          date: participation.date || (participation.createdAt?.toDate ? participation.createdAt.toDate().toISOString().split('T')[0] : new Date(participation.createdAt).toISOString().split('T')[0]),
          time: participation.createdAt,
          data: participation,
          label: participation.type ? (PARTICIPATION_TYPES.find(pt => pt.id === participation.type)?.label_en || participation.type) : getRecordTypeLabel(RECORD_TYPES.PARTICIPATION, lang),
          points: participation.points || 0,
          comment: participation.comment || participation.description || participation.reason || '',
          severity: 'low',
          color: '#3b82f6'
        })),
        ...studentPenalties.map(penalty => {
          // Try multiple possible fields for the penalty type
          const penaltyTypeId = penalty.type || penalty.penaltyType || penalty.category;
          const penaltyType = penaltyTypeId ? PENALTY_TYPES.find(pt => pt.id === penaltyTypeId) : null;

          const mappedPenalty = {
            id: penalty.id || penalty.docId,
            type: RECORD_TYPES.PENALTY,
            date: penalty.date || (penalty.createdAt?.toDate ? penalty.createdAt.toDate().toISOString().split('T')[0] : new Date(penalty.createdAt).toISOString().split('T')[0]),
            time: penalty.createdAt,
            data: penalty,
            label: penaltyType
                ? (penaltyType.label_en || penaltyType.label_ar)
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

      console.log('🔧 StudentActionPanel - total logs fetched:', logs.length);
      console.log('🔧 StudentActionPanel - logs:', logs);

      // Filter today's logs
      const today = new Date().toISOString().split('T')[0];
      const todayLogsFiltered = logs.filter(log => log.date === today);

      console.log('🔧 StudentActionPanel - today logs filtered:', todayLogsFiltered.length);
      console.log('🔧 StudentActionPanel - historical logs to set:', logs.length);

      // Set historicalLogs to ALL logs (including today)
      setHistoricalLogs(logs);
      // Set todayLogs to only today's logs
      setTodayLogs(todayLogsFiltered);

      // Don't auto-expand - let user choose what to expand
      setExpandedDays(new Set());

      setLogsError('');
    } catch (error) {
      logger.error('Error fetching historical logs:', error);
      setLogsError('Failed to load history');
      setHistoricalLogs([]);
      setTodayLogs([]);
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
    setShowLoadingOverlay(true);
    try {
      await onMarkAttendance(studentId, status);
      // Update the current attendance status immediately for UI feedback
      setCurrentAttendanceStatus(status);
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
            logger.error('Failed to delete participation record:', result.error);
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
            logger.error('Failed to delete penalty record:', result.error);
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
            logger.error('Failed to delete behavior record:', result.error);
            showError('Failed to delete behavior record: ' + result.error);
          }
        }
      }
    } catch (error) {
      logger.error(`Error deleting ${deleteType} record:`, error);
      showError(`Error deleting ${deleteType} record: ` + error.message);
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
          const timeA = a.time?.toDate ? a.time.toDate() : new Date(a.time);
          const timeB = b.time?.toDate ? b.time.toDate() : new Date(b.time);
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
      console.log('🔍 StudentActionPanel day sort:', {
        dayA: { date: a.date, parsedDate: new Date(a.date) },
        dayB: { date: b.date, parsedDate: new Date(b.date) },
        result
      });
      return result;
    });

    console.log('🔍 StudentActionPanel final grouped logs:', sortedGrouped.map(g => ({ date: g.date, counts: { attendance: g.attendance.length, penalties: g.penalties.length, participation: g.participation.length, behavior: g.behavior.length } })));

    return sortedGrouped;
  }, []);

  // Memoized grouped logs for display
  const memoizedGroupedLogs = useMemo(() => {
    const grouped = groupLogsByDay(historicalLogs);
    console.log('🔧 StudentActionPanel - memoizedGroupedLogs:', grouped);
    console.log('🔧 StudentActionPanel - historicalLogs length:', historicalLogs.length);
    console.log('🔧 StudentActionPanel - activeFilters:', activeFilters);

    // Debug today's logs specifically
    const today = new Date().toISOString().split('T')[0];
    const todayGroup = grouped.find(g => g.date === today);
    if (todayGroup) {
      console.log('🔧 Today group logs:', {
        date: todayGroup.date,
        attendance: todayGroup.attendance.length,
        penalties: todayGroup.penalties.length,
        participation: todayGroup.participation.length,
        behavior: todayGroup.behavior.length,
        total: todayGroup.attendance.length + todayGroup.penalties.length + todayGroup.participation.length + todayGroup.behavior.length
      });
    }

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
  const attendanceStatus = useMemo(() => {
    // Check if there are actual attendance records for today (not participation/behavior/penalty)
    const hasTodayAttendance = todayLogs.some(log =>
        log.type === RECORD_TYPES.ATTENDANCE &&
        log.status &&
        [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, ATTENDANCE_STATUS.LATE, ATTENDANCE_STATUS.EXCUSED_LEAVE, ATTENDANCE_STATUS.HUMAN_CASE].includes(log.status)
    );

    // If no actual attendance records for today, show None (matching roster)
    if (!hasTodayAttendance) {
      console.log('🔧 No attendance found - showing None');
      return {
        en: t('none') || 'None',
        ar: t('none') || 'لا شيء',
        color: '#9ca3af'
      };
    }

    // If there are attendance records, check for current status (prefer current status for immediate updates)
    const attendanceToUse = currentAttendanceStatus;
    if (attendanceToUse) {
      const statusInfo = ATTENDANCE_STATUS_LABELS[attendanceToUse];
      if (statusInfo) {
        console.log('🔧 Using direct attendance status:', attendanceToUse, statusInfo);
        return statusInfo;
      }
    }

    // Fallback to None if no valid status found
    return {
      en: t('none') || 'None',
      ar: t('none') || 'لا شيء',
      color: '#9ca3af'
    };
  }, [student?.attendance, todayLogs, currentAttendanceStatus, t]);

  // Helper variable to check if attendance status is None
  const isAttendanceNone = attendanceStatus?.en === 'None';

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
  }, [todayLogs, currentAttendanceStatus, student?.attendance]);

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
                      {currentAttendanceStatus ? (
                          <>
                        <span style={{
                          width: '0.375rem',
                          height: '0.375rem',
                          background: attendanceStatus.color,
                          borderRadius: '9999px'
                        }} />
                            {/* Only show text for attendance status if it's not 'present' */}
                            {currentAttendanceStatus !== 'present' && (
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {lang === 'ar' ? (attendanceStatus.ar || attendanceStatus.en) : attendanceStatus.en}
                          </span>
                            )}
                          </>
                      ) : (
                          // Show None when no attendance status
                          <>
                            <CircleIcon style={{ width: '14px', height: '14px', stroke: '#9ca3af' }} />
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {t('none') || 'None'}
                        </span>
                          </>
                      )}
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
                      await handleMarkAttendance(student.id, ATTENDANCE_STATUS.PRESENT);
                    }}
                    disabled={showLoadingOverlay || isAttendanceNone}
                    style={{
                      padding: '0.375rem',
                      borderRadius: '0.25rem',
                      border: '2px solid #10b981',
                      background: !isAttendanceNone && currentAttendanceStatus === 'present' ? '#10b981' : 'white',
                      color: !isAttendanceNone && currentAttendanceStatus === 'present' ? 'white' : '#10b981',
                      cursor: (showLoadingOverlay || isAttendanceNone) ? 'not-allowed' : 'pointer',
                      opacity: isAttendanceNone ? 0.5 : 1,
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
                    <CheckSmallIcon style={{ width: '12px', height: '12px' }} />
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
                      await handleMarkAttendance(student.id, ATTENDANCE_STATUS.LATE);
                    }}
                    disabled={showLoadingOverlay || isAttendanceNone}
                    style={{
                      padding: '0.375rem',
                      borderRadius: '0.25rem',
                      border: '2px solid #f59e0b',
                      background: !isAttendanceNone && currentAttendanceStatus === 'late' ? '#f59e0b' : 'white',
                      color: !isAttendanceNone && currentAttendanceStatus === 'late' ? 'white' : '#f59e0b',
                      cursor: (showLoadingOverlay || isAttendanceNone) ? 'not-allowed' : 'pointer',
                      opacity: isAttendanceNone ? 0.5 : 1,
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
                    <ClockSmallIcon style={{ width: '12px', height: '12px' }} />
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
                    disabled={showLoadingOverlay || isAttendanceNone}
                    style={{
                      padding: '0.375rem',
                      borderRadius: '0.25rem',
                      border: '2px solid #ef4444',
                      background: !isAttendanceNone && currentAttendanceStatus === 'absent_no_excuse' ? '#ef4444' : 'white',
                      color: !isAttendanceNone && currentAttendanceStatus === 'absent_no_excuse' ? 'white' : '#ef4444',
                      cursor: (showLoadingOverlay || isAttendanceNone) ? 'not-allowed' : 'pointer',
                      opacity: isAttendanceNone ? 0.5 : 1,
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
                    <XSmallIcon style={{ width: '12px', height: '12px' }} />
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
                    disabled={showLoadingOverlay || isAttendanceNone}
                    style={{
                      padding: '0.375rem',
                      borderRadius: '0.25rem',
                      border: '2px solid #ef4444',
                      background: !isAttendanceNone && currentAttendanceStatus === 'absent_with_excuse' ? '#ef4444' : 'white',
                      color: !isAttendanceNone && currentAttendanceStatus === 'absent_with_excuse' ? 'white' : '#ef4444',
                      cursor: (showLoadingOverlay || isAttendanceNone) ? 'not-allowed' : 'pointer',
                      opacity: isAttendanceNone ? 0.5 : 1,
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
                    <XSmallIcon style={{ width: '12px', height: '12px' }} />
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
                    disabled={showLoadingOverlay || isAttendanceNone}
                    style={{
                      padding: '0.375rem',
                      borderRadius: '0.25rem',
                      border: '2px solid #ef4444',
                      background: !isAttendanceNone && currentAttendanceStatus === 'excused_leave' ? '#ef4444' : 'white',
                      color: !isAttendanceNone && currentAttendanceStatus === 'excused_leave' ? 'white' : '#ef4444',
                      cursor: (showLoadingOverlay || isAttendanceNone) ? 'not-allowed' : 'pointer',
                      opacity: isAttendanceNone ? 0.5 : 1,
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
                    <XSmallIcon style={{ width: '12px', height: '12px' }} />
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
                    disabled={showLoadingOverlay || isAttendanceNone}
                    style={{
                      padding: '0.375rem',
                      borderRadius: '0.25rem',
                      border: '2px solid #8b5cf6',
                      background: !isAttendanceNone && currentAttendanceStatus === 'human_case' ? '#8b5cf6' : 'white',
                      color: !isAttendanceNone && currentAttendanceStatus === 'human_case' ? 'white' : '#8b5cf6',
                      cursor: (showLoadingOverlay || isAttendanceNone) ? 'not-allowed' : 'pointer',
                      opacity: isAttendanceNone ? 0.5 : 1,
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
                    <HeartIcon style={{ width: '12px', height: '12px' }} />
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

                {/* Total Excused Leave */}
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
                    {attendanceStats.excused_leave}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                    {t('excused_leave')}
                  </div>
                </div>

                {/* Total Absent (Excused) */}
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
                                  {stat.count > 0 && (
                                      <button
                                          onClick={() => {
                                            setDeleteType('participation');
                                            setBulkDeleteType({ type: 'participation', typeId: type.id, typeName: type.label_en });
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
                                          title={`Delete all ${type.label_en} entries`}
                                      >
                                        <Trash2 size={14} />
                                      </button>
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
                                  {stat.count > 0 && (
                                      <button
                                          onClick={() => {
                                            setDeleteType('behavior');
                                            setBulkDeleteType({ type: 'behavior', typeId: type.id, typeName: type.label_en });
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
                                          title={`Delete all ${type.label_en} entries`}
                                      >
                                        <Trash2 size={14} />
                                      </button>
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
                                          onClick={() => {
                                            setDeleteType('penalty');
                                            setBulkDeleteType({ type: 'penalty', typeId: type.id, typeName: type.label_en });
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
                        background: activeFilters.attendance ? '#065f46' : 'var(--panel, #ffffff)',
                        color: activeFilters.attendance ? 'white' : 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        boxShadow: activeFilters.attendance ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                  >
                    <UserIcon style={{ width: '12px', height: '12px' }} />
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
                        background: activeFilters.participation ? '#3b82f6' : 'var(--panel, #ffffff)',
                        color: activeFilters.participation ? 'white' : 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        boxShadow: activeFilters.participation ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                  >
                    <ParticipationIcon style={{ width: '12px', height: '12px' }} />
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
                        background: activeFilters.behavior ? '#f97316' : 'var(--panel, #ffffff)',
                        color: activeFilters.behavior ? 'white' : 'var(--text-muted, #64748b)',
                        cursor: 'pointer',
                        boxShadow: activeFilters.behavior ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                  >
                    <ZapIcon style={{ width: '12px', height: '12px' }} />
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
                        background: activeFilters.penalties ? '#dc2626' : '#ffffff',
                        color: activeFilters.penalties ? 'white' : '#64748b',
                        cursor: 'pointer',
                        boxShadow: activeFilters.penalties ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                  >
                    <PenaltyIcon style={{ width: '12px', height: '12px' }}/>
                    {t('penalties')}
                  </button>
                </div>
                {historicalLogs.length > 0 && (
                    <button
                        onClick={expandedDays.size === memoizedGroupedLogs.length ? collapseAllDays : expandAllDays}
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
                        title={expandedDays.size === memoizedGroupedLogs.length ? (t('collapse_all')) : (t('expand_all'))}
                    >
                      {expandedDays.size === memoizedGroupedLogs.length ? (
                          <>
                            <ChevronDown style={{ width: '14px', height: '14px', transform: 'rotate(180deg)' }} />
                            {t('collapse_all')}
                          </>
                      ) : (
                          <>
                            <ChevronDown style={{ width: '14px', height: '14px' }} />
                            {/*{t('expand_all') || 'Expand All'}*/}
                          </>
                      )}
                    </button>
                )}
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
                        handleDeleteParticipation={handleDeleteParticipation}
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
