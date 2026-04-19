import React from 'react';
import Modal from '@components/ui/Modal';

const AttendanceViolationsModal = ({
  isOpen,
  onClose,
  subjects,
  selectedSubjects,
  setSelectedSubjects,
  selectedViolationTypes,
  setSelectedViolationTypes,
  onExport,
  isExporting,
  t,
  theme,
  lang
}) => {
  const toggleSubject = (subjectId) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  const toggleViolationType = (type) => {
    setSelectedViolationTypes({
      ...selectedViolationTypes,
      [type]: !selectedViolationTypes[type]
    });
  };

  const handleExport = () => {
    if (selectedSubjects.length === 0) {
      return;
    }
    onExport(selectedSubjects, selectedViolationTypes);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('attendance_violations_report') || 'attendance violations report'}
      size="large"
      showCloseButton={true}
    >
      <div style={{ padding: '1.5rem 0' }}>
        {/* Subject Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            marginBottom: '1rem',
            color: 'var(--text-primary, #1f2937)'
          }}>
            {t('select_subjects_for_report') || 'select subjects for report'}
          </h3>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.5rem',
            padding: '0.5rem'
          }}>
            {subjects.length === 0 ? (
              <p style={{ 
                padding: '1rem', 
                textAlign: 'center',
                color: 'var(--text-muted, #6b7280)'
              }}>
                {t('no_subjects_available') || 'No subjects available'}
              </p>
            ) : (
              subjects.map(subject => (
                <label
                  key={subject.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderRadius: '0.375rem',
                    transition: 'background 0.2s',
                    background: selectedSubjects.includes(subject.id) ? 'var(--background-secondary, #f3f4f6)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedSubjects.includes(subject.id)) {
                      e.currentTarget.style.background = 'var(--background-secondary, #f9fafb)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedSubjects.includes(subject.id)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--text-primary, #1f2937)' }}>
                    {lang === 'ar' ? (subject.nameAr || subject.nameEn || subject.name || subject.code) : (subject.nameEn || subject.name || subject.code)}
                  </span>
                </label>
              ))
            )}
          </div>
          {selectedSubjects.length === 0 && (
            <p style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem',
              color: 'var(--color-danger, #dc2626)'
            }}>
              {t('please_select_at_least_one_subject') || 'Please select at least one subject for the report'}
            </p>
          )}
        </div>

        {/* Violation Type Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            marginBottom: '1rem',
            color: 'var(--text-primary, #1f2937)'
          }}>
            {t('select_violation_types') || 'select violation types'}
          </h3>
          <div style={{
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.5rem',
            padding: '0.5rem'
          }}>
            {[
              { key: 'absentNoExcuse', label: t('absent_no_excuse') || 'Absent (No Excuse)' },
              { key: 'absentWithExcuse', label: t('absent_with_excuse') || 'Absent (With Excuse)' },
              { key: 'excusedLeave', label: t('excused_leave') || 'Excused Leave' },
              { key: 'late', label: t('late') || 'Late' },
              { key: 'humanCase', label: t('human_case') || 'Human Case' }
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  borderRadius: '0.375rem',
                  transition: 'background 0.2s',
                  background: selectedViolationTypes[key] ? 'var(--background-secondary, #f3f4f6)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!selectedViolationTypes[key]) {
                    e.currentTarget.style.background = 'var(--background-secondary, #f9fafb)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedViolationTypes[key]) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedViolationTypes[key]}
                  onChange={() => toggleViolationType(key)}
                  style={{ marginRight: '0.75rem', cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--text-primary, #1f2937)' }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
          {!Object.values(selectedViolationTypes).some(v => v) && (
            <p style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem',
              color: 'var(--color-danger, #dc2626)'
            }}>
              {t('please_select_at_least_one_violation_type') || 'Please select at least one violation type'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border, #e5e7eb)'
        }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: 'var(--text-primary, #1f2937)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.5 : 1
            }}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedSubjects.length === 0 || !Object.values(selectedViolationTypes).some(v => v)}
            style={{
              padding: '0.75rem 1.5rem',
              background: (isExporting || selectedSubjects.length === 0 || !Object.values(selectedViolationTypes).some(v => v))
                ? '#94a3b8'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: (isExporting || selectedSubjects.length === 0 || !Object.values(selectedViolationTypes).some(v => v))
                ? 'not-allowed'
                : 'pointer',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
            }}
          >
            {isExporting ? (t('exporting') || 'Exporting...') : (t('export_excel') || 'Export (Excel)')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AttendanceViolationsModal;
