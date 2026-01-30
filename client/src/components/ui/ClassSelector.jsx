import React, { useState, useEffect, useMemo } from 'react';
import { Select } from '@ui';

const ClassSelector = ({
  programs = [],
  subjects = [],
  classes = [],
  values = {},
  onChange = {},
  prefix = '',
  disabled = false,
  compact = false,
  showAllOption = true,
  required = false,
  t = (key) => key,
  lang = 'en'
}) => {
  // Helper to get prefixed state keys
  const getStateKey = (key) => prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
  const getSetterKey = (key) => prefix ? `set${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : `set${key.charAt(0).toUpperCase() + key.slice(1)}`;

  // Get current values
  const programValue = values[getStateKey('program')] || '';
  const subjectValue = values[getStateKey('subject')] || '';
  const classValue = values[getStateKey('class')] || '';

  // Get setters
  const setProgram = onChange[getSetterKey('program')] || (() => {});
  const setSubject = onChange[getSetterKey('subject')] || (() => {});
  const setClass = onChange[getSetterKey('class')] || (() => {});

  // Filter subjects based on selected program
  const filteredSubjects = useMemo(() => {
    if (!programValue || programValue === 'all') {
      return subjects;
    }
    return subjects.filter(subject => subject.programId === programValue);
  }, [programValue, subjects]);

  // Filter classes based on selected subject and program
  const filteredClasses = useMemo(() => {
    let result = classes;
    
    // Filter by program
    if (programValue && programValue !== 'all') {
      result = result.filter(cls => {
        if (!cls.subjectId) return false;
        const subject = subjects.find(s => (s.docId || s.id) === cls.subjectId);
        if (!subject) return false;
        return subject.programId === programValue;
      });
    }
    
    // Filter by subject
    if (subjectValue && subjectValue !== 'all') {
      result = result.filter(cls => (cls.subjectId || '') === subjectValue);
    }
    
    return result;
  }, [programValue, subjectValue, classes, subjects]);

  // Handle program change
  const handleProgramChange = (value) => {
    setProgram(value);
    // Reset dependent selections
    setSubject('all');
    setClass('all');
  };

  // Handle subject change
  const handleSubjectChange = (value) => {
    setSubject(value);
    // Reset class selection
    setClass('all');
  };

  // Handle class change
  const handleClassChange = (value) => {
    setClass(value);
  };

  // Create options for selects
  const programOptions = useMemo(() => {
    const options = showAllOption ? [{ value: 'all', label: t('all_programs') || 'All Programs' }] : [];
    return [
      ...options,
      ...programs.map(program => ({
        value: program.docId || program.id,
        label: program.name_en || program.name_ar || program.code || program.docId
      }))
    ];
  }, [programs, showAllOption, t]);

  const subjectOptions = useMemo(() => {
    const options = showAllOption ? [{ value: 'all', label: t('all_subjects') || 'All Subjects' }] : [];
    return [
      ...options,
      ...filteredSubjects.map(subject => ({
        value: subject.docId || subject.id,
        label: `${subject.code || ''} - ${subject.name_en || subject.name_ar || subject.docId}`
      }))
    ];
  }, [filteredSubjects, showAllOption, t]);

  const classOptions = useMemo(() => {
    const options = showAllOption ? [{ value: 'all', label: t('all_classes') || 'All Classes' }] : [];
    return [
      ...options,
      ...filteredClasses.map(cls => ({
        value: cls.id || cls.docId,
        label: cls.name || cls.code || cls.id
      }))
    ];
  }, [filteredClasses, showAllOption, t]);

  const gridColumns = compact ? 'repeat(auto-fit, minmax(120px, 1fr))' : 'repeat(auto-fit, minmax(140px, 1fr))';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 8 }}>
      {/* Program Selector */}
      <div>
        <Select
          searchable
          value={programValue}
          onChange={(e) => handleProgramChange(e.target.value)}
          options={programOptions}
          placeholder={t('select_program') || 'Select Program'}
          required={required}
          disabled={disabled}
          fullWidth
        />
      </div>

      {/* Subject Selector */}
      <div>
        <Select
          searchable
          value={subjectValue}
          onChange={(e) => handleSubjectChange(e.target.value)}
          options={subjectOptions}
          placeholder={t('select_subject') || 'Select Subject'}
          required={required}
          disabled={disabled || (!programValue || programValue === 'all')}
          fullWidth
        />
      </div>

      {/* Class Selector */}
      <div>
        <Select
          searchable
          value={classValue}
          onChange={(e) => handleClassChange(e.target.value)}
          options={classOptions}
          placeholder={t('select_class') || 'Select Class'}
          required={required}
          disabled={disabled || (!subjectValue || subjectValue === 'all')}
          fullWidth
        />
      </div>
    </div>
  );
};

// Enhanced version with additional features
ClassSelector.Advanced = ({
  programs = [],
  subjects = [],
  classes = [],
  values = {},
  onChange = {},
  prefix = '',
  disabled = false,
  compact = false,
  showAllOption = true,
  required = false,
  showYear = false,
  showTerm = false,
  years = [],
  terms = [],
  t = (key) => key,
  lang = 'en'
}) => {
  // Helper to get prefixed state keys
  const getStateKey = (key) => prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
  const getSetterKey = (key) => prefix ? `set${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : `set${key.charAt(0).toUpperCase() + key.slice(1)}`;

  // Get current values
  const programValue = values[getStateKey('program')] || '';
  const subjectValue = values[getStateKey('subject')] || '';
  const classValue = values[getStateKey('class')] || '';
  const yearValue = values[getStateKey('year')] || '';
  const termValue = values[getStateKey('term')] || '';

  // Get setters
  const setProgram = onChange[getSetterKey('program')] || (() => {});
  const setSubject = onChange[getSetterKey('subject')] || (() => {});
  const setClass = onChange[getSetterKey('class')] || (() => {});
  const setYear = onChange[getSetterKey('year')] || (() => {});
  const setTerm = onChange[getSetterKey('term')] || (() => {});

  // Filter subjects based on selected program
  const filteredSubjects = useMemo(() => {
    if (!programValue || programValue === 'all') {
      return subjects;
    }
    return subjects.filter(subject => subject.programId === programValue);
  }, [programValue, subjects]);

  // Filter classes based on selected subject, program, year, and term
  const filteredClasses = useMemo(() => {
    let result = classes;
    
    // Filter by program
    if (programValue && programValue !== 'all') {
      result = result.filter(cls => {
        if (!cls.subjectId) return false;
        const subject = subjects.find(s => (s.docId || s.id) === cls.subjectId);
        if (!subject) return false;
        return subject.programId === programValue;
      });
    }
    
    // Filter by subject
    if (subjectValue && subjectValue !== 'all') {
      result = result.filter(cls => (cls.subjectId || '') === subjectValue);
    }
    
    // Filter by year
    if (yearValue && yearValue !== 'all') {
      result = result.filter(cls => {
        if (cls.year) return String(cls.year) === yearValue;
        if (cls.term) {
          const parts = cls.term.split(' ');
          if (parts.length > 1) return parts[parts.length - 1] === yearValue;
        }
        return false;
      });
    }
    
    // Filter by term
    if (termValue && termValue !== 'all') {
      result = result.filter(cls => {
        if (cls.term) return cls.term.split(' ')[0] === termValue;
        return false;
      });
    }
    
    return result;
  }, [programValue, subjectValue, yearValue, termValue, classes, subjects]);

  // Handle changes with cascade resets
  const handleProgramChange = (value) => {
    setProgram(value);
    setSubject('all');
    setClass('all');
    if (showYear) setYear('all');
    if (showTerm) setTerm('all');
  };

  const handleSubjectChange = (value) => {
    setSubject(value);
    setClass('all');
    if (showYear) setYear('all');
    if (showTerm) setTerm('all');
  };

  const handleYearChange = (value) => {
    setYear(value);
    setClass('all');
    if (showTerm) setTerm('all');
  };

  const handleTermChange = (value) => {
    setTerm(value);
    setClass('all');
  };

  // Create options
  const programOptions = useMemo(() => {
    const options = showAllOption ? [{ value: 'all', label: t('all_programs') || 'All Programs' }] : [];
    return [
      ...options,
      ...programs.map(program => ({
        value: program.docId || program.id,
        label: program.name_en || program.name_ar || program.code || program.docId
      }))
    ];
  }, [programs, showAllOption, t]);

  const subjectOptions = useMemo(() => {
    const options = showAllOption ? [{ value: 'all', label: t('all_subjects') || 'All Subjects' }] : [];
    return [
      ...options,
      ...filteredSubjects.map(subject => ({
        value: subject.docId || subject.id,
        label: `${subject.code || ''} - ${subject.name_en || subject.name_ar || subject.docId}`
      }))
    ];
  }, [filteredSubjects, showAllOption, t]);

  const classOptions = useMemo(() => {
    const options = showAllOption ? [{ value: 'all', label: t('all_classes') || 'All Classes' }] : [];
    return [
      ...options,
      ...filteredClasses.map(cls => ({
        value: cls.id || cls.docId,
        label: cls.name || cls.code || cls.id
      }))
    ];
  }, [filteredClasses, showAllOption, t]);

  const yearOptions = useMemo(() => {
    const options = showAllOption ? [{ value: 'all', label: t('all_years') || 'All Years' }] : [];
    const uniqueYears = Array.from(new Set(classes.map(c => {
      if (c.year) return String(c.year);
      if (c.term) {
        const parts = c.term.split(' ');
        if (parts.length > 1) return parts[parts.length - 1];
      }
      return null;
    }).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
    
    return [
      ...options,
      ...uniqueYears.map(year => ({ value: year, label: year }))
    ];
  }, [classes, showAllOption, t]);

  const termOptions = useMemo(() => {
    const options = showAllOption ? [{ value: 'all', label: t('all_terms') || 'All Terms' }] : [];
    const uniqueTerms = Array.from(new Set(classes.map(c => {
      if (c.term) return c.term.split(' ')[0];
      return null;
    }).filter(Boolean))).sort();
    
    return [
      ...options,
      ...uniqueTerms.map(term => ({ value: term, label: term }))
    ];
  }, [classes, showAllOption, t]);

  const gridColumns = compact ? 'repeat(auto-fit, minmax(120px, 1fr))' : 'repeat(auto-fit, minmax(140px, 1fr))';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 8 }}>
      {/* Program Selector */}
      <div>
        <Select
          searchable
          value={programValue}
          onChange={(e) => handleProgramChange(e.target.value)}
          options={programOptions}
          placeholder={t('select_program') || 'Select Program'}
          required={required}
          disabled={disabled}
          fullWidth
        />
      </div>

      {/* Subject Selector */}
      <div>
        <Select
          searchable
          value={subjectValue}
          onChange={(e) => handleSubjectChange(e.target.value)}
          options={subjectOptions}
          placeholder={t('select_subject') || 'Select Subject'}
          required={required}
          disabled={disabled || (!programValue || programValue === 'all')}
          fullWidth
        />
      </div>

      {/* Year Selector */}
      {showYear && (
        <div>
          <Select
            searchable
            value={yearValue}
            onChange={(e) => handleYearChange(e.target.value)}
            options={yearOptions}
            placeholder={t('select_year') || 'Select Year'}
            disabled={disabled}
            fullWidth
          />
        </div>
      )}

      {/* Term Selector */}
      {showTerm && (
        <div>
          <Select
            searchable
            value={termValue}
            onChange={(e) => handleTermChange(e.target.value)}
            options={termOptions}
            placeholder={t('select_term') || 'Select Term'}
            disabled={disabled}
            fullWidth
          />
        </div>
      )}

      {/* Class Selector */}
      <div>
        <Select
          searchable
          value={classValue}
          onChange={(e) => handleClassChange(e.target.value)}
          options={classOptions}
          placeholder={t('select_class') || 'Select Class'}
          required={required}
          disabled={disabled || (!subjectValue || subjectValue === 'all')}
          fullWidth
        />
      </div>
    </div>
  );
};

export default ClassSelector;
