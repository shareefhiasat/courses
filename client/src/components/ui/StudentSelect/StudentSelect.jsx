import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Select from '../Select';
import StudentSelectOption from '../StudentSelectOption/StudentSelectOption';
import { getUserStatus, getUserStatusSummary } from '../../../utils/userStatus';
import { useLang } from '@contexts/LangContext';
import { getLocalizedUserName } from '@utils/localizedUserName';

const StudentSelect = ({
  value,
  onChange,
  students = [],
  loading = false,
  disabled = false,
  placeholder = 'Select Student',
  required = false,
  searchable = true,
  className = '',
  enrollments = [],
  filterStatuses = null,
  ...selectProps
}) => {
  const { lang } = useLang();

  // Create enrollments map for fast lookup
  const enrollmentsMap = useMemo(() => {
    const map = {};
    enrollments.forEach(enrollment => {
      const userId = enrollment.userId || enrollment.userDocId;
      if (userId) {
        if (!map[userId]) map[userId] = [];
        map[userId].push(enrollment);
      }
    });
    return map;
  }, [enrollments]);

  // Filter and enrich students with status
  const enrichedStudents = useMemo(() => {
    return students.map(student => {
      const studentId = student.id || student.docId;
      const studentEnrollments = enrollmentsMap[studentId] || [];
      const statusSummary = getUserStatusSummary(student, studentEnrollments);
      
      return {
        ...student,
        status: statusSummary.status,
        statusLabel: statusSummary.label,
        enrollmentCount: statusSummary.enrollmentCount,
        iconProps: statusSummary.iconProps
      };
    }).filter(student => {
      // Filter by status if specified
      if (filterStatuses && Array.isArray(filterStatuses)) {
        return filterStatuses.includes(student.status);
      }
      return true;
    });
  }, [students, enrollmentsMap, filterStatuses]);

  // Create options for Select component
  const options = useMemo(() => {
    const opts = [{ value: '', label: placeholder }];
    
    enrichedStudents.forEach(student => {
      const displayName = getLocalizedUserName(student, lang, student.email || student.id);
      const studentId = student.id || student.docId;
      
      opts.push({
        value: studentId,
        label: (
          <StudentSelectOption
            name={displayName}
            email={student.email}
            status={student.status}
            statusLabel={student.statusLabel}
            enrollmentCount={student.enrollmentCount}
            isDisabled={student.status === 'deleted' || student.status === 'archived'}
          />
        )
      });
    });
    
    return opts;
  }, [enrichedStudents, placeholder, lang]);

  // Handle change with proper value extraction
  const handleChange = useCallback((e) => {
    const newValue = e?.target?.value || e;
    onChange(newValue);
  }, [onChange]);

  return (
    <Select
      value={value}
      onChange={handleChange}
      options={options}
      loading={loading}
      disabled={disabled}
      placeholder={placeholder}
      required={required}
      searchable={searchable}
      className={className}
      {...selectProps}
    />
  );
};

StudentSelect.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  students: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  searchable: PropTypes.bool,
  className: PropTypes.string,
  enrollments: PropTypes.arrayOf(PropTypes.object),
  filterStatuses: PropTypes.arrayOf(PropTypes.string)
};

export default StudentSelect;
