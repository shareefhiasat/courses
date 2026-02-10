import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@ui';
import { useLang } from '@contexts/LangContext';

const ProgramsSelect = ({
  programs = [],
  subjects = [],
  classes = [],
  selectedProgram,
  selectedSubject,
  selectedClass,
  onProgramChange,
  onSubjectChange,
  onClassChange,
  showSubjects = true,
  showClasses = true,
  showLabels = true,
  disabled = false,
  className = '',
}) => {
  const { t, lang } = useLang();

  // Filter subjects based on selected program
  const filteredSubjects = selectedProgram
    ? subjects.filter(subject => subject.programId === selectedProgram)
    : [];

  // Filter classes based on selected subject
  const filteredClasses = selectedSubject
    ? classes.filter(cls => cls.subjectId === selectedSubject)
    : [];

  // Format options for Select components
  const programOptions = [
    { value: '', label: t('all_programs') || 'All Programs' },
    ...programs.map(program => ({
      value: program.docId || program.id,
      label: program[`name_${lang}`] || program.name || 'Unnamed Program',
    })),
  ];

  const subjectOptions = [
    { value: '', label: t('all_subjects') || 'All Subjects' },
    ...filteredSubjects.map(subject => ({
      value: subject.docId || subject.id,
      label: subject[`name_${lang}`] || subject.name || 'Unnamed Subject',
    })),
  ];

  const classOptions = [
    { value: '', label: t('all_classes') || 'All Classes' },
    ...filteredClasses.map(cls => ({
      value: cls.docId || cls.id,
      label: cls.name || 'Unnamed Class',
      code: cls.code,
    })),
  ];

  return (
    <div className={`flex flex-nowrap gap-2 ${className}`}>
      <div className="flex-1 min-w-[150px]">
        <Select
          label={showLabels ? (t('program') || 'Program') : ''}
          options={programOptions}
          value={selectedProgram}
          onChange={(e) => {
            onProgramChange?.(e.target.value);
            // Reset subject and class when program changes
            onSubjectChange?.('');
            onClassChange?.('');
          }}
          disabled={disabled || programs.length === 0}
        />
      </div>

      {showSubjects && (
        <div className="flex-1 min-w-[150px]">
          <Select
            label={showLabels ? (t('subject') || 'Subject') : ''}
            options={subjectOptions}
            value={selectedSubject}
            onChange={(e) => {
              onSubjectChange?.(e.target.value);
              // Reset class when subject changes
              onClassChange?.('');
            }}
            disabled={disabled || !selectedProgram || filteredSubjects.length === 0}
          />
        </div>
      )}

      {showClasses && showSubjects && (
        <div className="flex-1 min-w-[150px]">
          <Select
            label={showLabels ? (t('class') || 'Class') : ''}
            options={classOptions}
            value={selectedClass}
            onChange={(e) => onClassChange?.(e.target.value)}
            disabled={disabled || !selectedSubject || filteredClasses.length === 0}
          />
        </div>
      )}
    </div>
  );
};

ProgramsSelect.propTypes = {
  programs: PropTypes.arrayOf(
    PropTypes.shape({
      docId: PropTypes.string,
      id: PropTypes.string,
      name_en: PropTypes.string,
      name_ar: PropTypes.string,
      name: PropTypes.string,
      code: PropTypes.string,
    })
  ),
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      docId: PropTypes.string,
      id: PropTypes.string,
      programId: PropTypes.string,
      name_en: PropTypes.string,
      name_ar: PropTypes.string,
      name: PropTypes.string,
    })
  ),
  classes: PropTypes.arrayOf(
    PropTypes.shape({
      docId: PropTypes.string,
      id: PropTypes.string,
      subjectId: PropTypes.string,
      name: PropTypes.string,
      code: PropTypes.string,
    })
  ),
  selectedProgram: PropTypes.string,
  selectedSubject: PropTypes.string,
  selectedClass: PropTypes.string,
  onProgramChange: PropTypes.func,
  onSubjectChange: PropTypes.func,
  onClassChange: PropTypes.func,
  showSubjects: PropTypes.bool,
  showClasses: PropTypes.bool,
  showLabels: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ProgramsSelect;
