import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getEnrollments } from '../services/business/enrollmentService';
import { getAttendanceByStudent } from '../services/business/attendanceService';
import { getPenalties } from '../services/business/penaltyService';
import { getParticipations } from '../services/business/participationService';
import { getBehaviors } from '../services/business/behaviorService';
import { getStudentMarks } from '../services/business/enrollmentMarksService';
import { getActivitiesByClasses } from '../services/business/activitiesService';
import { getSubmissionsByUser } from '../services/business/submissionsService';
import { getQuizResultsByUser } from '../services/business/quizResultsService';
import { info, error, warn, debug } from '@services/utils/logger.js';

const useDashboardData = (selectedStudentId = null) => {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLang();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    enrollments: [],
    attendance: [],
    penalties: [],
    participations: [],
    behaviors: [],
    marks: [],
    activities: [],
    submissions: [],
    quizResults: [],
    semesters: [],
    activeSemester: null
  });

  const userId = selectedStudentId || user?.uid;

  const loadDashboardData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      info('Loading dashboard data', { userId });

      const [
        enrollmentsRes,
        attendanceRes,
        penaltiesRes,
        participationsRes,
        behaviorsRes,
        marksRes,
        submissionsRes,
        quizResultsRes
      ] = await Promise.allSettled([
        getEnrollments({ userId }),
        getAttendanceByStudent(userId),
        getPenalties(userId),
        getParticipations({ studentId: userId }),
        getBehaviors({ studentId: userId }),
        getStudentMarks(userId),
        getSubmissionsByUser(userId),
        getQuizResultsByUser(userId)
      ]);

      const enrollments = enrollmentsRes.status === 'fulfilled' ? (enrollmentsRes.value?.data || []) : [];
      const attendance = attendanceRes.status === 'fulfilled' ? (attendanceRes.value?.data || []) : [];
      const penalties = penaltiesRes.status === 'fulfilled' ? (penaltiesRes.value?.data || []) : [];
      const participations = participationsRes.status === 'fulfilled' ? (participationsRes.value?.data || []) : [];
      const behaviors = behaviorsRes.status === 'fulfilled' ? (behaviorsRes.value?.data || []) : [];
      const marks = marksRes.status === 'fulfilled' ? (marksRes.value?.data || []) : [];
      const submissions = submissionsRes.status === 'fulfilled' ? (submissionsRes.value?.data || []) : [];
      const quizResults = quizResultsRes.status === 'fulfilled' ? (quizResultsRes.value?.data || []) : [];

      const classIds = [...new Set(enrollments.map(e => e.classId).filter(Boolean))];
      let activities = [];
      
      if (classIds.length > 0) {
        try {
          const activitiesRes = await getActivitiesByClasses(classIds);
          activities = activitiesRes?.data || [];
        } catch (error) {
          error('Failed to load activities', error);
        }
      }

      const timelineData = transformToTimeline({
        enrollments,
        attendance,
        penalties,
        participations,
        behaviors,
        marks,
        activities,
        submissions,
        quizResults
      });

      setDashboardData({
        enrollments,
        attendance,
        penalties,
        participations,
        behaviors,
        marks,
        activities,
        submissions,
        quizResults,
        ...timelineData
      });

      info('Dashboard data loaded successfully', { 
        enrollmentsCount: enrollments.length,
        semestersCount: timelineData.semesters.length 
      });

    } catch (error) {
      error('Failed to load dashboard data', error);
      toast?.showError?.(t('failed_to_load_dashboard') || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [userId, toast, t]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...dashboardData,
    loading,
    reload: loadDashboardData
  };
};

