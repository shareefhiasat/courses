import React, { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Badge } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './ClassSummaryCard.module.css';

const ClassSummaryCard = React.memo(({ cls, stats = {}, onClick }) => {
  const { t, lang } = useLang();
  const { theme } = useTheme();

  const className = useMemo(() => {
    if (!cls) return '';
    return lang === 'ar'
      ? (cls.name_ar || cls.name || '')
      : (cls.name || cls.name_ar || '');
  }, [cls, lang]);

  const attendanceRate = stats.attendanceRate ?? cls?.attendanceRate ?? 0;
  const gpa = stats.gpa ?? cls?.gpa ?? 0;
  const penalties = stats.penalties ?? cls?.penaltyCount ?? 0;
  const participations = stats.participations ?? cls?.participationCount ?? 0;
  const behaviors = stats.behaviors ?? cls?.behaviorCount ?? 0;
  const studentCount = stats.studentCount ?? cls?.studentCount ?? 0;

  const attendanceColor = attendanceRate >= 80 ? 'success' : attendanceRate >= 60 ? 'warning' : 'danger';
  const gpaColor = gpa >= 3 ? 'success' : gpa >= 2 ? 'warning' : 'danger';

  return (
    <button
      type="button"
      className={styles.card}
      onClick={onClick}
      data-theme={theme}
    >
      <div className={styles.cardHeader}>
        <div className={styles.classIcon}>
          {getThemedIcon('ui', 'book_open', 20, theme)}
        </div>
        <div className={styles.classInfo}>
          <h3 className={styles.className}>{className}</h3>
          {cls?.code && <span className={styles.classCode}>{cls.code}</span>}
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>{t('attendance') || 'Attendance'}</span>
          <Badge variant={attendanceColor} size="sm">
            {attendanceRate.toFixed(1)}%
          </Badge>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>{t('gpa') || 'GPA'}</span>
          <Badge variant={gpaColor} size="sm">
            {gpa.toFixed(2)}
          </Badge>
        </div>
        {studentCount > 0 && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>{t('students') || 'Students'}</span>
            <Badge variant="info" size="sm">{studentCount}</Badge>
          </div>
        )}
      </div>

      <div className={styles.countsRow}>
        <span className={styles.countChip} data-type="participation">
          {getThemedIcon('ui', 'zap', 12, theme)}
          {participations}
        </span>
        <span className={styles.countChip} data-type="penalty">
          {getThemedIcon('ui', 'alert_circle', 12, theme)}
          {penalties}
        </span>
        <span className={styles.countChip} data-type="behavior">
          {getThemedIcon('ui', 'activity', 12, theme)}
          {behaviors}
        </span>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.viewMore}>
          {t('view_details') || 'View Details'}
          {getThemedIcon('ui', 'chevron_right', 14, theme)}
        </span>
      </div>
    </button>
  );
});

ClassSummaryCard.displayName = 'ClassSummaryCard';
export default ClassSummaryCard;
