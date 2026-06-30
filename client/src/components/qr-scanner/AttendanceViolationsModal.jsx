import React from 'react';
import Modal from '@components/ui/Modal';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';

const AttendanceViolationsModal = ({
  isOpen,
  onClose,
  subjects,
  selectedSubjects,
  setSelectedSubjects,
  selectedViolationTypes,
  setSelectedViolationTypes,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  exportFormat,
  setExportFormat,
  mode = 'standard',
  onExport,
  isExporting,
  t,
  lang,
}) => {
  const isOfficial = mode === 'official';

  const toggleSubject = (subjectId) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  const toggleViolationType = (type) => {
    setSelectedViolationTypes({
      ...selectedViolationTypes,
      [type]: !selectedViolationTypes[type],
    });
  };

  const canExport =
    selectedSubjects.length > 0 &&
    Object.values(selectedViolationTypes).some((v) => v) &&
    dateFrom &&
    dateTo &&
    dateFrom <= dateTo;

  const handleExport = () => {
    if (!canExport) return;
    onExport(selectedSubjects, selectedViolationTypes, {
      dateFrom,
      dateTo,
      format: isOfficial ? exportFormat : EXPORT_FORMAT.EXCEL,
      mode,
    });
    onClose();
  };

  const modalTitle = isOfficial
    ? t('attendance_official') || 'Attendance Official'
    : t('attendance_violations_report') || 'Attendance Violations Report';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="large" showCloseButton>
      <div style={{ padding: '1.5rem 0' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              color: 'var(--text-primary, #1f2937)',
            }}
          >
            {t('date_range') || 'Date range'}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('date_from') || 'Date from'}</span>
              <input
                type="date"
                value={dateFrom || ''}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '0.375rem',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('date_to') || 'Date to'}</span>
              <input
                type="date"
                value={dateTo || ''}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '0.375rem',
                }}
              />
            </label>
          </div>
          {dateFrom && dateTo && dateFrom > dateTo && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--color-danger, #dc2626)' }}>
              {t('date_range_invalid') || 'End date must be on or after start date'}
            </p>
          )}
        </div>

        {isOfficial && setExportFormat && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: 'var(--text-primary, #1f2937)',
              }}
            >
              {t('export_format') || 'Export format'}
            </h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="violationsExportFormat"
                  checked={exportFormat === EXPORT_FORMAT.PDF}
                  onChange={() => setExportFormat(EXPORT_FORMAT.PDF)}
                />
                <span>{t('export_pdf') || 'PDF (watermarked)'}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="violationsExportFormat"
                  checked={exportFormat === EXPORT_FORMAT.EXCEL}
                  onChange={() => setExportFormat(EXPORT_FORMAT.EXCEL)}
                />
                <span>{t('export_excel') || 'Excel (no watermark)'}</span>
              </label>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: 'var(--text-primary, #1f2937)',
            }}
          >
            {t('select_subjects_for_report') || 'Select subjects for report'}
          </h3>
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
            }}
          >
            {subjects.length === 0 ? (
              <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted, #6b7280)' }}>
                {t('no_subjects_available') || 'No subjects available'}
              </p>
            ) : (
              subjects.map((subject) => (
                <label
                  key={subject.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.75rem',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    borderRadius: '0.375rem',
                    background: selectedSubjects.includes(subject.id)
                      ? 'var(--background-secondary, #f3f4f6)'
                      : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer', margin: 0 }}
                  />
                  <span style={{ color: 'var(--text-primary, #1f2937)', fontSize: '0.95rem' }}>
                    {lang === 'ar'
                      ? subject.nameAr || subject.nameEn || subject.name || subject.code
                      : subject.nameEn || subject.name || subject.code}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: 'var(--text-primary, #1f2937)',
            }}
          >
            {t('select_violation_types') || 'Select violation types'}
          </h3>
          <div
            style={{
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
            }}
          >
            {[
              { key: 'absentNoExcuse', label: t('absent_no_excuse') || 'Absent (No Excuse)' },
              { key: 'absentWithExcuse', label: t('absent_with_excuse') || 'Absent excused' },
              { key: 'excusedLeave', label: t('excused_leave') || 'Excused Leave' },
              { key: 'late', label: t('late') || 'Late' },
              { key: 'humanCase', label: t('human_case') || 'Human Case' },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  borderRadius: '0.375rem',
                  background: selectedViolationTypes[key]
                    ? 'var(--background-secondary, #f3f4f6)'
                    : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedViolationTypes[key]}
                  onChange={() => toggleViolationType(key)}
                  style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer', margin: 0 }}
                />
                <span style={{ color: 'var(--text-primary, #1f2937)', fontSize: '0.95rem' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border, #e5e7eb)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: '0.5rem',
              cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !canExport}
            style={{
              padding: '0.75rem 1.5rem',
              background: isExporting || !canExport ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: isExporting || !canExport ? 'not-allowed' : 'pointer',
            }}
          >
            {isExporting
              ? t('exporting') || 'Exporting...'
              : isOfficial
                ? exportFormat === EXPORT_FORMAT.PDF
                  ? t('export_pdf') || 'Export PDF'
                  : t('export_excel') || 'Export Excel'
                : t('export_excel') || 'Export Excel'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AttendanceViolationsModal;
