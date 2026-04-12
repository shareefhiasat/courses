import React from 'react';
import { EmptyState } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './MarksTab.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Marks Tab – read-only view of student marks grouped by semester.
 * Staff roles get a deep-link button to the marks entry page.
 */
const MarksTab = React.memo(({
  marks = [],
  semesters = [],
  statsData = {},
  canNavigateToMarksEntry = false,
  studentId,
  t,
  lang,
}) => {
  return (
    <div className={styles.container}>
      <EmptyState
        icon={getThemedIcon('ui', 'construction', 48)}
        title={t('marks.coming_soon') || (lang === 'ar' ? 'قريباً' : 'Coming Soon')}
        description={t('marks.coming_soon_description') || (lang === 'ar' ? 'هذه الميزة قيد التطوير حالياً' : 'This feature is currently under development')}
      />
    </div>
  );
});

MarksTab.displayName = 'MarksTab';
export default MarksTab;
