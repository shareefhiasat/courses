import React, { useMemo, useCallback, memo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import AdvancedAnalyticsWithRoleSupport from '@components/AdvancedAnalyticsWithRoleSupport';
import logger from '@utils/logger';
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
  selectedSubjectId
}) => {
  const { theme } = useTheme();
  const { user, userProfile } = useAuth();

  // Memoize global filters to prevent unnecessary re-renders
  const globalFilters = useMemo(() => {
    const filters = {};
    
    if (selectedClassId && selectedClassId !== 'all') {
      filters.classId = selectedClassId;
    }
    
    if (selectedStudentId) {
      filters.studentId = selectedStudentId;
    }
    
    if (selectedProgramId) {
      filters.programId = selectedProgramId;
    }
    
    if (selectedSubjectId) {
      filters.subjectId = selectedSubjectId;
    }
    
    logger.log('[OverviewTab] Global filters applied:', filters);
    return filters;
  }, [selectedClassId, selectedStudentId, selectedProgramId, selectedSubjectId]);

  // Generate storage key for this dashboard
  const storageKey = useMemo(() => {
    const role = userProfile?.role || user?.role || 'student';
    return `student_dashboard_overview_${role}`;
  }, [userProfile, user]);

  // Memoize title based on context
  const title = useMemo(() => {
    if (selectedStudentId) {
      return t('dashboard.student_overview') || (lang === 'ar' ? 'نظرة عامة على الطالب' : 'Student Overview');
    }
    if (selectedClassId && selectedClassId !== 'all') {
      return t('dashboard.class_overview') || (lang === 'ar' ? 'نظرة عامة على الفصل' : 'Class Overview');
    }
    return t('dashboard.overview') || (lang === 'ar' ? 'نظرة عامة' : 'Overview');
  }, [selectedStudentId, selectedClassId, lang, t]);

  // Handle widget data refresh with proper error handling
  const handleDataRefresh = useCallback(async (refreshFunction) => {
    try {
      await refreshFunction();
      logger.log('[OverviewTab] Widgets refreshed successfully');
    } catch (error) {
      logger.error('[OverviewTab] Error refreshing widgets:', error);
    }
  }, []);

  return (
    <div className={styles.container}>
      <AdvancedAnalyticsWithRoleSupport
        title={title}
        storageKey={storageKey}
        globalFilters={globalFilters}
        dashboard="overview"
        enableCustomization={true}
        showFilters={false} // Filters are handled by parent component
      />
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';
export default OverviewTab;
