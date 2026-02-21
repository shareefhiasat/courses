import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import EnhancedStatsCard from './EnhancedStatsCard';
import styles from './EnhancedStatsSection.module.css';

const EnhancedStatsSection = React.memo(({ 
  statsData, 
  classMetrics, 
  isStaff, 
  selectedStudentId,
  dashData 
}) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();

  const isClassView = isStaff && !selectedStudentId;

  const getAttendanceData = () => {
    if (isClassView) {
      // For class view, we need to aggregate attendance data
      return {
        presentCount: Math.round((classMetrics.averageAttendance / 100) * (classMetrics.totalStudents * 20)), // Assuming ~20 classes per student
        absentCount: Math.round(((100 - classMetrics.averageAttendance) / 100) * (classMetrics.totalStudents * 20) * 0.7),
        lateCount: Math.round(((100 - classMetrics.averageAttendance) / 100) * (classMetrics.totalStudents * 20) * 0.3),
      };
    }
    return {
      presentCount: statsData.presentCount,
      absentCount: statsData.absentCount,
      lateCount: statsData.lateCount,
    };
  };

  const getGPAData = () => {
    if (isClassView) {
      // For class view, create sample GPA distribution
      return [
        { name: 'A', gpa: 4.0, grade: 'A', count: Math.round(classMetrics.totalStudents * 0.2) },
        { name: 'B', gpa: 3.0, grade: 'B', count: Math.round(classMetrics.totalStudents * 0.3) },
        { name: 'C', gpa: 2.0, grade: 'C', count: Math.round(classMetrics.totalStudents * 0.3) },
        { name: 'D', gpa: 1.0, grade: 'D', count: Math.round(classMetrics.totalStudents * 0.15) },
        { name: 'F', gpa: 0.0, grade: 'F', count: Math.round(classMetrics.totalStudents * 0.05) },
      ];
    }
    // For individual student, show GPA by course/semester
    return dashData.semesters.map(semester => ({
      name: semester.semester,
      gpa: semester.gpa || 0,
      grade: semester.status === 'completed' ? 'Completed' : 'Active'
    }));
  };

  const getNetScoreData = () => {
    return {
      participationPoints: statsData.participationPoints,
      penaltyPoints: statsData.penaltyPoints,
    };
  };

  const attendanceData = getAttendanceData();
  const gpaData = getGPAData();
  const netScoreData = getNetScoreData();

  return (
    <div className={styles.enhancedStatsSection} data-theme={theme}>
      <div className={styles.statsGrid}>
        
        {/* Attendance Card */}
        <EnhancedStatsCard
          type="attendance"
          value={attendanceData.presentCount}
          data={attendanceData}
          title={t('dashboard.attendance') || (lang === 'ar' ? 'الحضور' : 'Attendance')}
          icon={getThemedIcon('ui', 'calendar', 20, theme)}
          showChart={true}
          isStaff={isStaff}
          selectedStudentId={selectedStudentId}
        />

        {/* GPA Card */}
        <EnhancedStatsCard
          type="gpa"
          value={isClassView ? classMetrics.averageGPA : statsData.gpa}
          data={gpaData}
          title={t('dashboard.gpa') || (lang === 'ar' ? 'المعدل' : 'GPA')}
          icon={getThemedIcon('ui', 'award', 20, theme)}
          showChart={true}
          isStaff={isStaff}
          selectedStudentId={selectedStudentId}
        />

        {/* Net Score Card */}
        <EnhancedStatsCard
          type="netScore"
          value={statsData.netScore}
          data={netScoreData}
          title={t('dashboard.net_score') || (lang === 'ar' ? 'الصافي' : 'Net Score')}
          icon={getThemedIcon('ui', 'trending_up', 20, theme)}
          showChart={true}
          isStaff={isStaff}
          selectedStudentId={selectedStudentId}
        />

        {/* Participations Card */}
        <EnhancedStatsCard
          type="participations"
          value={isClassView ? classMetrics.totalParticipations : statsData.participations}
          data={null}
          title={t('dashboard.participations') || (lang === 'ar' ? 'المشاركات' : 'Participations')}
          icon={getThemedIcon('ui', 'users', 20, theme)}
          showChart={false}
          isStaff={isStaff}
          selectedStudentId={selectedStudentId}
        />

        {/* Penalties Card */}
        <EnhancedStatsCard
          type="penalties"
          value={isClassView ? classMetrics.totalPenalties : statsData.penalties}
          data={null}
          title={t('dashboard.penalties') || (lang === 'ar' ? 'العقوبات' : 'Penalties')}
          icon={getThemedIcon('ui', 'alert_circle', 20, theme)}
          showChart={false}
          isStaff={isStaff}
          selectedStudentId={selectedStudentId}
        />

        {/* Behaviors Card */}
        <EnhancedStatsCard
          type="behaviors"
          value={isClassView ? classMetrics.totalBehaviors : statsData.behaviors}
          data={null}
          title={t('dashboard.behaviors') || (lang === 'ar' ? 'السلوك' : 'Behaviors')}
          icon={getThemedIcon('ui', 'activity', 20, theme)}
          showChart={false}
          isStaff={isStaff}
          selectedStudentId={selectedStudentId}
        />

      </div>

      {/* Additional Insights Section */}
      <div className={styles.insightsSection}>
        <h3 className={styles.insightsTitle}>
          {getThemedIcon('ui', 'bar_chart_2', 16, theme)}
          {t('dashboard.insights') || (lang === 'ar' ? 'رؤى تحليلية' : 'Insights')}
        </h3>
        
        <div className={styles.insightsGrid}>
          {/* Performance Trend */}
          <div className={styles.insightCard}>
            <h4>{t('dashboard.performance_trend') || (lang === 'ar' ? 'اتجاه الأداء' : 'Performance Trend')}</h4>
            <p className={styles.insightValue}>
              {statsData.gpa >= 3.0 ? 
                (t('dashboard.excellent_performance') || (lang === 'ar' ? 'أداء ممتاز' : 'Excellent Performance')) :
                statsData.gpa >= 2.0 ?
                (t('dashboard.good_performance') || (lang === 'ar' ? 'أداء جيد' : 'Good Performance')) :
                (t('dashboard.needs_improvement') || (lang === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement'))
              }
            </p>
          </div>

          {/* Attendance Status */}
          <div className={styles.insightCard}>
            <h4>{t('dashboard.attendance_status') || (lang === 'ar' ? 'حالة الحضور' : 'Attendance Status')}</h4>
            <p className={styles.insightValue}>
              {statsData.attendanceRate >= 90 ? 
                (t('dashboard.excellent_attendance') || (lang === 'ar' ? 'حضور ممتاز' : 'Excellent Attendance')) :
                statsData.attendanceRate >= 75 ?
                (t('dashboard.good_attendance') || (lang === 'ar' ? 'حضور جيد' : 'Good Attendance')) :
                (t('dashboard.attendance_concern') || (lang === 'ar' ? 'مخاوف الحضور' : 'Attendance Concern'))
              }
            </p>
          </div>

          {/* Engagement Level */}
          <div className={styles.insightCard}>
            <h4>{t('dashboard.engagement_level') || (lang === 'ar' ? 'مستوى المشاركة' : 'Engagement Level')}</h4>
            <p className={styles.insightValue}>
              {statsData.netScore >= 10 ? 
                (t('dashboard.highly_engaged') || (lang === 'ar' ? 'مشارك عالٍ' : 'Highly Engaged')) :
                statsData.netScore >= 0 ?
                (t('dashboard.moderately_engaged') || (lang === 'ar' ? 'مشارك متوسط' : 'Moderately Engaged')) :
                (t('dashboard.needs_more_engagement') || (lang === 'ar' ? 'يحتاج مشاركة أكثر' : 'Needs More Engagement'))
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

EnhancedStatsSection.displayName = 'EnhancedStatsSection';
export default EnhancedStatsSection;
