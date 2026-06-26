import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import YearSelect from '../YearSelect/YearSelect';
import TermSelect from './TermSelect';
import { info, error, warn, debug } from '@services/utils/logger.js';

const ProgramsSelect = ({
  programs = [],
  subjects = [],
  classes = [],
  selectedProgram,
  selectedSubject,
  selectedClass,
  selectedTerm,
  selectedYear,
  onProgramChange,
  onSubjectChange,
  onClassChange,
  onTermChange,
  onYearChange,
  showSubjects = true,
  showClasses = true,
  showTerms = false,
  showYears = false,
  showLabels = true,
  disabled = false,
  className = '',
  style = {},
}) => {
  const { t, lang } = useLang();
  const { user, isAdmin, isSuperAdmin, isHR, isInstructor } = useAuth();

  // Determine if user can view all programs (admin roles)
  const canViewAll = isAdmin || isSuperAdmin || isHR;

  // Filter classes based on user role
  const filteredClassesByRole = React.useMemo(() => {
    if (canViewAll) {
      return classes;
    }
    // Instructor: only show classes they supervise
    if (isInstructor && user?.email) {
      const userEmail = user.email.toLowerCase();
      return classes.filter(cls => {
        // Match by ownerEmail field
        if (cls.ownerEmail && cls.ownerEmail.toLowerCase() === userEmail) return true;
        // Match by instructor relation email (API returns nested instructor object)
        if (cls.instructor?.email && cls.instructor.email.toLowerCase() === userEmail) return true;
        // Match by instructorId (only works if instructorId is same type as user.uid)
        if (cls.instructorId != null && String(cls.instructorId) === String(user?.uid)) return true;
        return false;
      });
    }
    return classes;
  }, [classes, canViewAll, isInstructor, user?.email, user?.uid]);

  // Derive allowed program and subject IDs from instructor's classes
  const allowedProgramIds = React.useMemo(() => {
    if (canViewAll) return null;
    if (isInstructor) {
      const ids = new Set(filteredClassesByRole.map(cls => String(cls.programId ?? cls.program)).filter(Boolean));
      return ids.size > 0 ? ids : null;
    }
    return null;
  }, [canViewAll, isInstructor, filteredClassesByRole]);

  const allowedSubjectIds = React.useMemo(() => {
    if (canViewAll) return null;
    if (isInstructor) {
      const ids = new Set(filteredClassesByRole.map(cls => String(cls.subjectId ?? cls.subject)).filter(Boolean));
      return ids.size > 0 ? ids : null;
    }
    return null;
  }, [canViewAll, isInstructor, filteredClassesByRole]);

  // Filter programs based on allowed IDs (for instructors)
  const filteredPrograms = React.useMemo(() => {
    if (!allowedProgramIds) return programs;
    return programs.filter(prog => allowedProgramIds.has(String(prog.id)));
  }, [programs, allowedProgramIds]);

  // Filter subjects based on allowed IDs (for instructors)
  const filteredSubjectsByRole = React.useMemo(() => {
    if (!allowedSubjectIds) return subjects;
    return subjects.filter(sub => allowedSubjectIds.has(String(sub.id)));
  }, [subjects, allowedSubjectIds]);

  // DEBUG: Log props received
  debug('[ProgramsSelect] Props:', {
    programsCount: programs.length,
    subjectsCount: subjects.length,
    classesCount: classes.length,
    selectedProgram,
    selectedProgramType: typeof selectedProgram,
    selectedSubject,
    selectedClass,
    selectedTerm,
    selectedYear,
    showSubjects,
    showClasses,
    showTerms,
    showYears
  });

  // Handle both string and number types from Select component
  let normalizedSelectedProgram = null;
  if (selectedProgram !== null && selectedProgram !== undefined && selectedProgram !== '') {
    if (typeof selectedProgram === 'object') {
      normalizedSelectedProgram = String(selectedProgram.value || selectedProgram.id || selectedProgram.target?.value);
    } else {
      normalizedSelectedProgram = String(selectedProgram);
    }

    debug('[ProgramsSelect] Program normalization:', {
      originalValue: selectedProgram,
      normalizedValue: normalizedSelectedProgram
    });
  }

  // Filter subjects based on selected program
  const filteredSubjects = normalizedSelectedProgram
    ? filteredSubjectsByRole.filter(subject => String(subject.programId) === normalizedSelectedProgram)
    : filteredSubjectsByRole;

  // Filter classes based on selected subject AND term/year if provided
  const normalizedSelectedSubject = selectedSubject !== null && selectedSubject !== undefined && selectedSubject !== ''
    ? String(selectedSubject)
    : null;

  let filteredClasses = normalizedSelectedSubject
    ? filteredClassesByRole.filter(cls => String(cls.subjectId) === normalizedSelectedSubject)
    : filteredClassesByRole;
  
  // Apply term filter if selected
  if (selectedTerm && selectedTerm !== 'all' && selectedTerm !== '') {
    filteredClasses = filteredClasses.filter(cls => cls.term === selectedTerm);
  }
  
  // Apply year filter if selected
  if (selectedYear && selectedYear !== 'all' && selectedYear !== '') {
    filteredClasses = filteredClasses.filter(cls => cls.year === selectedYear);
  }

  // DEBUG: Log filtering results
  debug('[ProgramsSelect] Filtering results:', {
    normalizedSelectedProgram,
    normalizedSelectedSubject,
    filteredSubjectsCount: filteredSubjects.length,
    filteredClassesCount: filteredClasses.length,
    filteredClasses: filteredClasses.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name || c.code,
      subjectId: c.subjectId,
      term: c.term,
      year: c.year
    }))
  });

  // Format options for Select components
  const programOptions = [
    { value: '', label: t('all_programs') || 'All Programs' },
    ...filteredPrograms.map(program => ({
      value: String(program.id || ''),
      label: lang === 'ar' 
        ? (program.nameAr || program[`name_${lang}`] || program.name || 'Unnamed Program')
        : (program.nameEn || program[`name_${lang}`] || program.name || 'Unnamed Program'),
    })),
  ];

  const subjectOptions = [
    { value: '', label: t('all_subjects') || 'All Subjects' },
    ...filteredSubjects.map(subject => ({
      value: String(subject.id || ''),
      label: lang === 'ar' 
        ? (subject.nameAr || subject[`name_${lang}`] || subject.name || 'Unnamed Subject')
        : (subject.nameEn || subject[`name_${lang}`] || subject.name || 'Unnamed Subject'),
    })),
  ];

  const classOptions = [
    { value: '', label: t('all_classes') || 'All Classes' },
    ...filteredClasses.map(cls => {
      // Use string values for consistency
      const classId = String(cls.id || '');
      const className = lang === 'ar' 
        ? (cls.nameAr || cls[`name_${lang}`] || cls.name || 'Unnamed Class')
        : (cls.nameEn || cls[`name_${lang}`] || cls.name || 'Unnamed Class');
      
      return {
        value: classId,
        label: className + (cls.code ? ` (${cls.code})` : ''),
        code: cls.code,
      };
    }),
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} style={style}>
      <div className="flex-1 min-w-[180px]">
        <Select
          label={showLabels ? (t('program') || 'Program') : ''}
          options={programOptions}
          value={selectedProgram || ''}  // Use the raw selectedProgram value
          onChange={(e) => {
            // Extract value properly - handle both event objects and direct values
            const value = e?.value !== undefined ? e.value : (e?.target?.value || e || '');
            
            // Pass the value directly (not as an event object)
            onProgramChange?.(value);
            
            // Reset subject, class, term, and year when program changes
            onSubjectChange?.('');
            onClassChange?.('');
            if (onTermChange) onTermChange?.('');
            if (onYearChange) onYearChange?.('');
          }}
          placeholder={t('all_programs') || 'All Programs'}
          disabled={disabled || programs.length === 0}
        />
      </div>

      {showSubjects && (
        <div className="flex-1 min-w-[180px]">
          <Select
            label={showLabels ? (t('subject') || 'Subject') : ''}
            options={subjectOptions}
            value={String(normalizedSelectedSubject || '')}
            onChange={(e) => {
              // Extract value properly - handle both event objects and direct values
              const value = e?.target?.value !== undefined ? e.target.value : (e?.value || e || '');
              
              // Pass the value directly (not as an event object)
              onSubjectChange?.(value);
              // Reset class, term, and year when subject changes
              onClassChange?.('');
              if (onTermChange) onTermChange?.('');
              if (onYearChange) onYearChange?.('');
            }}
            placeholder={normalizedSelectedProgram ? (t('select_subject') || 'Select subject') : (t('all_subjects') || 'All Subjects')}
            disabled={disabled || !normalizedSelectedProgram || filteredSubjects.length === 0}
          />
        </div>
      )}

      {showClasses && showSubjects && (
        <div className="flex-1 min-w-[180px]">
          <Select
            label={showLabels ? (t('class') || 'Class') : ''}
            options={classOptions}
            value={String(selectedClass || '')}
            onChange={(e) => {
              // Extract value properly - handle both event objects and direct values
              const value = e?.target?.value !== undefined ? e.target.value : (e?.value || e || '');
              
              // Pass the value directly (not as an event object)
              onClassChange?.(value);
            }}
            placeholder={normalizedSelectedSubject ? (t('select_class') || 'Select class') : (t('all_classes') || 'All Classes')}
            disabled={disabled || !normalizedSelectedSubject || filteredClasses.length === 0}
          />
        </div>
      )}

      {showTerms && (
        <div className="flex-1 min-w-[150px]">
          <TermSelect
            label={showLabels ? (t('term') || 'Term') : ''}
            value={selectedTerm || ''}
            onChange={(e) => {
              const value = e?.target?.value !== undefined ? e.target.value : (e?.value || e || '');
              onTermChange?.(value);
              // Reset class when term changes
              onClassChange?.('');
            }}
            includeAll={true}
            allValue="all"
            allLabel={t('all_terms') || 'All Terms'}
            disabled={disabled}
            searchable={true}
          />
        </div>
      )}

      {showYears && (
        <div className="flex-1 min-w-[150px]">
          <YearSelect
            label={showLabels ? (t('year') || 'Year') : ''}
            value={selectedYear || ''}
            onChange={(e) => {
              const value = e?.target?.value !== undefined ? e.target.value : (e?.value || e || '');
              onYearChange?.(value);
              // Reset class when year changes
              onClassChange?.('');
            }}
            includeAll={true}
            allValue="all"
            allLabel={t('all_years') || 'All Years'}
            disabled={disabled}
            searchable={true}
            yearsAhead={3}
          />
        </div>
      )}
    </div>
  );
};

