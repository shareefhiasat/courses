import React, { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Badge, EmptyState, ProgressBar } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './PerformanceTab.module.css';

/**
 * Performance Tab – aggregated view of marks, attendance, and engagement.
 * Students see their own metrics. Staff see class-level context (no peer ranking).
 */
const PerformanceTab = React.memo(({
  marks = [],
  enrollments = [],
  attendance = [],
  participations = [],
  penalties = [],
  behaviors = [],
  statsData = {},
  canSeeClassDistributions = false,
  t,
  lang,
}) => {
  const { theme } = useTheme();

  // Per-course performance breakdown
  const coursePerformance = useMemo(() => {
    return enrollments.map(enrollment => {
      const classId = enrollment.classId;
      const courseMark = marks.find(
        m => m.enrollmentId === enrollment.id || m.enrollmentId === enrollment.docId
      );
      const courseAttendance = attendance.filter(a => a.classId === classId);
      const presentCount = courseAttendance.filter(a => a.status === 'present').length;
      const lateCount = courseAttendance.filter(a => a.status === 'late').length;
      const attendanceRate = courseAttendance.length > 0
        ? ((presentCount + lateCount) / courseAttendance.length) * 100
        : 0;

      const courseParticipations = participations.filter(p => p.classId === classId).length;
      const coursePenalties = penalties.filter(p => p.classId === classId).length;
      const courseBehaviors = behaviors.filter(b => b.classId === classId).length;

      const name = lang === 'ar'
        ? (enrollment.className_ar || enrollment.className || enrollment.courseName || '')
        : (enrollment.className || enrollment.courseName || '');

      return {
        id: enrollment.id || enrollment.docId,
        classId,
        name,
        grade: courseMark?.grade || '—',
        totalMarks: courseMark?.totalMarks,
        points: courseMark?.points,
        attendanceRate,
        totalAttendance: courseAttendance.length,
        participations: courseParticipations,
        penalties: coursePenalties,
        behaviors: courseBehaviors,
        netScore: courseParticipations - coursePenalties,
      };
    });
  }, [enrollments, marks, attendance, participations, penalties, behaviors, lang]);

  const getGradeColor = (grade) => {
    if (!grade || grade === '—') return 'default';
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'info';
    if (grade.startsWith('C')) return 'warning';
    return 'danger';
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'danger';
  };

  if (coursePerformance.length === 0) {
    return (
      <EmptyState
        title={t('performance.no_data') || (lang === 'ar' ? 'لا توجد بيانات أداء' : 'No performance data available')}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Summary KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard} data-color="purple">
          <div className={styles.kpiIcon}>
            {getThemedIcon('ui', 'award', 20, theme)}
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>{t('performance.overall_gpa') || 'Overall GPA'}</span>
            <span className={styles.kpiValue}>{statsData.gpa ?? '—'}</span>
          </div>
        </div>

        <div className={styles.kpiCard} data-color="green">
          <div className={styles.kpiIcon}>
            {getThemedIcon('ui', 'check_circle', 20, theme)}
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>{t('performance.attendance_rate') || 'Attendance Rate'}</span>
            <span className={styles.kpiValue}>{statsData.attendanceRate ?? 0}%</span>
          </div>
        </div>

        <div className={styles.kpiCard} data-color="blue">
          <div className={styles.kpiIcon}>
            {getThemedIcon('ui', 'zap', 20, theme)}
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>{t('performance.participations') || 'Participations'}</span>
            <span className={styles.kpiValue}>{statsData.participations ?? 0}</span>
          </div>
        </div>

        <div className={styles.kpiCard} data-color="orange">
          <div className={styles.kpiIcon}>
            {getThemedIcon('ui', 'trending_up', 20, theme)}
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>{t('performance.net_score') || 'Net Score'}</span>
            <span className={styles.kpiValue}>
              {statsData.netScore >= 0 ? '+' : ''}{statsData.netScore ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Per-course breakdown */}
      <div className={styles.sectionTitle}>
        {getThemedIcon('ui', 'bar_chart_2', 16, theme)}
        <span>{t('performance.course_breakdown') || 'Course Breakdown'}</span>
      </div>

      <div className={styles.courseList}>
        {coursePerformance.map(course => (
          <div key={course.id} className={styles.courseCard}>
            <div className={styles.courseHeader}>
              <span className={styles.courseName}>{course.name || '—'}</span>
              <div className={styles.courseBadges}>
                {course.grade !== '—' && (
                  <Badge variant={getGradeColor(course.grade)} size="sm">
                    {course.grade}
                  </Badge>
                )}
                {course.totalMarks !== undefined && (
                  <Badge variant="default" size="sm">
                    {course.totalMarks}%
                  </Badge>
                )}
              </div>
            </div>

            <div className={styles.courseMetrics}>
              {/* Attendance progress bar */}
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>
                  {t('attendance') || 'Attendance'}
                </span>
                <div className={styles.metricBar}>
                  <ProgressBar
                    value={course.attendanceRate}
                    max={100}
                    variant={getAttendanceColor(course.attendanceRate)}
                    size="sm"
                  />
                </div>
                <span className={styles.metricValue}>
                  {course.attendanceRate.toFixed(1)}%
                </span>
              </div>

              {/* Engagement chips */}
              <div className={styles.engagementRow}>
                <span className={styles.engagementChip} data-type="participation">
                  {getThemedIcon('ui', 'zap', 12, theme)}
                  {course.participations}
                </span>
                <span className={styles.engagementChip} data-type="penalty">
                  {getThemedIcon('ui', 'alert_circle', 12, theme)}
                  {course.penalties}
                </span>
                <span className={styles.engagementChip} data-type="behavior">
                  {getThemedIcon('ui', 'activity', 12, theme)}
                  {course.behaviors}
                </span>
                <span className={`${styles.engagementChip} ${course.netScore >= 0 ? styles.positive : styles.negative}`}>
                  {getThemedIcon('ui', 'trending_up', 12, theme)}
                  {course.netScore >= 0 ? '+' : ''}{course.netScore}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

PerformanceTab.displayName = 'PerformanceTab';
export default PerformanceTab;
