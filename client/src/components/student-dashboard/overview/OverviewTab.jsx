import React, { useMemo, useCallback, memo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { LayoutDashboard, BarChart3, ClipboardList } from 'lucide-react';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import OverviewAnalytics from './OverviewAnalytics';
import PerformanceAnalytics from '../performance/PerformanceAnalytics';
import AttendanceTab from '../attendance/AttendanceTab';
import StudentProfilePanel from '../StudentProfilePanel';
import { info, error } from '@services/utils/logger.js';
import styles from './OverviewTab.module.css';

/**
 * Overview Tab – displays role-based widgets using AdvancedAnalytics component.
 * Shows personalized widgets based on user role and context (class/student filters).
 */
const OverviewTab = memo(({
  semesters = [],
  enrollments = [],
  statsData = {},
  grouping = 'class',
  canViewAllStudents = false,
  onNavigateToClass,
  t,
  lang,
  // Additional props for widget filtering
  selectedClassId,
  selectedStudentId,
  selectedProgramId,
  selectedSubjectId,
  // Analytics props
  dashData,
  lookupData,
  isRTL,
  lastUpdatedAt,
  // Performance props (merged from PerformanceTab)
  studentId,
  classId,
  attendance,
  participations,
  penalties,
  behaviors,
  students,
  canInlineEdit,
  canDeleteRecords,
  onRefresh,
  // Student profile
  student,
}) => {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();
  const { t: tFn } = useLang();

  // Memoize title based on context
  const title = useMemo(() => {
    if (selectedStudentId) {
      const label = t('dashboard.student_overview');
      return (label && label !== 'dashboard.student overview') ? label : (lang === 'ar' ? 'نظرة عامة على الطالب' : 'Student Overview');
    }
    if (selectedClassId && selectedClassId !== 'all') {
      return lang === 'ar' ? 'نظرة عامة على الفصل' : 'Class Overview';
    }
    return lang === 'ar' ? 'نظرة عامة' : 'Overview';
  }, [selectedStudentId, selectedClassId, lang, t]);

  // Build summary text for collapsible header
  const summaryText = useMemo(() => {
    const parts = [];
    if (enrollments.length > 0) parts.push(`${enrollments.length} ${tFn('enrollments') || 'enrollments'}`);
    if (statsData.gpa > 0) parts.push(`GPA: ${statsData.gpa}`);
    if (statsData.attendanceRate > 0) parts.push(`${statsData.attendanceRate}% ${tFn('attendance') || 'attendance'}`);
    return parts.join(' · ') || (tFn('no_data') || 'No data');
  }, [enrollments, statsData, tFn]);

  // Handle widget data refresh with proper error handling
  const handleDataRefresh = useCallback(async (refreshFunction) => {
    try {
      await refreshFunction();
      info('[OverviewTab] Widgets refreshed successfully');
    } catch (err) {
      error('[OverviewTab] Error refreshing widgets:', err);
    }
  }, []);

  // Performance summary text
  const performanceSummary = useMemo(() => {
    const att = attendance?.length || 0;
    const pen = penalties?.length || 0;
    const beh = behaviors?.length || 0;
    const par = participations?.length || 0;
    return `${att} ${tFn('attendance') || 'attendance'} · ${pen} ${tFn('penalties') || 'penalties'} · ${beh} ${tFn('behaviors') || 'behaviors'} · ${par} ${tFn('participations') || 'participations'}`;
  }, [attendance, penalties, behaviors, participations, tFn]);

  return (
    <div className={styles.container}>
      {student && selectedStudentId && (
        <div data-tour="student-profile">
          <StudentProfilePanel
            student={student}
            t={t}
            lang={lang}
          />
        </div>
      )}

      <CollapsibleSection
        title={title}
        summary={summaryText}
        icon={LayoutDashboard}
        defaultOpen={false}
        testId="student-overview-analytics-section"
        storageKey="student-overview-analytics"
      >
        <OverviewAnalytics
          dashData={dashData}
          lookupData={lookupData}
          isRTL={isRTL}
          onReload={handleDataRefresh}
          lastUpdatedAt={lastUpdatedAt}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('performance_analytics')}
        summary={performanceSummary}
        icon={BarChart3}
        defaultOpen={false}
        testId="performance-analytics-section"
        storageKey="student-performance-analytics"
      >
        <PerformanceAnalytics
          dashData={dashData}
          lookupData={lookupData}
          isRTL={isRTL}
          onReload={handleDataRefresh}
          lastUpdatedAt={lastUpdatedAt}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('attendance_history')}
        summary={`${attendance?.length || 0} ${tFn('records') || 'records'}`}
        icon={ClipboardList}
        defaultOpen={false}
        testId="attendance-history-section"
        storageKey="student-attendance-history"
      >
        <AttendanceTab
          studentId={studentId}
          classId={classId}
          attendance={attendance}
          participations={participations}
          penalties={penalties}
          behaviors={behaviors}
          students={students}
          canInlineEdit={canInlineEdit}
          canDeleteRecords={canDeleteRecords}
          onRefresh={onRefresh}
          t={t}
          lang={lang}
        />
      </CollapsibleSection>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';
export default OverviewTab;
