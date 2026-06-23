import React, { useMemo, useCallback, memo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import { Users, LayoutDashboard } from 'lucide-react';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import ClassAnalytics from './ClassAnalytics';
import { info, error } from '@services/utils/logger.js';
import styles from './ClassTab.module.css';

/**
 * Class Tab – displays class-level metrics when a class is selected.
 * Visible for Super Admin, HR, Instructor (own classes), Admin (scoped access).
 * Hidden for students.
 */
const ClassTab = memo(({
  classId,
  classMetrics,
  classRawData,
  loading,
  error,
  onReload,
  t,
  lang,
  // Additional props for widget filtering
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
    return lang === 'ar' ? 'تحليلات الفصل' : 'Class Analytics';
  }, [lang]);

  // Build summary text for collapsible header
  const summaryText = useMemo(() => {
    if (!classMetrics || loading) {
      return tFn('loading') || 'Loading...';
    }
    const parts = [];
    if (classMetrics.totalStudents > 0) parts.push(`${classMetrics.totalStudents} ${tFn('students') || 'students'}`);
    if (classMetrics.averageAttendance > 0) parts.push(`${classMetrics.averageAttendance}% ${tFn('attendance') || 'attendance'}`);
    if (classMetrics.averageGPA > 0) parts.push(`GPA: ${classMetrics.averageGPA}`);
    if (classMetrics.totalPenalties > 0) parts.push(`${classMetrics.totalPenalties} ${tFn('penalties') || 'penalties'}`);
    if (classMetrics.totalParticipations > 0) parts.push(`${classMetrics.totalParticipations} ${tFn('participations') || 'participations'}`);
    return parts.join(' · ') || (tFn('no_data') || 'No data');
  }, [classMetrics, loading, tFn]);

  // Handle widget data refresh with proper error handling
  const handleDataRefresh = useCallback(async (refreshFunction) => {
    try {
      await refreshFunction();
      info('[ClassTab] Widgets refreshed successfully');
    } catch (err) {
      error('[ClassTab] Error refreshing widgets:', err);
    }
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <CollapsibleSection
          title={title}
          summary={tFn('loading') || 'Loading...'}
          icon={Users}
          defaultOpen
          testId="class-analytics-section"
        >
          <div className={styles.loading}>{tFn('loading') || 'Loading...'}</div>
        </CollapsibleSection>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.container}>
        <CollapsibleSection
          title={title}
          summary={tFn('error') || 'Error'}
          icon={Users}
          defaultOpen
          testId="class-analytics-section"
        >
          <div className={styles.error}>
            {tFn('failed_to_load_class_metrics') || 'Failed to load class metrics'}
          </div>
        </CollapsibleSection>
      </div>
    );
  }

  // Show no class selected state
  if (!classId || classId === 'all') {
    return (
      <div className={styles.container}>
        <CollapsibleSection
          title={title}
          summary={tFn('select_class_to_view') || 'Select a class to view metrics'}
          icon={Users}
          defaultOpen
          testId="class-analytics-section"
        >
          <div className={styles.empty}>
            {tFn('select_class_to_view') || 'Select a class to view metrics'}
          </div>
        </CollapsibleSection>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CollapsibleSection
        title={title}
        summary={summaryText}
        icon={Users}
        defaultOpen
        testId="class-analytics-section"
      >
        <ClassAnalytics
          classId={classId}
          classMetrics={classMetrics}
          classRawData={classRawData}
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

ClassTab.displayName = 'ClassTab';
export default ClassTab;
