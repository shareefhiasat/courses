import React, { useEffect } from 'react';
import Modal from '@components/ui/Modal';
import DatePicker from '@components/ui/DatePicker/DatePicker';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import OfficialExportFormatPicker from './OfficialExportFormatPicker.jsx';
import ExportSuccessPanel from '@components/export/ExportSuccessPanel.jsx';

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
  theme = 'currentColor',
  successResult = null,
}) => {
  const isOfficial = mode === 'official';

  useEffect(() => {
    if (isOpen && isOfficial && setExportFormat) {
      setExportFormat(EXPORT_FORMAT.PDF);
    }
  }, [isOpen, isOfficial, setExportFormat]);

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
    if (!isOfficial) {
      onClose();
    }
  };

  const modalTitle = isOfficial
    ? t('attendance_official')
    : t('attendance_violations_report');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="large" showCloseButton>
      <div style={{ padding: '1.5rem 0' }}>
        {successResult ? (
          <>
            <ExportSuccessPanel successResult={successResult} t={t} theme={theme} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary, #1f2937)',
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </>
        ) : (
        <>
        {/* Row 1: Date Range + Export Format */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary, #1f2937)', paddingTop: '0.65rem', flexShrink: 0 }}>
              {t('date_range', 'Date Range')}:
            </span>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <DatePicker
                value={dateFrom || ''}
                onChange={setDateFrom}
                theme={theme}
                fullWidth
              />
              <DatePicker
                value={dateTo || ''}
                onChange={setDateTo}
                theme={theme}
                fullWidth
              />
            </div>
          </div>
          {dateFrom && dateTo && dateFrom > dateTo && (
            <p style={{ marginTop: '-1rem', marginBottom: '1rem', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger, #dc2626)' }}>
              {t('date_range_invalid')}
            </p>
          )}

          {isOfficial && setExportFormat && (
            <OfficialExportFormatPicker
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              t={t}
              theme={theme}
              showLabel={false}
            />
          )}
        </div>

        {/* Row 2: Subjects + Violations side-by-side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'var(--text-primary, #1f2937)',
              }}
            >
              {t('select_subjects_for_report').charAt(0).toUpperCase() + t('select_subjects_for_report').slice(1)}
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
                  {t('no_subjects_available')}
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

          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'var(--text-primary, #1f2937)',
              }}
            >
              {t('select_violation_types').charAt(0).toUpperCase() + t('select_violation_types').slice(1)}
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
              {[
                { key: 'absentNoExcuse', label: t('absent_no_excuse') },
                { key: 'absentWithExcuse', label: t('absent_with_excuse') },
                { key: 'excusedLeave', label: t('excused_leave') },
                { key: 'late', label: t('late') },
                { key: 'humanCase', label: t('human_case') },
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
              color: 'var(--text-primary, #1f2937)',
            }}
          >
            {t('cancel')}
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
              ? t('exporting')
              : isOfficial
                ? exportFormat === EXPORT_FORMAT.PDF
                  ? t('export_pdf')
                  : t('export_excel')
                : t('export_excel')}
          </button>
        </div>
        </>
        )}
      </div>
    </Modal>
  );
};

export default AttendanceViolationsModal;
