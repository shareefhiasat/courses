import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Badge, EmptyState, Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import styles from './MarksTab.module.css';

const GRADE_COLORS = {
  'A+': 'success', 'A': 'success', 'A-': 'success',
  'B+': 'info',    'B': 'info',    'B-': 'info',
  'C+': 'warning', 'C': 'warning', 'C-': 'warning',
  'D+': 'warning', 'D': 'warning',
  'F': 'danger',
};

const getGradeColor = (grade) => GRADE_COLORS[grade] || 'default';

/**
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
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Enrich marks with semester context from semesters list
  const enrichedMarks = useMemo(() => {
    const enrollmentMap = new Map();
    semesters.forEach(sem => {
      (sem.courses || []).forEach(course => {
        const enrollId = course.id || course.docId;
        if (enrollId) enrollmentMap.set(enrollId, { semester: sem.semester, year: sem.year, semId: sem.id });
      });
    });

    return marks.map(mark => {
      const ctx = enrollmentMap.get(mark.enrollmentId) || {};
      return { ...mark, ...ctx };
    });
  }, [marks, semesters]);

  // Group by semester
  const grouped = useMemo(() => {
    const map = new Map();
    enrichedMarks.forEach(mark => {
      const key = mark.semId || `${mark.semester}-${mark.year}` || 'unknown';
      const label = mark.semester && mark.year ? `${mark.semester} ${mark.year}` : (t('unknown_semester') || 'Unknown Semester');
      if (!map.has(key)) map.set(key, { key, label, marks: [] });
      map.get(key).marks.push(mark);
    });
    return Array.from(map.values());
  }, [enrichedMarks, t]);

  // GPA summary per semester
  const semesterGPAs = useMemo(() => {
    const result = {};
    grouped.forEach(group => {
      const withPoints = group.marks.filter(m => m.points !== undefined);
      const totalPoints = withPoints.reduce((s, m) => s + (m.points * (m.credits || 3)), 0);
      const totalCredits = withPoints.reduce((s, m) => s + (m.credits || 3), 0);
      result[group.key] = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : null;
    });
    return result;
  }, [grouped]);

  const handleNavigateToMarks = useCallback((classId) => {
    if (classId) navigate(`/classes/${classId}/marks`);
  }, [navigate]);

  if (marks.length === 0) {
    return (
      <EmptyState
        title={lang === 'ar' ? 'لا توجد درجات مسجلة' : 'No marks recorded yet'}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Overall GPA card */}
      <div className={styles.gpaCard}>
        <div className={styles.gpaIcon}>
          {getThemedIcon('ui', 'award', 24, theme)}
        </div>
        <div className={styles.gpaInfo}>
          <span className={styles.gpaLabel}>{t('overall_gpa') || 'Overall GPA'}</span>
          <span className={styles.gpaValue}>{statsData.gpa ?? '—'}</span>
        </div>
        <div className={styles.gpaDivider} />
        <div className={styles.gpaInfo}>
          <span className={styles.gpaLabel}>{t('total_courses') || 'Total Courses'}</span>
          <span className={styles.gpaValue}>{marks.length}</span>
        </div>
      </div>

      {/* Marks grouped by semester */}
      {grouped.map(group => (
        <div key={group.key} className={styles.semesterGroup}>
          <div className={styles.semesterHeader}>
            <h3 className={styles.semesterLabel}>{group.label}</h3>
            {semesterGPAs[group.key] !== null && (
              <Badge variant="info" size="sm">
                {t('gpa') || 'GPA'}: {semesterGPAs[group.key]}
              </Badge>
            )}
          </div>

          <div className={styles.marksTable}>
            <div className={styles.tableHeader}>
              <span>{lang === 'ar' ? 'المقرر' : 'Course'}</span>
              <span>{lang === 'ar' ? 'الدرجة الكلية' : 'Total Mark'}</span>
              <span>{lang === 'ar' ? 'التقدير' : 'Grade'}</span>
              <span>{lang === 'ar' ? 'النقاط' : 'Points'}</span>
              <span>{lang === 'ar' ? 'الساعات' : 'Credits'}</span>
              {canNavigateToMarksEntry && <span></span>}
            </div>

            {group.marks.map((mark, idx) => (
              <div key={mark.id || mark.enrollmentId || idx} className={styles.tableRow}>
                <div className={styles.courseCell}>
                  <span className={styles.courseName}>
                    {lang === 'ar'
                      ? (mark.className_ar || mark.className || mark.courseName || '—')
                      : (mark.className || mark.courseName || '—')}
                  </span>
                  {mark.code && <span className={styles.courseCode}>{mark.code}</span>}
                </div>
                <span className={styles.markValue}>
                  {mark.totalMarks !== undefined ? `${mark.totalMarks}%` : '—'}
                </span>
                <span>
                  {mark.grade ? (
                    <Badge variant={getGradeColor(mark.grade)} size="sm">
                      {mark.grade}
                    </Badge>
                  ) : '—'}
                </span>
                <span className={styles.markValue}>{mark.points ?? '—'}</span>
                <span className={styles.markValue}>{mark.credits ?? 3}</span>
                {canNavigateToMarksEntry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigateToMarks(mark.classId)}
                    title={lang === 'ar' ? 'إدخال الدرجات' : 'Enter Marks'}
                  >
                    {getThemedIcon('ui', 'edit', 14, theme)}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

MarksTab.displayName = 'MarksTab';
export default MarksTab;
