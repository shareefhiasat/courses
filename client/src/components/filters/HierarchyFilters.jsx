import React, { useMemo } from 'react';
import { Select, YearSelect, FilterSelect } from '@ui';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Reusable hierarchy filters component for Program/Subject/Class/Student dropdowns
 * Used in HomePage, StudentDashboard, and ReviewResultsPage
 */
const HierarchyFilters = ({
  programs = [],
  subjects = [],
  classes = [],
  students = [],
  years = [],
  terms = [],
  selectedProgram,
  setSelectedProgram,
  selectedSubject,
  setSelectedSubject,
  selectedClass,
  setSelectedClass,
  selectedStudent,
  setSelectedStudent,
  selectedYear,
  setSelectedYear,
  selectedTerm,
  setSelectedTerm,
  theme = 'light',
  lang = 'en',
  t = (key) => key,
  showPrograms = true,
  showSubjects = true,
  showClasses = true,
  showStudents = false,
  showYears = false,
  showTerms = false
}) => {
  const programOptions = useMemo(() => [
    { value: 'all', label: t('all_programs') || 'All Programs' },
    ...programs.map(p => ({
      value: p.docId || p.id,
      label: lang === 'ar' ? (p.nameAr || p.nameEn || p.code) : (p.nameEn || p.nameAr || p.code)
    }))
  ], [programs, lang, t]);

  const subjectOptions = useMemo(() => [
    { value: 'all', label: t('all_subjects') || 'All Subjects' },
    ...subjects
      .filter(s => selectedProgram === 'all' || String(s.programId) === String(selectedProgram))
      .map(s => ({
        value: s.docId || s.id,
        label: lang === 'ar' ? (s.nameAr || s.nameEn || s.code) : (s.nameEn || s.nameAr || s.code)
      }))
  ], [subjects, selectedProgram, lang, t]);

  const classOptions = useMemo(() => [
    { value: 'all', label: t('all_classes') || 'All Classes' },
    ...classes
      .filter(c => {
        if (selectedSubject !== 'all') return String(c.subjectId) === String(selectedSubject);
        if (selectedProgram !== 'all') {
          const subject = subjects.find(s => String(s.docId || s.id) === String(c.subjectId));
          return String(subject?.programId) === String(selectedProgram);
        }
        return true;
      })
      .map(c => ({
        value: c.id || c.docId,
        label: lang === 'ar' ? (c.titleAr || c.nameAr || c.title || c.name || c.code) : (c.title || c.name || c.code)
      }))
  ], [classes, selectedSubject, selectedProgram, subjects, t]);

  const studentOptions = useMemo(() => [
    { value: 'all', label: t('all_students') || 'All Students' },
    ...students
      .filter(s => {
        // If no filters selected, show all students
        if (selectedClass === 'all' && selectedSubject === 'all' && selectedProgram === 'all') {
          return true;
        }
        
        // Filter by class if specified
        if (selectedClass !== 'all') {
          return s.enrollments?.some(e => String(e.classId) === String(selectedClass)) || String(s.classId) === String(selectedClass);
        }
        
        // Filter by subject if specified
        if (selectedSubject !== 'all') {
          return s.enrollments?.some(e => String(e.subjectId) === String(selectedSubject)) || String(s.subjectId) === String(selectedSubject);
        }
        
        // Filter by program if specified
        if (selectedProgram !== 'all') {
          return s.enrollments?.some(e => String(e.programId) === String(selectedProgram)) || String(s.programId) === String(selectedProgram);
        }
        
        return true;
      })
      .map(s => ({
        value: s.id || s.docId || s.uid,
        label: s.displayName || s.realName || s.email || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown Student'
      }))
  ], [students, selectedProgram, selectedSubject, selectedClass, t]);

  return (
    <div style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', width: '100%' }}>
      {showPrograms && programs.length > 0 && (
        <div style={{ minWidth: 0 }}>
          <Select
            value={selectedProgram}
            onChange={(e) => {
              const val = e?.target?.value ?? e?.value ?? e;
              setSelectedProgram(val);
              if (setSelectedSubject) setSelectedSubject('all');
              if (setSelectedClass) setSelectedClass('all');
            }}
            options={programOptions}
            fullWidth
          />
        </div>
      )}
      
      {showSubjects && subjects.length > 0 && (
        <div style={{ minWidth: 0 }}>
          <Select
            value={selectedSubject}
            onChange={(e) => {
              const val = e?.target?.value ?? e?.value ?? e;
              setSelectedSubject(val);
              if (setSelectedClass) setSelectedClass('all');
            }}
            options={subjectOptions}
            fullWidth
          />
        </div>
      )}
      
      {showClasses && classes.length > 0 && (
        <div style={{ minWidth: 0 }}>
          <Select
            value={selectedClass}
            onChange={(e) => {
              const val = e?.target?.value ?? e?.value ?? e;
              setSelectedClass(val);
            }}
            options={classOptions}
            fullWidth
          />
        </div>
      )}

      {showStudents && students.length > 0 && (
        <div style={{ minWidth: 0 }}>
          <Select
            value={selectedStudent}
            onChange={(e) => {
              const val = e?.target?.value ?? e?.value ?? e;
              setSelectedStudent(val);
            }}
            options={studentOptions}
            fullWidth
          />
        </div>
      )}

      {showYears && years.length > 0 && (
        <div style={{ minWidth: 0 }}>
          <YearSelect
            value={selectedYear}
            onChange={(e) => {
              const val = e?.target?.value ?? e?.value ?? e;
              setSelectedYear(val);
            }}
            includeAll
            allValue="all"
            allLabel={t('all_years') || 'All Years'}
            startYear={Number(years[0]) || 2024}
            yearsAhead={6}
            fullWidth
          />
        </div>
      )}

      {showTerms && terms.length > 0 && (
        <div style={{ minWidth: 0 }}>
          <FilterSelect
            filterKey="terms"
            value={selectedTerm}
            onChange={(e) => {
              const val = e?.target?.value ?? e?.value ?? e;
              setSelectedTerm(val);
            }}
            data={terms}
            allLabel={t('all_terms') || 'All Terms'}
            fullWidth
          />
        </div>
      )}
    </div>
  );
};

export default HierarchyFilters;