const transformToTimeline = (data) => {
  const semesterMap = new Map();

  data.enrollments.forEach(enrollment => {
    const semester = enrollment.semester || 'Unknown';
    const year = enrollment.academicYear || enrollment.year || new Date().getFullYear();
    const key = `${semester}-${year}`;

    if (!semesterMap.has(key)) {
      semesterMap.set(key, {
        id: key,
        semester,
        year,
        courses: [],
        stats: {
          totalCourses: 0,
          completedCourses: 0,
          gpa: 0,
          totalCredits: 0,
          attendanceRate: 0
        },
        status: 'active',
        courseCount: 0
      });
    }

    const semesterData = semesterMap.get(key);
    const courseMarks = data.marks.find(m => m.enrollmentId === enrollment.id || m.enrollmentId === enrollment.docId);
    const courseAttendance = data.attendance.filter(a => a.classId === enrollment.classId);
    
    const presentCount = courseAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = courseAttendance.length > 0 ? (presentCount / courseAttendance.length) * 100 : 0;

    semesterData.courses.push({
      ...enrollment,
      marks: courseMarks,
      grade: courseMarks?.grade,
      mark: courseMarks?.totalMarks,
      totalMarks: courseMarks?.totalMarks,
      attendance: courseAttendance,
      attendanceRate,
      activities: data.activities.filter(a => a.classId === enrollment.classId),
      submissions: data.submissions.filter(s => s.classId === enrollment.classId),
      quizResults: data.quizResults.filter(q => q.classId === enrollment.classId),
      completionRate: courseMarks?.totalMarks || 0
    });
  });

  semesterMap.forEach((semester, key) => {
    semester.courseCount = semester.courses.length;
    semester.stats = calculateSemesterStats(semester.courses);
    semester.gpa = semester.stats.gpa;
    
    const allCompleted = semester.courses.every(c => c.status === 'completed');
    semester.status = allCompleted ? 'completed' : 'active';
  });

  const semesters = Array.from(semesterMap.values());
  const currentSemester = getCurrentSemester(semesters);

  const allActivities = mergeActivities(data);

  return {
    semesters,
    activeSemester: currentSemester,
    allActivities
  };
};

const calculateSemesterStats = (courses) => {
  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.status === 'completed').length;

  const gradesWithPoints = courses
    .filter(c => c.marks?.grade && c.marks?.points !== undefined)
    .map(c => ({ 
      points: c.marks.points, 
      credits: c.credits || 3 
    }));

  const totalPoints = gradesWithPoints.reduce((sum, g) => sum + (g.points * g.credits), 0);
  const totalCredits = gradesWithPoints.reduce((sum, g) => sum + g.credits, 0);
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  const attendanceRecords = courses.flatMap(c => c.attendance || []);
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
  const attendanceRate = attendanceRecords.length > 0 
    ? (presentCount / attendanceRecords.length) * 100 
    : 0;

  return {
    totalCourses,
    completedCourses,
    gpa: parseFloat(gpa.toFixed(2)),
    totalCredits,
    attendanceRate: parseFloat(attendanceRate.toFixed(1))
  };
};

const getCurrentSemester = (semesters) => {
  if (!semesters || semesters.length === 0) return null;
  
  const activeSemesters = semesters.filter(s => s.status === 'active');
  if (activeSemesters.length > 0) {
    return activeSemesters[activeSemesters.length - 1].id;
  }
  
  return semesters[semesters.length - 1].id;
};

const mergeActivities = (data) => {
  const activities = [];

  data.penalties.forEach(p => {
    activities.push({
      ...p,
      category: 'penalty',
      type: p.type,
      timestamp: p.date,
      description: p.reason || p.notes
    });
  });

  data.participations.forEach(p => {
    activities.push({
      ...p,
      category: 'participation',
      type: p.type,
      timestamp: p.date,
      description: p.notes || p.description
    });
  });

  data.behaviors.forEach(b => {
    activities.push({
      ...b,
      category: 'behavior',
      type: b.type,
      timestamp: b.date,
      description: b.notes || b.description
    });
  });

  data.attendance.forEach(a => {
    if (a.status === 'absent') {
      activities.push({
        ...a,
        category: 'absence',
        type: 'absence',
        timestamp: a.date,
        description: a.notes || 'Absent'
      });
    }
  });

  return activities;
};

export default useDashboardData;
