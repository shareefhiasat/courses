import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getEnrollments, getStudentsByClass } from '@services/business/enrollmentService';
import { getAttendanceByStudent } from '@services/business/attendanceService';
import { getPenalties } from '@services/business/penaltyService';
import { getParticipations } from '@services/business/participationService';
import { getBehaviors } from '@services/business/behaviorService';
import { getStudentMarks } from '@services/business/enrollmentMarksService';
import { getActivitiesByClasses } from '@services/business/activitiesService';
import { getSubmissionsByUser } from '@services/business/submissionsService';
import { getLocalizedActionLabel } from '@utils/sharedTypes';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Central data hook for the Student Dashboard.
 * Wraps the raw service calls and provides derived/grouped data.
 *
 * @param {string|null} displayStudentId - The student whose data to load.
 *   For student role: always user.uid.
 *   For staff: the selected student ID, or null (no data loaded until selected).
 * @param {boolean} hasSelection - Whether a valid selection context exists.
 *   When false (staff with no selection), data is not fetched.
 * @param {string|null} classId - The class ID to fetch data for all students when no specific student is selected.
 */
const useStudentDashboardData = (displayStudentId, hasSelection = true, classId = null) => {
  const { user } = useAuth();
  const toast = useToast();
  const { t, lang } = useLang();

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
  });

  const effectiveUserId = displayStudentId || user?.uid;
  const isClassMode = !displayStudentId && classId && hasSelection;

  const loadData = useCallback(async () => {
    if ((!effectiveUserId && !isClassMode) || !hasSelection) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      info('[StudentDashboardData] Loading data', { effectiveUserId, classId, isClassMode });

      let enrollmentsRes, attendanceRes, penaltiesRes, participationsRes, behaviorsRes, marksRes, submissionsRes;

      if (isClassMode) {
        // Fetch data for ALL students in the class
        info('[StudentDashboardData] Fetching data for ALL students in class', { classId });
        
        // Get all students in the class first
        const classStudents = await getStudentsByClass(classId);
        info('🔧 [StudentDashboardData] getStudentsByClass result:', {
          classId,
          classStudents,
          type: typeof classStudents,
          isArray: Array.isArray(classStudents),
          keys: classStudents ? Object.keys(classStudents) : 'null'
        });
        
        // Handle different return formats
        let students = [];
        if (Array.isArray(classStudents)) {
          students = classStudents;
        } else if (classStudents && classStudents.data && Array.isArray(classStudents.data)) {
          students = classStudents.data;
        } else if (classStudents && typeof classStudents === 'object') {
          students = Object.values(classStudents).filter(s => s && (s.id || s.docId));
        } else {
          warn('[StudentDashboardData] Unexpected format from getStudentsByClass:', classStudents);
          students = [];
        }
        
        const studentIds = students.map(s => s.id || s.docId).filter(Boolean);
        
        info('🔧 [StudentDashboardData] Processed students:', {
          classId,
          studentCount: studentIds.length,
          studentIds,
          sampleStudents: students.slice(0, 3)
        });

        // Fetch data for all students in parallel
        const promises = studentIds.map(studentId => 
          Promise.allSettled([
            getEnrollments({ userId: studentId }),
            getAttendanceByStudent(studentId),
            getPenalties(studentId),
            getParticipations({ studentId }),
            getBehaviors({ studentId }),
            getStudentMarks(studentId),
            getSubmissionsByUser(studentId),
          ])
        );

        const results = await Promise.all(promises);
        
        // Aggregate results from all students
        const aggregatedData = {
          enrollments: [],
          attendance: [],
          penalties: [],
          participations: [],
          behaviors: [],
          marks: [],
          submissions: [],
        };

        results.forEach((studentResults, index) => {
          const studentId = studentIds[index];
          studentResults.forEach((result, resultIndex) => {
            const dataKey = ['enrollments', 'attendance', 'penalties', 'participations', 'behaviors', 'marks', 'submissions'][resultIndex];
            if (result.status === 'fulfilled' && result.value?.data) {
              aggregatedData[dataKey].push(...result.value.data);
            }
          });
        });

        // Set the aggregated results
        enrollmentsRes = { status: 'fulfilled', value: { data: aggregatedData.enrollments } };
        attendanceRes = { status: 'fulfilled', value: { data: aggregatedData.attendance } };
        penaltiesRes = { status: 'fulfilled', value: { data: aggregatedData.penalties } };
        participationsRes = { status: 'fulfilled', value: { data: aggregatedData.participations } };
        behaviorsRes = { status: 'fulfilled', value: { data: aggregatedData.behaviors } };
        marksRes = { status: 'fulfilled', value: { data: aggregatedData.marks } };
        submissionsRes = { status: 'fulfilled', value: { data: aggregatedData.submissions } };

        // Add localized labels for class mode data
        aggregatedData.participations = aggregatedData.participations.map(p => ({
          ...p,
          label: getLocalizedActionLabel('participation', p.type, t, lang)
        }));

        aggregatedData.behaviors = aggregatedData.behaviors.map(b => ({
          ...b,
          label: getLocalizedActionLabel('behavior', b.type, t, lang)
        }));

        aggregatedData.penalties = aggregatedData.penalties.map(p => ({
          ...p,
          label: getLocalizedActionLabel('penalty', p.penaltyType, t, lang)
        }));

      } else {
        // Original single student logic
        [
          enrollmentsRes,
          attendanceRes,
          penaltiesRes,
          participationsRes,
          behaviorsRes,
          marksRes,
          submissionsRes,
        ] = await Promise.allSettled([
          getEnrollments({ userId: effectiveUserId }),
          getAttendanceByStudent(effectiveUserId),
          getPenalties(effectiveUserId),
          getParticipations({ studentId: effectiveUserId }),
          getBehaviors({ studentId: effectiveUserId }),
          getStudentMarks(effectiveUserId),
          getSubmissionsByUser(effectiveUserId),
        ]);
      }

      const enrollments = enrollmentsRes.status === 'fulfilled' ? (enrollmentsRes.value?.data || []) : [];
      const attendance = attendanceRes.status === 'fulfilled' ? (attendanceRes.value?.data || []) : [];
      const penalties = penaltiesRes.status === 'fulfilled' ? (penaltiesRes.value?.data || []) : [];
      const participations = participationsRes.status === 'fulfilled' ? (participationsRes.value?.data || []) : [];
      const behaviors = behaviorsRes.status === 'fulfilled' ? (behaviorsRes.value?.data || []) : [];
      const marks = marksRes.status === 'fulfilled' ? (marksRes.value?.data || []) : [];
      const submissions = submissionsRes.status === 'fulfilled' ? (submissionsRes.value?.data || []) : [];

      // Add localized labels to action types
      const participationsWithLabels = participations.map(p => ({
        ...p,
        label: getLocalizedActionLabel('participation', p.type, t, lang)
      }));

      const behaviorsWithLabels = behaviors.map(b => ({
        ...b,
        label: getLocalizedActionLabel('behavior', b.type, t, lang)
      }));

      const penaltiesWithLabels = penalties.map(p => ({
        ...p,
        label: getLocalizedActionLabel('penalty', p.penaltyType, t, lang)
      }));

      // Load activities for all enrolled classes
      const classIds = [...new Set(enrollments.map(e => e.classId).filter(Boolean))];
      let activities = [];
      if (classIds.length > 0) {
        try {
          const activitiesRes = await getActivitiesByClasses(classIds);
          activities = activitiesRes?.data || [];
        } catch (err) {
          error('[StudentDashboardData] Failed to load activities', err);
        }
      }

      setRawData({ enrollments, attendance, penalties: penaltiesWithLabels, participations: participationsWithLabels, behaviors: behaviorsWithLabels, marks, activities, submissions });
      
      // Comprehensive data verification logging
      const dataScope = isClassMode ? `ALL_STUDENTS_IN_CLASS (${classId})` : `SINGLE_STUDENT (${effectiveUserId})`;
      info('🔧 [StudentDashboardData] DATA LOADED - SCOPE VERIFICATION:', {
        effectiveUserId,
        classId,
        isClassMode,
        hasSelection,
        dataScope,
        '📊 DATA COUNTS': {
          enrollments: enrollments.length,
          attendance: attendance.length,
          penalties: penalties.length,
          participations: participations.length,
          behaviors: behaviors.length,
          marks: marks.length,
          activities: activities.length,
          submissions: submissions.length,
        },
        '👥 ATTENDANCE VERIFICATION': {
          totalRecords: attendance.length,
          uniqueStudents: [...new Set(attendance.map(a => a.studentId))].length,
          dateRange: {
            earliest: attendance.length > 0 ? Math.min(...attendance.map(a => new Date(a.date || a.createdAt).getTime())) : 'N/A',
            latest: attendance.length > 0 ? Math.max(...attendance.map(a => new Date(a.date || a.createdAt).getTime())) : 'N/A',
          },
          statusBreakdown: attendance.reduce((acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
          }, {}),
          sampleRecords: attendance.slice(0, 3).map(a => ({
            studentId: a.studentId,
            status: a.status,
            date: a.date,
            className: a.className
          }))
        },
        '⚠️ PENALTIES VERIFICATION': {
          totalRecords: penalties.length,
          uniqueStudents: [...new Set(penalties.map(p => p.studentId))].length,
          totalPoints: penalties.reduce((s, p) => s + (p.points || 0), 0),
          sampleRecords: penalties.slice(0, 3).map(p => ({
            studentId: p.studentId,
            points: p.points,
            type: p.type,
            date: p.date
          }))
        },
        '🎯 PARTICIPATIONS VERIFICATION': {
          totalRecords: participations.length,
          uniqueStudents: [...new Set(participations.map(p => p.studentId))].length,
          totalPoints: participations.reduce((s, p) => s + (p.points || 0), 0),
          sampleRecords: participations.slice(0, 3).map(p => ({
            studentId: p.studentId,
            points: p.points,
            type: p.type,
            date: p.date
          }))
        },
        '🔄 BEHAVIORS VERIFICATION': {
          totalRecords: behaviors.length,
          uniqueStudents: [...new Set(behaviors.map(b => b.studentId))].length,
          totalPoints: behaviors.reduce((s, b) => s + (b.points || 0), 0),
          sampleRecords: behaviors.slice(0, 3).map(b => ({
            studentId: b.studentId,
            points: b.points,
            type: b.type,
            date: b.date
          }))
        },
        '✅ EXPECTED BEHAVIOR': {
          Description: isClassMode ? 'Should show data for ALL students in class' : 'Should show data for ONE student only',
          Note: 'Class-level aggregation should show combined data from all students'
        }
      });
    } catch (err) {
      error('[StudentDashboardData] Failed to load dashboard data', err);
      setError(err);
      toast?.showError?.(t('failed_to_load_dashboard') || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, classId, isClassMode, hasSelection, toast, t, lang]);

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
      info('[StudentDashboardData] Stats calculated:', {
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
