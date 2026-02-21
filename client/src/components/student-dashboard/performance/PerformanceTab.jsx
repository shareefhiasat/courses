import React from 'react';
import { EmptyState } from '@ui';
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
  return (
    <div className={styles.container}>
      <EmptyState
        icon={getThemedIcon('ui', 'construction', 48)}
        title={t('performance.coming_soon') || (lang === 'ar' ? 'قريباً' : 'Coming Soon')}
        description={t('performance.coming_soon_description') || (lang === 'ar' ? 'هذه الميزة قيد التطوير حالياً' : 'This feature is currently under development')}
      />
    </div>
  );
});

PerformanceTab.displayName = 'PerformanceTab';
export default PerformanceTab;
