import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useColorTheme } from '@contexts/ColorThemeContext';
import { ProgramsSelect, Select, Input, UserSelect, SimpleLoading, ClassCard } from '@ui';
import { getAcademicTermLabel } from '@constants/academicTerms';
import { getThemedIcon } from '@constants/iconTypes';
import { fetchClassStatsMap, getClassYears } from '../utils/classStatsUtils.js';

function normalizeFilterValue(value) {
  if (value == null || value === '') return 'all';
  if (typeof value === 'object' && value.target) return value.target.value || 'all';
  if (typeof value === 'object' && value.value !== undefined) return value.value || 'all';
  return value;
}

function instructorForClass(cls, instructors) {
  const byId = instructors.find((i) => i.id === cls.instructorId);
  if (byId) return byId;
  if (cls.ownerEmail) {
    return instructors.find((i) => i.email === cls.ownerEmail);
  }
  return null;
}

export default function SchedulingClassesView({
  classes,
  programs,
  subjects,
  instructors,
  enrollments,
  scheduledSessions,
  theme,
  t,
  lang,
  isRTL = false,
  viewMode = 'semester',
  onSelectClass
}) {
  const { primaryColor } = useColorTheme();
  const [programFilter, setProgramFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [classStats, setClassStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  const panelBg = theme === 'dark' ? '#1f2937' : '#f9fafb';
  const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const muted = theme === 'dark' ? '#9ca3af' : '#6b7280';

  const countBadge = (count, label, color = '#8b5cf6') => (
    <span style={{
      padding: '0.2rem 0.6rem',
      background: `${color}20`,
      color,
      borderRadius: '999px',
      fontSize: 'var(--font-size-xs)',
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }}>
      {count} {label}
    </span>
  );

  const availableYears = useMemo(() => getClassYears(classes), [classes]);

  const availableTerms = useMemo(() => {
    const terms = new Set();
    classes.forEach((cls) => {
      if (cls.term) terms.add(cls.term);
    });
    return [...terms].sort().map((termValue) => ({
      value: termValue,
      label: getAcademicTermLabel(termValue, lang, t)
    }));
  }, [classes, lang, t]);

  const filteredClasses = useMemo(() => {
    let result = [...classes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((cls) => {
        const name = (cls.nameEn || cls.name || cls.code || '').toLowerCase();
        const inst = instructorForClass(cls, instructors);
        const instName = (inst?.displayName || inst?.email || '').toLowerCase();
        return name.includes(q) || instName.includes(q);
      });
    }

    if (programFilter !== 'all') {
      const pid = parseInt(programFilter, 10);
      result = result.filter((cls) => cls.programId === pid || cls.program?.id === pid);
    }

    if (subjectFilter !== 'all') {
      const sid = parseInt(subjectFilter, 10);
      result = result.filter((cls) => cls.subjectId === sid || cls.subject?.id === sid);
    }

    if (classFilter !== 'all') {
      const cid = parseInt(classFilter, 10);
      result = result.filter((cls) => (cls.id || cls.docId) === cid);
    }

    if (instructorFilter) {
      result = result.filter((cls) => cls.instructorId === instructorFilter);
    }

    if (yearFilter !== 'all') {
      result = result.filter((cls) => {
        if (cls.year && String(cls.year) === yearFilter) return true;
        if (cls.term?.includes(' ')) {
          const parts = cls.term.split(' ');
          return parts[parts.length - 1] === yearFilter;
        }
        return false;
      });
    }

    if (termFilter !== 'all') {
      result = result.filter((cls) => cls.term === termFilter);
    }

    result.sort((a, b) => {
      const nameA = (a.nameEn || a.name || a.code || '').toLowerCase();
      const nameB = (b.nameEn || b.name || b.code || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [
    classes,
    searchQuery,
    programFilter,
    subjectFilter,
    classFilter,
    instructorFilter,
    yearFilter,
    termFilter,
    instructors
  ]);

  const classesBySemester = useMemo(() => {
    const grouped = {};
    filteredClasses.forEach((cls) => {
      const term = cls.term || t('unknown_semester');
      const year = cls.year || new Date().getFullYear();
      const key = `${term} ${year}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(cls);
    });
    return grouped;
  }, [filteredClasses, t]);

  const enrichClass = useCallback((cls) => {
    const inst = instructorForClass(cls, instructors);
    const subject = subjects.find((s) => s.id === cls.subjectId);
    const subjectName = lang === 'ar' && subject?.nameAr
      ? subject.nameAr
      : subject?.nameEn || subject?.name || '';
    return {
      ...cls,
      name: cls.nameEn || cls.name || cls.code,
      instructorData: inst || null,
      subjectName
    };
  }, [instructors, subjects, lang]);

  const loadStats = useCallback(async () => {
    if (!filteredClasses.length) {
      setClassStats({});
      return;
    }
    setStatsLoading(true);
    try {
      const stats = await fetchClassStatsMap(filteredClasses, { scheduledSessions });
      setClassStats(stats);
    } finally {
      setStatsLoading(false);
    }
  }, [filteredClasses, scheduledSessions]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const renderClassCard = (cls, index) => {
    const clsId = cls.docId || cls.id;
    return (
      <ClassCard
        key={clsId || `class-${index}`}
        cls={enrichClass(cls)}
        classStats={classStats}
        primaryColor={primaryColor}
        theme={theme}
        t={t}
        onViewClass={(classData) => onSelectClass?.(classData)}
        onSessionSelect={(session) => onSelectClass?.(cls, session)}
      />
    );
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}
    >
      <div style={{
        padding: '0.75rem',
        background: panelBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.5rem',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <Input
            placeholder={t('quick_search_class_instructor')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1 1 320px', minWidth: '280px' }}
          />
          <UserSelect
            users={instructors}
            enrollments={enrollments}
            classes={classes}
            value={instructorFilter ? instructors.find((i) => i.id === instructorFilter)?.email : null}
            onChange={(email) => {
              const inst = instructors.find((i) => i.email === email);
              setInstructorFilter(inst ? inst.id : null);
            }}
            placeholder={t('all_instructors')}
            roleFilter={[]}
            showLabels={false}
            useEmailAsValue
            style={{ flex: '0 1 360px', minWidth: '360px', width: '360px' }}
          />
          <span style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {countBadge(filteredClasses.length, t('classes_count_label'))}
            {statsLoading && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: muted }}>{t('loading')}...</span>
            )}
          </span>
        </div>

        <ProgramsSelect
          programs={programs}
          subjects={subjects}
          classes={classes}
          selectedProgram={programFilter}
          selectedSubject={subjectFilter}
          selectedClass={classFilter}
          onProgramChange={(programId) => {
            setProgramFilter(normalizeFilterValue(programId));
            setSubjectFilter('all');
            setClassFilter('all');
          }}
          onSubjectChange={(subjectId) => {
            setSubjectFilter(normalizeFilterValue(subjectId));
            setClassFilter('all');
          }}
          onClassChange={(classId) => setClassFilter(normalizeFilterValue(classId))}
          showLabels={false}
          fullWidth
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.5rem',
          marginTop: '0.5rem'
        }}>
          <Select
            searchable
            placeholder={t('all_years')}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all_years') },
              ...availableYears.map((year) => ({ value: year, label: year }))
            ]}
            fullWidth
          />
          <Select
            searchable
            placeholder={t('all_terms')}
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all_terms') },
              ...availableTerms
            ]}
            fullWidth
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {statsLoading && !Object.keys(classStats).length ? (
          <SimpleLoading message={t('loading_class_stats')} />
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.75rem',
            padding: '0.25rem'
          }}>
            {filteredClasses.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: muted }}>
                {t('no_classes_found')}
              </div>
            ) : (
              filteredClasses.map(renderClassCard)
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(classesBySemester).map(([semester, semesterClasses]) => (
              <div
                key={semester}
                style={{
                  background: theme === 'dark' ? '#111827' : '#ffffff',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '0.75rem',
                  padding: '1rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: `1px solid ${borderColor}`,
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 600,
                    color: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {getThemedIcon('ui', 'calendar', 14, theme)}
                    {semester}
                    {countBadge(semesterClasses.length, t('classes_count_label'))}
                  </h3>
                  {countBadge(
                    semesterClasses.filter((c) => classStats[c.id || c.docId]?.sessions > 0).length,
                    t('scheduled')
                  )}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {semesterClasses.map(renderClassCard)}
                </div>
              </div>
            ))}
            {Object.keys(classesBySemester).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: muted }}>
                {t('no_classes_found')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
