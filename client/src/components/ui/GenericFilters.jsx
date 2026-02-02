import React from 'react';
import { Select, DatePicker } from '@ui';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';

const GenericFilters = ({
  filters = [],
  values = {},
  onChange = {},
  prefix = '',
  compact = false,
  t = (key) => key,
  lang = 'en'
}) => {
  // Helper to get the prefixed state key
  const getStateKey = (key) => prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;

  // Helper to get the prefixed setter
  const getSetter = (key) => {
    const setterKey = prefix ? `set${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
    return onChange[setterKey] || (() => {});
  };

  // Helper to get the current value
  const getValue = (key) => {
    const stateKey = getStateKey(key);
    return values[stateKey] || '';
  };

  // Render filter based on type
  const renderFilter = (filter) => {
    const { key, label, type = 'select', options = [], required = false, disabled = false } = filter;
    const currentValue = getValue(key);
    const setter = getSetter(key);

    switch (type) {
      case 'select':
        return (
          <Select
            searchable
            value={currentValue}
            onChange={(e) => setter(e.target.value)}
            options={options}
            fullWidth
            placeholder={label}
            required={required}
            disabled={disabled}
          />
        );

      case 'date':
        return (
          <DatePicker
            type="date"
            value={currentValue ? (currentValue.includes('/') ? new Date(currentValue.split('/').reverse().join('-')).toISOString().split('T')[0] : currentValue) : ''}
            onChange={(iso) => setter(iso ? new Date(iso).toLocaleDateString('en-CA') : '')}
            placeholder={label}
            fullWidth
            disabled={disabled}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => setter(e.target.value)}
            placeholder={label}
            required={required}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--background)',
              color: 'var(--text)'
            }}
          />
        );

      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => setter(e.target.value)}
            placeholder={label}
            required={required}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--background)',
              color: 'var(--text)'
            }}
          />
        );

      default:
        return null;
    }
  };

  const gridColumns = compact ? 'repeat(auto-fit, minmax(120px, 1fr))' : 'repeat(auto-fit, minmax(140px, 1fr))';

  if (filters.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16, padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 8 }}>
        {filters.map((filter, index) => (
          <div key={filter.key || index}>
            {renderFilter(filter)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Predefined filter configurations for common use cases
GenericFilters.configurations = {
  // Attendance filters configuration
  attendance: (programs, subjects, classes, t) => [
    {
      key: 'program',
      label: 'Program',
      type: 'select',
      options: [
        { value: 'all', label: 'All Programs' },
        ...programs.map(p => ({
          value: p.docId || p.id,
          label: p.name_en || p.name_ar || p.code || p.docId
        }))
      ]
    },
    {
      key: 'subject',
      label: 'Subject',
      type: 'select',
      options: [
        { value: 'all', label: 'All Subjects' },
        ...subjects.map(s => ({
          value: s.docId || s.id,
          label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`
        }))
      ]
    },
    {
      key: 'class',
      label: 'Class',
      type: 'select',
      options: [
        { value: 'all', label: t('all_classes') || 'All Classes' },
        ...classes.map(c => ({ 
          value: c.id || c.docId, 
          label: c.name || c.code || c.id 
        }))
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: t('all') || 'All Status' },
        { value: ATTENDANCE_STATUS.PRESENT, label: ATTENDANCE_STATUS_LABELS.present.en },
        { value: ATTENDANCE_STATUS.LATE, label: ATTENDANCE_STATUS_LABELS.late.en },
        { value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_no_excuse.en },
        { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_with_excuse.en },
        { value: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: ATTENDANCE_STATUS_LABELS.excused_leave.en },
        { value: ATTENDANCE_STATUS.HUMAN_CASE, label: ATTENDANCE_STATUS_LABELS.human_case.en }
      ]
    },
    {
      key: 'dateFrom',
      label: t('from_date') || 'From Date',
      type: 'date'
    },
    {
      key: 'dateTo',
      label: t('to_date') || 'To Date',
      type: 'date'
    }
  ],

  // Basic program/subject/class filters
  basic: (programs, subjects, classes, t) => [
    {
      key: 'program',
      label: 'Program',
      type: 'select',
      options: [
        { value: 'all', label: t('all_programs') || 'All Programs' },
        ...programs.map(p => ({
          value: p.docId || p.id,
          label: p.name_en || p.name_ar || p.code || p.docId
        }))
      ]
    },
    {
      key: 'subject',
      label: 'Subject',
      type: 'select',
      options: [
        { value: 'all', label: t('all_subjects') || 'All Subjects' },
        ...subjects.map(s => ({
          value: s.docId || s.id,
          label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`
        }))
      ]
    },
    {
      key: 'class',
      label: 'Class',
      type: 'select',
      options: [
        { value: 'all', label: t('all_classes') || 'All Classes' },
        ...classes.map(c => ({ 
          value: c.id || c.docId, 
          label: c.name || c.code || c.id 
        }))
      ]
    }
  ],

  // Date range filters
  dateRange: (t) => [
    {
      key: 'dateFrom',
      label: t('from_date') || 'From Date',
      type: 'date'
    },
    {
      key: 'dateTo',
      label: t('to_date') || 'To Date',
      type: 'date'
    }
  ]
};

export default GenericFilters;
