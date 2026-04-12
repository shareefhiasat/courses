import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@ui';
import { useLang } from '@contexts/LangContext';
import { getClasses } from '@services/business/classService';
import { getEnrollments } from '@services/business/enrollmentService';
import { getAttendanceByClass } from '@services/business/attendanceService';
import { getPenalties } from '@services/business/penaltyService';
import { getBehaviors } from '@services/business/behaviorService';
import { getParticipations } from '@services/business/participationService';
import { info, error, warn, debug } from '@services/utils/logger.js';

/**
 * Hook for fetching class-level metrics when no specific student is selected.
 * Follows LMS architectural guidelines for service layer separation.
 * 
 * @param {string|null} classId - The class ID to fetch metrics for
 * @param {boolean} shouldLoad - Whether to load data (prevents unnecessary calls)
 */
const useClassLevelMetrics = (classId, shouldLoad = true) => {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLang();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    totalPenalties: 0,
    totalBehaviors: 0,
    totalParticipations: 0,
    averageGPA: 0,
    classDistribution: {},
    recentActivity: []
  });

  const loadClassMetrics = useCallback(async () => {
    if (!classId || !shouldLoad) {
      setLoading(false);
      setMetrics({
        totalStudents: 0,
        averageAttendance: 0,
        totalPenalties: 0,
        totalBehaviors: 0,
        totalParticipations: 0,
        averageGPA: 0,
        classDistribution: {},
        recentActivity: []
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      info('[ClassLevelMetrics] Loading metrics for class:', classId);

      const [
        classRes,
        enrollmentsRes,
        attendanceRes,
        penaltiesRes,
        behaviorsRes,
        participationsRes
      ] = await Promise.allSettled([
        getClasses(),
        getEnrollments({ classId }),
        getAttendanceByClass(classId),
        getPenalties({ classId }),
        getBehaviors({ classId }),
        getParticipations({ classId })
      ]);

      const classes = classRes.status === 'fulfilled' ? (classRes.value?.data || []) : [];
      const enrollments = enrollmentsRes.status === 'fulfilled' ? (enrollmentsRes.value?.data || []) : [];
      const attendance = attendanceRes.status === 'fulfilled' ? (attendanceRes.value?.data || []) : [];
      const penalties = penaltiesRes.status === 'fulfilled' ? (penaltiesRes.value?.data || []) : [];
      const behaviors = behaviorsRes.status === 'fulfilled' ? (behaviorsRes.value?.data || []) : [];
      const participations = participationsRes.status === 'fulfilled' ? (participationsRes.value?.data || []) : [];

      info('[ClassLevelMetrics] Raw data:', {
        classes: classes.length,
        enrollments: enrollments.length,
        attendance: attendance.length,
        penalties: penalties.length,
        behaviors: behaviors.length,
        participations: participations.length
      });

      // Calculate metrics
      const totalStudents = enrollments.length;
      
      // Average attendance rate
      const attendanceRates = enrollments.map(enrollment => {
        const studentAttendance = attendance.filter(a => a.studentId === enrollment.studentId);
        if (studentAttendance.length === 0) return 0;
        const presentCount = studentAttendance.filter(a => a.status === 'present').length;
        return (presentCount / studentAttendance.length) * 100;
      });
      const averageAttendance = attendanceRates.length > 0 
        ? attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length 
        : 0;

      // Calculate average GPA
      const gradesWithPoints = enrollments
        .filter(e => e.grade && e.points !== undefined)
        .map(e => ({ points: e.points, credits: e.credits || 3 }));
      const totalPoints = gradesWithPoints.reduce((sum, g) => sum + g.points * g.credits, 0);
      const totalCredits = gradesWithPoints.reduce((sum, g) => sum + g.credits, 0);
      const averageGPA = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;

      // Class distribution by grade
      const classDistribution = enrollments.reduce((dist, enrollment) => {
        const grade = enrollment.grade || 'N/A';
        dist[grade] = (dist[grade] || 0) + 1;
        return dist;
      }, {});

      // Recent activity (last 10 items)
      const recentActivity = [
        ...attendance.slice(-5).map(a => ({ ...a, type: 'attendance', timestamp: a.date })),
        ...penalties.slice(-3).map(p => ({ ...p, type: 'penalty', timestamp: p.createdAt })),
        ...behaviors.slice(-2).map(b => ({ ...b, type: 'behavior', timestamp: b.createdAt }))
      ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

      const calculatedMetrics = {
        totalStudents,
        averageAttendance: parseFloat(averageAttendance.toFixed(1)),
        totalPenalties: penalties.length,
        totalBehaviors: behaviors.length,
        totalParticipations: participations.length,
        averageGPA,
        classDistribution,
        recentActivity
      };

      setMetrics(calculatedMetrics);
      
      info('[ClassLevelMetrics] Metrics calculated:', calculatedMetrics);
    } catch (err) {
      error('[ClassLevelMetrics] Failed to load class metrics', err);
      setError(err);
      toast?.showError?.(t('failed_to_load_class_metrics') || 'Failed to load class metrics');
    } finally {
      setLoading(false);
    }
  }, [classId, shouldLoad, toast, t]);

  useEffect(() => {
    loadClassMetrics();
  }, [loadClassMetrics]);

  return {
    metrics,
    loading,
    error,
    reload: loadClassMetrics
  };
};

export default useClassLevelMetrics;
