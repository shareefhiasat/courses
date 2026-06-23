import React, { useMemo, useCallback, memo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { LayoutDashboard } from 'lucide-react';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import OverviewAnalytics from './OverviewAnalytics';
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

  return (
    <div className={styles.container}>
      <CollapsibleSection
        title={title}
        summary={summaryText}
        icon={LayoutDashboard}
        defaultOpen
        testId="student-overview-analytics-section"
      >
        <OverviewAnalytics
          dashData={dashData}
          lookupData={lookupData}
          isRTL={isRTL}
          onReload={handleDataRefresh}
          lastUpdatedAt={lastUpdatedAt}
        />
      </CollapsibleSection>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';
export default OverviewTab;
