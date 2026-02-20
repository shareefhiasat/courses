import React, { useMemo, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Badge, EmptyState } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { getTypeLabel, TYPE_CATEGORIES } from '@utils/sharedTypes';
import styles from './RecordsTab.module.css';

const TYPE_CONFIG = {
  penalties: {
    badgeVariant: 'danger',
    icon: 'alert_circle',
    category: TYPE_CATEGORIES?.PENALTY || 'penalty',
    emptyKey: 'no_penalties',
    emptyFallback: 'No penalties recorded',
  },
  participations: {
    badgeVariant: 'success',
    icon: 'zap',
    category: TYPE_CATEGORIES?.PARTICIPATION || 'participation',
    emptyKey: 'no_participations',
    emptyFallback: 'No participations recorded',
  },
  behaviors: {
    badgeVariant: 'warning',
    icon: 'activity',
    category: TYPE_CATEGORIES?.BEHAVIOR || 'behavior',
    emptyKey: 'no_behaviors',
    emptyFallback: 'No behaviors recorded',
  },
};

/**
 * Generic records tab for Penalties, Participations, and Behaviors.
 * Accepts `recordType` to configure display.
 */
const RecordsTab = React.memo(({
  recordType = 'penalties',
  records = [],
  t,
  lang,
}) => {
  const { theme } = useTheme();
  const config = TYPE_CONFIG[recordType] || TYPE_CONFIG.penalties;

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const dateA = a.date || a.timestamp || '';
      const dateB = b.date || b.timestamp || '';
      return dateB.localeCompare(dateA);
    });
  }, [records]);

  const formatDate = useCallback((dateValue) => {
    if (!dateValue) return '—';
    try {
      const date = typeof dateValue === 'string'
        ? new Date(dateValue)
        : dateValue?.toDate?.() || new Date(dateValue);
      return date.toLocaleDateString(lang === 'ar' ? 'ar-QA' : 'en-GB', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return String(dateValue).split('T')[0] || '—';
    }
  }, [lang]);

  if (sortedRecords.length === 0) {
    return (
      <EmptyState
        title={lang === 'ar'
          ? (t(config.emptyKey) || config.emptyFallback)
          : (t(config.emptyKey) || config.emptyFallback)}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.count}>
        <Badge variant={config.badgeVariant} size="sm">
          {sortedRecords.length} {t(recordType) || recordType}
        </Badge>
      </div>

      <div className={styles.list}>
        {sortedRecords.map((record, idx) => {
          const typeLabel = typeof getTypeLabel === 'function'
            ? getTypeLabel(config.category, record.type, lang)
            : (record.type || '—');

          const notes = record.reason || record.notes || record.description || '';
          const className = lang === 'ar'
            ? (record.className_ar || record.className || '')
            : (record.className || '');

          return (
            <div key={record.id || record.docId || idx} className={styles.recordCard}>
              <div className={styles.recordIcon} data-type={recordType}>
                {getThemedIcon('ui', config.icon, 16, theme)}
              </div>

              <div className={styles.recordBody}>
                <div className={styles.recordHeader}>
                  <Badge variant={config.badgeVariant} size="sm">
                    {typeLabel}
                  </Badge>
                  {className && (
                    <span className={styles.className}>{className}</span>
                  )}
                  <span className={styles.recordDate}>
                    {getThemedIcon('ui', 'calendar', 12, theme)}
                    {formatDate(record.date || record.timestamp)}
                  </span>
                </div>

                {notes && (
                  <p className={styles.recordNotes}>{notes}</p>
                )}

                {record.points !== undefined && (
                  <span className={styles.points}>
                    {getThemedIcon('ui', 'star', 12, theme)}
                    {record.points > 0 ? `+${record.points}` : record.points}
                    {' '}{t('points') || 'pts'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

RecordsTab.displayName = 'RecordsTab';
export default RecordsTab;
