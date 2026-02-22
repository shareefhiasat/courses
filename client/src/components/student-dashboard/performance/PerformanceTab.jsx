import React, { useMemo, useCallback, memo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useAuth } from '@contexts/AuthContext';
import AdvancedAnalyticsWithRoleSupport from '@components/AdvancedAnalyticsWithRoleSupport';
import logger from '@utils/logger';
import styles from './PerformanceTab.module.css';

/**
 * Performance Tab – displays role-based performance widgets using AdvancedAnalytics.
 * Shows detailed analytics and performance metrics based on user role.
 */
const PerformanceTab = memo(({
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
    
    logger.log('[PerformanceTab] Global filters applied:', filters);
    return filters;
  }, [selectedClassId, selectedStudentId, selectedProgramId, selectedSubjectId]);

  // Generate storage key for this dashboard
  const storageKey = useMemo(() => {
    const role = userProfile?.role || user?.role || 'student';
    return `student_dashboard_performance_${role}`;
  }, [userProfile, user]);

  // Memoize title based on context
  const title = useMemo(() => {
    if (selectedStudentId) {
      return t('dashboard.student_performance') || (lang === 'ar' ? 'أداء الطالب' : 'Student Performance');
    }
    if (selectedClassId && selectedClassId !== 'all') {
      return t('dashboard.class_performance') || (lang === 'ar' ? 'أداء الفصل' : 'Class Performance');
    }
    return t('dashboard.performance') || (lang === 'ar' ? 'الأداء' : 'Performance');
  }, [selectedStudentId, selectedClassId, lang, t]);

  // Handle widget data refresh with proper error handling
  const handleDataRefresh = useCallback(async (refreshFunction) => {
    try {
      await refreshFunction();
      logger.log('[PerformanceTab] Widgets refreshed successfully');
    } catch (error) {
      logger.error('[PerformanceTab] Error refreshing widgets:', error);
    }
  }, []);

  return (
    <div className={styles.container}>
      <AdvancedAnalyticsWithRoleSupport
        title={title}
        storageKey={storageKey}
        globalFilters={globalFilters}
        dashboard="performance"
        enableCustomization={true}
        showFilters={false} // Filters are handled by parent component
      />
    </div>
  );
});

PerformanceTab.displayName = 'PerformanceTab';
export default PerformanceTab;
