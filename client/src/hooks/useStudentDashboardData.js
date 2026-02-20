import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getEnrollments } from '@services/business/enrollmentService';
import { getAttendanceByStudent } from '@services/business/attendanceService';
import { getPenalties } from '@services/business/penaltyService';
import { getParticipations } from '@services/business/participationService';
import { getBehaviors } from '@services/business/behaviorService';
import { getStudentMarks } from '@services/business/enrollmentMarksService';
import { getActivitiesByClasses } from '@services/business/activitiesService';
import { getSubmissionsByUser } from '@services/business/submissionsService';
import { getQuizResultsByUser } from '@services/business/quizResultsService';
import logger from '@utils/logger';

/**
 * Central data hook for the Student Dashboard.
 * Wraps the raw service calls and provides derived/grouped data.
 *
 * @param {string|null} displayStudentId - The student whose data to load.
 *   For student role: always user.uid.
 *   For staff: the selected student ID, or null (no data loaded until selected).
 * @param {boolean} hasSelection - Whether a valid selection context exists.
 *   When false (staff with no selection), data is not fetched.
 */
const useStudentDashboardData = (displayStudentId, hasSelection = true) => {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLang();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState({
    enrollments: [],
    attendance: [],
    penalties: [],
    participations: [],
    behaviors: [],
    marks: [],
    activities: [],
    submissions: [],
    quizResults: [],
  });

  const effectiveUserId = displayStudentId || user?.uid;

  const loadData = useCallback(async () => {
    if (!effectiveUserId || !hasSelection) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info('[StudentDashboardData] Loading data', { effectiveUserId });

      const [
        enrollmentsRes,
        attendanceRes,
        penaltiesRes,
        participationsRes,
        behaviorsRes,
        marksRes,
        submissionsRes,
        quizResultsRes,
      ] = await Promise.allSettled([
        getEnrollments({ userId: effectiveUserId }),
        getAttendanceByStudent(effectiveUserId),
        getPenalties(effectiveUserId),
        getParticipations({ studentId: effectiveUserId }),
        getBehaviors({ studentId: effectiveUserId }),
        getStudentMarks(effectiveUserId),
        getSubmissionsByUser(effectiveUserId),
        getQuizResultsByUser(effectiveUserId),
      ]);

      const enrollments = enrollmentsRes.status === 'fulfilled' ? (enrollmentsRes.value?.data || []) : [];
      const attendance = attendanceRes.status === 'fulfilled' ? (attendanceRes.value?.data || []) : [];
      const penalties = penaltiesRes.status === 'fulfilled' ? (penaltiesRes.value?.data || []) : [];
      const participations = participationsRes.status === 'fulfilled' ? (participationsRes.value?.data || []) : [];
      const behaviors = behaviorsRes.status === 'fulfilled' ? (behaviorsRes.value?.data || []) : [];
      const marks = marksRes.status === 'fulfilled' ? (marksRes.value?.data || []) : [];
      const submissions = submissionsRes.status === 'fulfilled' ? (submissionsRes.value?.data || []) : [];
      const quizResults = quizResultsRes.status === 'fulfilled' ? (quizResultsRes.value?.data || []) : [];

      // Load activities for all enrolled classes
      const classIds = [...new Set(enrollments.map(e => e.classId).filter(Boolean))];
      let activities = [];
      if (classIds.length > 0) {
        try {
          const activitiesRes = await getActivitiesByClasses(classIds);
          activities = activitiesRes?.data || [];
        } catch (err) {
          logger.error('[StudentDashboardData] Failed to load activities', err);
        }
      }

      setRawData({ enrollments, attendance, penalties, participations, behaviors, marks, activities, submissions, quizResults });
      
      logger.log('[StudentDashboardData] Data loaded successfully:', {
        enrollments: enrollments.length,
        attendance: attendance.length,
        penalties: penalties.length,
        participations: participations.length,
        behaviors: behaviors.length,
        marks: marks.length,
        activities: activities.length,
        submissions: submissions.length,
        quizResults: quizResults.length
      });
    } catch (err) {
      logger.error('[StudentDashboardData] Failed to load dashboard data', err);
      setError(err);
      toast?.showError?.(t('failed_to_load_dashboard') || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, hasSelection, toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Derived: semester/year grouping ──────────────────────────────────────
  const semesters = useMemo(() => {
    const semesterMap = new Map();
    rawData.enrollments.forEach(enrollment => {
      const semester = enrollment.semester || 'Unknown';
      const year = enrollment.academicYear || enrollment.year || new Date().getFullYear();
      const key = `${semester}-${year}`;

      if (!semesterMap.has(key)) {
        semesterMap.set(key, {
          id: key,
          semester,
          year,
          courses: [],
          status: 'active',
        });
      }

      const semData = semesterMap.get(key);
      const courseMarks = rawData.marks.find(
        m => m.enrollmentId === enrollment.id || m.enrollmentId === enrollment.docId
      );
      const courseAttendance = rawData.attendance.filter(a => a.classId === enrollment.classId);
      const presentCount = courseAttendance.filter(a => a.status === 'present').length;
      const attendanceRate = courseAttendance.length > 0 ? (presentCount / courseAttendance.length) * 100 : 0;

      semData.courses.push({
        ...enrollment,
        marks: courseMarks,
        grade: courseMarks?.grade,
        totalMarks: courseMarks?.totalMarks,
        attendance: courseAttendance,
        attendanceRate,
        activities: rawData.activities.filter(a => a.classId === enrollment.classId),
        submissions: rawData.submissions.filter(s => s.classId === enrollment.classId),
        quizResults: rawData.quizResults.filter(q => q.classId === enrollment.classId),
      });
    });

    semesterMap.forEach(sem => {
      sem.courseCount = sem.courses.length;
      const gradesWithPoints = sem.courses
        .filter(c => c.marks?.points !== undefined)
        .map(c => ({ points: c.marks.points, credits: c.credits || 3 }));
      const totalPoints = gradesWithPoints.reduce((s, g) => s + g.points * g.credits, 0);
      const totalCredits = gradesWithPoints.reduce((s, g) => s + g.credits, 0);
      sem.gpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;

      const allAttendance = sem.courses.flatMap(c => c.attendance || []);
      const present = allAttendance.filter(a => a.status === 'present').length;
      sem.attendanceRate = allAttendance.length > 0
        ? parseFloat(((present / allAttendance.length) * 100).toFixed(1))
        : 0;

      const allCompleted = sem.courses.every(c => c.status === 'completed');
      sem.status = allCompleted ? 'completed' : 'active';
    });

    return Array.from(semesterMap.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.semester.localeCompare(a.semester);
    });
  }, [rawData]);

  // ─── Derived: stats summary ────────────────────────────────────────────────
  const statsData = useMemo(() => {
    const totalAttendance = rawData.attendance.length;
    const presentCount = rawData.attendance.filter(a => a.status === 'present').length;
    const lateCount = rawData.attendance.filter(a => a.status === 'late').length;
    const absentCount = rawData.attendance.filter(a =>
      a.status === 'absent_no_excuse' || a.status === 'absent'
    ).length;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    const gradesWithPoints = rawData.marks.filter(m => m.points !== undefined);
    const totalPoints = gradesWithPoints.reduce((s, m) => s + (m.points * (m.credits || 3)), 0);
    const totalCredits = gradesWithPoints.reduce((s, m) => s + (m.credits || 3), 0);
    const gpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;

    const totalParticipations = rawData.participations.length;
    const totalPenalties = rawData.penalties.length;
    const totalBehaviors = rawData.behaviors.length;
    const participationPoints = rawData.participations.reduce((s, p) => s + (Number(p.points) || 0), 0);
    const penaltyPoints = rawData.penalties.reduce((s, p) => s + (Number(p.points) || 0), 0);
    const netScore = participationPoints - penaltyPoints;

    return {
      gpa,
      attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      presentCount,
      lateCount,
      absentCount,
      totalAttendance,
      enrollments: rawData.enrollments.length,
      participations: totalParticipations,
      participationPoints,
      penalties: totalPenalties,
      penaltyPoints,
      behaviors: totalBehaviors,
      netScore,
    };
  }, [rawData]);

  // Log stats data for debugging
  useMemo(() => {
    if (rawData.enrollments.length > 0 || rawData.attendance.length > 0) {
      logger.log('[StudentDashboardData] Stats calculated:', {
        gpa: statsData.gpa,
        attendanceRate: statsData.attendanceRate,
        participations: statsData.participations,
        penalties: statsData.penalties,
        behaviors: statsData.behaviors,
        netScore: statsData.netScore,
        loading
      });
    }
  }, [statsData, rawData.enrollments.length, rawData.attendance.length, loading]);

  // ─── Derived: grouped attendance history (for history components) ──────────
  const attendanceHistory = useMemo(() => {
    const allLogs = [
      ...rawData.attendance.map(a => ({ ...a, logType: 'attendance' })),
      ...rawData.participations.map(p => ({ ...p, logType: 'participation' })),
      ...rawData.behaviors.map(b => ({ ...b, logType: 'behavior' })),
      ...rawData.penalties.map(p => ({ ...p, logType: 'penalty' })),
    ];
    return allLogs;
  }, [rawData]);

  return {
    // Raw collections
    ...rawData,

    // Derived
    semesters,
    statsData,
    attendanceHistory,

    // Meta
    loading,
    error,
    reload: loadData,
  };
};

export default useStudentDashboardData;
