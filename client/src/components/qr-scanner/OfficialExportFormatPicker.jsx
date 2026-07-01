import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';

/**
 * PDF / Excel format picker for official report modals.
 * Uses LTR layout so PDF stays first regardless of UI language direction.
 */
export default function OfficialExportFormatPicker({
  exportFormat,
  setExportFormat,
  t,
  theme,
}) {
  const options = [
    {
      value: EXPORT_FORMAT.PDF,
      label: t('export_pdf') || 'PDF (watermarked)',
      icon: 'file_signature',
    },
    {
      value: EXPORT_FORMAT.EXCEL,
      label: t('export_excel') || 'Excel (no watermark)',
      icon: 'file_text',
    },
  ];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
        {t('export_format') || 'Export format'}
      </label>
      <div
        dir="ltr"
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border:
                exportFormat === opt.value
                  ? '2px solid var(--color-primary, #0d9488)'
                  : '1px solid var(--border, #e5e7eb)',
              background:
                exportFormat === opt.value ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="officialExportFormat"
              checked={exportFormat === opt.value}
              onChange={() => setExportFormat(opt.value)}
            />
            {getThemedIcon('ui', opt.icon, 16, theme)}
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
