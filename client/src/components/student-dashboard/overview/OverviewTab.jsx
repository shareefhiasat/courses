import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { EmptyState, Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './OverviewTab.module.css';

/**
 * Overview Tab – shows classes grouped by the active grouping mode.
 * For students: their enrolled classes.
 * For staff: classes in the selected context.
 */
const OverviewTab = React.memo(({
  semesters = [],
  enrollments = [],
  statsData = {},
  grouping = 'class',
  canViewAllStudents = false,
  onNavigateToClass,
  t,
  lang,
}) => {
  const { theme } = useTheme();

  return (
    <div className={styles.container}>
      <EmptyState
        title={t('overview.no_courses_found') || (lang === 'ar' ? 'لا توجد مقررات مسجلة' : 'No enrolled courses found')}
      />
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';
export default OverviewTab;
