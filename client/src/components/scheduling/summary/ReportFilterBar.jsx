import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { Select } from '@ui';
import CollapsibleSection from '@components/scheduling/CollapsibleSection';
import { getAcademicTermOptions } from '@constants/academicTerms';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(CURRENT_YEAR - 2 + i),
  label: String(CURRENT_YEAR - 2 + i),
}));

function itemOptions(items, isRTL) {
  return items.map((item) => ({
    value: String(item.id),
    label: isRTL ? (item.nameAr || item.nameEn) : item.nameEn,
  }));
}

export default function ReportFilterBar({
  programs = [],
  subjects = [],
  classes = [],
  instructors = [],
  filters,
  onChange,
  showInstructor = true,
  isRTL,
  defaultOpen = true,
}) {
  const { t } = useLang();
  const termOptions = useMemo(
    () => getAcademicTermOptions(isRTL ? 'ar' : 'en'),
    [isRTL],
  );

  const set = (key, value) => onChange({ ...filters, [key]: value });

  const filteredSubjects = filters.programId
    ? subjects.filter((s) => String(s.programId) === String(filters.programId))
    : subjects;

  const filteredClasses = classes.filter((c) => {
    if (filters.programId && String(c.programId) !== String(filters.programId)) return false;
    if (filters.subjectId && String(c.subjectId) !== String(filters.subjectId)) return false;
    if (filters.term && c.term !== filters.term) return false;
    if (filters.year && String(c.year) !== String(filters.year)) return false;
    return true;
  });

  const activeCount = [
    filters.programId,
    filters.subjectId,
    filters.classId,
    filters.term,
    filters.year,
    filters.instructorId,
  ].filter(Boolean).length;

  const summary = activeCount
    ? `${activeCount} ${t('filters_active') || 'filters active'}`
    : t('all_filters_cleared') || 'All filters cleared';

  const grid = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))',
        gap: '0.75rem',
        alignItems: 'center',
      }}>
        <Select
          placeholder={t('select_program') || 'Select a program'}
          value={filters.programId || ''}
          onChange={(e) => set('programId', e.target.value)}
          options={itemOptions(programs, isRTL)}
        />
        <Select
          placeholder={t('select_subject') || 'Select a subject'}
          value={filters.subjectId || ''}
          onChange={(e) => set('subjectId', e.target.value)}
          options={itemOptions(filteredSubjects, isRTL)}
        />
        <Select
          placeholder={t('select_class') || 'Select a class'}
          value={filters.classId || ''}
          onChange={(e) => set('classId', e.target.value)}
          options={itemOptions(filteredClasses, isRTL)}
        />
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: showInstructor ? 'repeat(3, minmax(150px, 1fr))' : 'repeat(2, minmax(150px, 1fr))',
        gap: '0.75rem',
        alignItems: 'center',
      }}>
        <Select
          placeholder={t('select_term') || 'Select a term'}
          value={filters.term || ''}
          onChange={(e) => set('term', e.target.value)}
          options={termOptions}
        />
        <Select
          placeholder={t('select_year') || 'Select a year'}
          value={filters.year || ''}
          onChange={(e) => set('year', e.target.value)}
          options={YEAR_OPTIONS}
        />
        {showInstructor && (
          <Select
            placeholder={t('select_instructor') || 'Select an instructor'}
            value={filters.instructorId || ''}
            onChange={(e) => set('instructorId', e.target.value)}
            options={instructors.map((i) => ({
              value: String(i.id),
              label: i.displayName || `${i.firstName || ''} ${i.lastName || ''}`.trim(),
            }))}
          />
        )}
      </div>
    </div>
  );

  return (
    <CollapsibleSection
      title={t('report_filters') || 'Report Filters'}
      summary={summary}
      icon={Filter}
      defaultOpen={defaultOpen}
      testId="report-filter-bar"
    >
      {grid}
    </CollapsibleSection>
  );
}