const idProp = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

ProgramsSelect.propTypes = {
  programs: PropTypes.arrayOf(
    PropTypes.shape({
      id: idProp,
      nameEn: PropTypes.string,
      nameAr: PropTypes.string,
      name: PropTypes.string,
      code: PropTypes.string,
    })
  ),
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: idProp,
      programId: idProp,
      nameEn: PropTypes.string,
      nameAr: PropTypes.string,
      name: PropTypes.string,
    })
  ),
  classes: PropTypes.arrayOf(
    PropTypes.shape({
      id: idProp,
      subjectId: idProp,
      programId: idProp,
      name: PropTypes.string,
      code: PropTypes.string,
      term: PropTypes.string,
      year: PropTypes.string,
    })
  ),
  selectedProgram: PropTypes.string,
  selectedSubject: PropTypes.string,
  selectedClass: PropTypes.string,
  selectedTerm: PropTypes.string,
  selectedYear: PropTypes.string,
  onProgramChange: PropTypes.func,
  onSubjectChange: PropTypes.func,
  onClassChange: PropTypes.func,
  onTermChange: PropTypes.func,
  onYearChange: PropTypes.func,
  showSubjects: PropTypes.bool,
  showClasses: PropTypes.bool,
  showTerms: PropTypes.bool,
  showYears: PropTypes.bool,
  showLabels: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ProgramsSelect;
