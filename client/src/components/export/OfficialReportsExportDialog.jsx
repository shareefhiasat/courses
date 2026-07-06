import React, { useState } from 'react';
import { Button, Card, CardBody } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import ExportProgressToast from '@components/export/ExportProgressToast.jsx';
import ExportSuccessPanel from '@components/export/ExportSuccessPanel.jsx';
import { OFFICIAL_REPORT_BUTTONS } from './officialReportButtons.js';

/**
 * Shared export dialog shell — PDF/Excel picker + report type buttons.
 * Used by marks, scheduling, and other official report entry points.
 */
const OfficialReportsExportDialog = ({
  isOpen,
  onClose,
  onExport,
  modes = OFFICIAL_REPORT_BUTTONS.map((b) => b.mode),
  isButtonDisabled = () => false,
  lang = 'ar',
  t = (k, d) => d || k,
  theme = 'light',
  exporting = false,
  exportingMode = null,
  successResult = null,
}) => {
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMAT.PDF);

  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const visibleButtons = OFFICIAL_REPORT_BUTTONS.filter((b) => modes.includes(b.mode));
  const exportingLabel = exportingMode
    ? visibleButtons.find((b) => b.mode === exportingMode)?.[isAr ? 'labelAr' : 'labelEn']
    : undefined;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .report-btn svg { stroke: rgba(255,255,255,0.9) !important; }
      `}</style>
      <ExportProgressToast
        visible={exporting}
        message={
          exportingMode
            ? `${t('exporting_report', 'Exporting report...')} — ${exportingLabel}`
            : undefined
        }
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <Card style={{ maxWidth: '600px', margin: '1rem', width: '100%' }}>
          <CardBody>
            {!successResult && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                dir="ltr"
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                }}
              >
                {[EXPORT_FORMAT.PDF, EXPORT_FORMAT.EXCEL].map((format) => (
                  <label
                    key={format}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border:
                        exportFormat === format
                          ? '2px solid var(--color-primary, #800020)'
                          : '1px solid var(--border, #e5e7eb)',
                      background:
                        exportFormat === format ? 'rgba(128, 0, 32, 0.08)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      checked={exportFormat === format}
                      onChange={() => setExportFormat(format)}
                    />
                    {getThemedIcon(
                      'ui',
                      format === EXPORT_FORMAT.PDF ? 'file_signature' : 'file_text',
                      16,
                      theme
                    )}
                    <span>
                      {format === EXPORT_FORMAT.PDF ? t('export_pdf', 'PDF') : t('export_excel', 'Excel')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            )}

            {successResult ? (
              <ExportSuccessPanel successResult={successResult} t={t} theme={theme} />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.625rem',
                  marginBottom: '1.5rem',
                }}
              >
                {visibleButtons.map((button) => {
                  const isDisabled = isButtonDisabled(button.mode);
                  const isExportingThis = exportingMode === button.mode;

                  return (
                    <button
                      key={button.mode}
                      type="button"
                      className="report-btn"
                      onClick={() => !isDisabled && !exporting && onExport(button.mode, exportFormat)}
                      disabled={isDisabled || exporting}
                      style={{
                        padding: '0.5rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: button.mode === 'warning-final' ? '2px solid white' : 'none',
                        background: button.color,
                        color: 'white',
                        cursor: isDisabled || exporting ? 'not-allowed' : 'pointer',
                        opacity: isDisabled || (exporting && !isExportingThis) ? 0.4 : 1,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s',
                        minHeight: 'auto',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled && !exporting) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {isExportingThis ? (
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        getThemedIcon('ui', button.icon, 14, theme)
                      )}
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        {isAr ? button.labelAr : button.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={exporting}
                style={{ color: 'var(--text-primary, #1f2937)' }}
              >
                {t('cancel', 'Cancel')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default OfficialReportsExportDialog;
