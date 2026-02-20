import React, { useState, useMemo, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { EmptyState, Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import ClassSummaryCard from './ClassSummaryCard';
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
  const [viewMode, setViewMode] = useState('card');

  // Build class-level summaries from semesters/enrollments
  const classSummaries = useMemo(() => {
    const map = new Map();
    semesters.forEach(sem => {
      (sem.courses || []).forEach(course => {
        const id = course.classId || course.id || course.docId;
        if (!id) return;
        if (!map.has(id)) {
          map.set(id, {
            id,
            name: course.className || course.name || course.courseName || '',
            name_ar: course.className_ar || course.name_ar || '',
            code: course.code || '',
            semester: sem.semester,
            year: sem.year,
            semesterId: sem.id,
            attendanceRate: course.attendanceRate || 0,
            gpa: course.marks?.points || 0,
            grade: course.grade || '',
            totalMarks: course.totalMarks || 0,
            penalties: 0,
            participations: 0,
            behaviors: 0,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [semesters]);

  // Group by active grouping mode
  const grouped = useMemo(() => {
    if (grouping === 'year') {
      const yearMap = new Map();
      classSummaries.forEach(cls => {
        const key = String(cls.year || 'Unknown');
        if (!yearMap.has(key)) yearMap.set(key, { key, label: key, items: [] });
        yearMap.get(key).items.push(cls);
      });
      return Array.from(yearMap.values()).sort((a, b) => b.key.localeCompare(a.key));
    }
    if (grouping === 'term') {
      const termMap = new Map();
      classSummaries.forEach(cls => {
        const key = `${cls.semester}-${cls.year}`;
        const label = `${cls.semester} ${cls.year}`;
        if (!termMap.has(key)) termMap.set(key, { key, label, items: [] });
        termMap.get(key).items.push(cls);
      });
      return Array.from(termMap.values());
    }
    // Default: class (flat list as single group)
    return [{ key: 'all', label: t('overview.all_courses') || (lang === 'ar' ? 'كل المقررات' : 'All Courses'), items: classSummaries }];
  }, [classSummaries, grouping, lang]);

  const handleClassClick = useCallback((cls) => {
    onNavigateToClass?.(cls.id);
  }, [onNavigateToClass]);

  if (classSummaries.length === 0) {
    return (
      <EmptyState
        title={t('overview.no_courses_found') || (lang === 'ar' ? 'لا توجد مقررات مسجلة' : 'No enrolled courses found')}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* View mode toggle */}
      <div className={styles.toolbar}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === 'card' ? styles.active : ''}`}
            onClick={() => setViewMode('card')}
            title={t('overview.card_view') || (lang === 'ar' ? 'عرض البطاقات' : 'Card View')}
          >
            {getThemedIcon('ui', 'grid', 16, theme)}
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            title={t('overview.list_view') || (lang === 'ar' ? 'عرض القائمة' : 'List View')}
          >
            {getThemedIcon('ui', 'list', 16, theme)}
          </button>
        </div>
      </div>

      {/* Grouped content */}
      {grouped.map(group => (
        <div key={group.key} className={styles.group}>
          {grouped.length > 1 && (
            <h3 className={styles.groupLabel}>{group.label}</h3>
          )}

          {viewMode === 'card' ? (
            <div className={styles.cardsGrid}>
              {group.items.map(cls => (
                <ClassSummaryCard
                  key={cls.id}
                  cls={cls}
                  stats={{
                    attendanceRate: cls.attendanceRate,
                    gpa: cls.gpa,
                    penalties: cls.penalties,
                    participations: cls.participations,
                    behaviors: cls.behaviors,
                  }}
                  onClick={() => handleClassClick(cls)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.listView}>
              <div className={styles.listHeader}>
                <span>{t('overview.course') || (lang === 'ar' ? 'المقرر' : 'Course')}</span>
                <span>{t('overview.attendance') || (lang === 'ar' ? 'الحضور' : 'Attendance')}</span>
                <span>{t('overview.gpa') || (lang === 'ar' ? 'المعدل' : 'GPA')}</span>
                <span>{t('overview.grade') || (lang === 'ar' ? 'الدرجة' : 'Grade')}</span>
                <span></span>
              </div>
              {group.items.map(cls => (
                <div key={cls.id} className={styles.listRow}>
                  <div className={styles.listCourseName}>
                    <span className={styles.courseName}>
                      {lang === 'ar' ? (cls.name_ar || cls.name) : cls.name}
                    </span>
                    {cls.code && <span className={styles.courseCode}>{cls.code}</span>}
                  </div>
                  <span className={`${styles.listStat} ${
                    cls.attendanceRate >= 80 ? styles.good : cls.attendanceRate >= 60 ? styles.warn : styles.bad
                  }`}>
                    {cls.attendanceRate.toFixed(1)}%
                  </span>
                  <span className={styles.listStat}>{cls.gpa.toFixed(2)}</span>
                  <span className={styles.listStat}>{cls.grade || '—'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClassClick(cls)}
                  >
                    {t('overview.view') || (lang === 'ar' ? 'عرض' : 'View')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';
export default OverviewTab;
