import React from 'react';
import { Select, DatePicker } from '@ui';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '@constants/attendanceTypes';

const AttendanceFilters = ({
  programFilter,
  setProgramFilter,
  subjectFilter,
  setSubjectFilter,
  classFilter,
  setClassFilter,
  yearFilter,
  setYearFilter,
  termFilter,
  setTermFilter,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  programs = [],
  subjects = [],
  classes = [],
  t = (key) => key,
  showDateRange = true,
  showYearTerm = true,
  compact = false
}) => {
  // Filter subjects based on program selection
  const filteredSubjects = subjects.filter(s => 
    programFilter === 'all' || s.programId === programFilter
  );

  // Filter classes based on subject and program selection
  const filteredClasses = classes.filter(c => {
    if (subjectFilter !== 'all' && c.subjectId !== subjectFilter) return false;
    if (programFilter !== 'all') {
      const subject = subjects.find(s => (s.docId || s.id) === c.subjectId);
      if (!subject || subject.programId !== programFilter) return false;
    }
    return true;
  });

  // Extract unique years from classes
  const uniqueYears = Array.from(new Set(classes.map(c => {
    if (c.year) return String(c.year);
    if (c.term && c.term.includes(' ')) {
      const parts = c.term.split(' ');
      if (parts.length > 1) return parts[parts.length - 1];
    }
    return null;
  }).filter(Boolean))).sort((a, b) => Number(b) - Number(a));

  // Extract unique terms from classes
  const uniqueTerms = Array.from(new Set(classes.map(c => {
    if (c.term) {
      // For separate term field, use it directly
      // For combined term field, extract the first part
      return c.term.includes(' ') ? c.term.split(' ')[0] : c.term;
    }
    return null;
  }).filter(Boolean))).sort();

  const gridColumns = compact ? 'repeat(auto-fit, minmax(120px, 1fr))' : 'repeat(auto-fit, minmax(140px, 1fr))';

  return (
    <div style={{ marginBottom: 16, padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 8 }}>
        {/* Program Filter */}
        <div>
          <Select
            searchable
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Programs' },
              ...programs.map(p => ({
                value: p.docId || p.id,
                label: p.name_en || p.name_ar || p.code || p.docId
              }))
            ]}
            fullWidth
            placeholder="Program"
          />
        </div>

        {/* Subject Filter */}
        <div>
          <Select
            searchable
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Subjects' },
              ...filteredSubjects.map(s => ({
                value: s.docId || s.id,
                label: `${s.code || ''} - ${s.name_en || s.name_ar || s.docId}`
              }))
            ]}
            fullWidth
            placeholder="Subject"
          />
        </div>

        {/* Class Filter */}
        <div>
          <Select
            searchable
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all_classes') || 'All Classes' },
              ...filteredClasses.map(c => ({ 
                value: c.id || c.docId, 
                label: c.name || c.code || c.id 
              }))
            ]}
            fullWidth
            placeholder={t('class') || 'Class'}
          />
        </div>

        {/* Year Filter */}
        {showYearTerm && (
          <div>
            <Select
              searchable
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Years' },
                ...uniqueYears.map(year => ({ value: year, label: year }))
              ]}
              fullWidth
              placeholder="Year"
            />
          </div>
        )}

        {/* Term Filter */}
        {showYearTerm && (
          <div>
            <Select
              searchable
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Terms' },
                ...uniqueTerms.map(term => ({ value: term, label: term }))
              ]}
              fullWidth
              placeholder="Term"
            />
          </div>
        )}

        {/* Status Filter */}
        <div>
          <Select
            searchable
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: t('all') || 'All Status' },
              { value: ATTENDANCE_STATUS.PRESENT, label: ATTENDANCE_STATUS_LABELS.present.en },
              { value: ATTENDANCE_STATUS.LATE, label: ATTENDANCE_STATUS_LABELS.late.en },
              { value: ATTENDANCE_STATUS.ABSENT_NO_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_no_excuse.en },
              { value: ATTENDANCE_STATUS.ABSENT_WITH_EXCUSE, label: ATTENDANCE_STATUS_LABELS.absent_with_excuse.en },
              { value: ATTENDANCE_STATUS.EXCUSED_LEAVE, label: ATTENDANCE_STATUS_LABELS.excused_leave.en },
              { value: ATTENDANCE_STATUS.HUMAN_CASE, label: ATTENDANCE_STATUS_LABELS.human_case.en }
            ]}
            fullWidth
            placeholder={t('status') || 'Status'}
          />
        </div>

        {/* Date Range Filters */}
        {showDateRange && (
          <>
            <div>
              <DatePicker
                type="date"
                value={dateFrom ? (dateFrom.includes('/') ? new Date(dateFrom.split('/').reverse().join('-')).toISOString().split('T')[0] : dateFrom) : ''}
                onChange={(iso) => setDateFrom(iso ? new Date(iso).toLocaleDateString('en-CA') : '')}
                placeholder={t('from_date') || 'From Date'}
                fullWidth
              />
            </div>
            <div>
              <DatePicker
                type="date"
                value={dateTo ? (dateTo.includes('/') ? new Date(dateTo.split('/').reverse().join('-')).toISOString().split('T')[0] : dateTo) : ''}
                onChange={(iso) => setDateTo(iso ? new Date(iso).toLocaleDateString('en-CA') : '')}
                placeholder={t('to_date') || 'To Date'}
                fullWidth
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceFilters;
