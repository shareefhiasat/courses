import React, { useMemo } from 'react';
import { GraduationCap, ChevronDown } from 'lucide-react';
import { getGpaStanding } from '@constants/gradingStandards';
import styles from './GpaSummaryCard.module.css';

/**
 * Displays semester and cumulative GPA with academic standing labels.
 */
export default function GpaSummaryCard({
  semesterGroups = [],
  cumulativeGpa = 0,
  totalCourses = 0,
  totalRepeated = 0,
  t,
  lang,
}) {
  const standing = useMemo(() => getGpaStanding(cumulativeGpa, lang), [cumulativeGpa, lang]);
  const [showAllSemesters, setShowAllSemesters] = React.useState(false);

  const latestSemester = semesterGroups[0];
  const otherSemesters = semesterGroups.slice(1);

  const letterColor = (letter) => {
    if (letter === 'A') return '#10b981';
    if (letter === 'B') return '#3b82f6';
    if (letter === 'C') return '#f59e0b';
    if (letter === 'D') return '#60a5fa';
    return '#ef4444';
  };

  const LetterBadge = ({ letter }) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      fontSize: '0.75rem',
      fontWeight: 700,
      color: '#fff',
      background: letterColor(letter),
      flexShrink: 0,
      marginInlineStart: '0.4rem',
    }}>
      {letter}
    </span>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.gpaCard}>
        <div className={styles.gpaIcon}>
          <GraduationCap size={28} color="white" />
        </div>

        <div className={styles.gpaInfo}>
          <span className={styles.gpaLabel}>{t('cumulative_gpa')}</span>
          <span className={styles.gpaValue}>
            {cumulativeGpa.toFixed(2)}
            <LetterBadge letter={standing.letter} />
          </span>
          <span className={styles.gpaStanding}>{standing.label}</span>
        </div>

        <div className={styles.gpaDivider} />

        {latestSemester && (
          <>
            <div className={styles.gpaInfo}>
              <span className={styles.gpaLabel}>{t('semester_gpa')}</span>
              <span className={styles.gpaValue}>
                {latestSemester.gpa.toFixed(2)}
                <LetterBadge letter={getGpaStanding(latestSemester.gpa, lang).letter} />
              </span>
              <span className={styles.gpaStanding}>
                {getGpaStanding(latestSemester.gpa, lang).label}
              </span>
              <span className={styles.gpaSub}>
                {latestSemester.semester} {latestSemester.year}
              </span>
            </div>
            <div className={styles.gpaDivider} />
          </>
        )}

        <div className={styles.gpaInfo}>
          <span className={styles.gpaLabel}>{t('total_courses')}</span>
          <span className={styles.gpaValue}>{totalCourses}</span>
        </div>

        <div className={styles.gpaDivider} />

        <div className={styles.gpaInfo}>
          <span className={styles.gpaLabel}>{t('repeated')}</span>
          <span className={styles.gpaValue}>{totalRepeated}</span>
        </div>

        {otherSemesters.length > 0 && (
          <button
            className={styles.expandBtn}
            onClick={() => setShowAllSemesters((v) => !v)}
            aria-expanded={showAllSemesters}
          >
            <ChevronDown
              size={18}
              style={{
                transform: showAllSemesters ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
            <span>{showAllSemesters ? t('gpa_history') : t('all_semesters_gpa')}</span>
          </button>
        )}
      </div>

      {showAllSemesters && otherSemesters.length > 0 && (
        <div className={styles.semesterList}>
          {otherSemesters.map((sg) => {
            const semStanding = getGpaStanding(sg.gpa, lang);
            return (
              <div key={`${sg.semester}-${sg.year}`} className={styles.semesterRow}>
                <div className={styles.semesterInfo}>
                  <span className={styles.semesterLabel}>
                    {sg.semester} {sg.year}
                  </span>
                  <span className={styles.semesterMeta}>
                    {sg.courseCount} {t('total_courses')}
                    {sg.repeatedCount > 0 ? ` · ${sg.repeatedCount} ${t('repeated')}` : ''}
                  </span>
                </div>
                <div className={styles.semesterGpa}>
                  <span className={styles.semesterGpaValue}>
                    {sg.gpa.toFixed(2)}
                    <LetterBadge letter={semStanding.letter} />
                  </span>
                  <span className={styles.semesterStanding}>{semStanding.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
