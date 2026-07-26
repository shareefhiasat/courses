import React from 'react';
import { getThemedIcon } from '@constants/iconTypes';
import { EXPORT_FORMAT } from '@services/export/official-reports/index.jsx';
import { buildBlobOpenUrl, buildSmartDriveHighlightUrl } from '@utils/exportSuccessUrls';

/**
 * Shared post-export success UI — open blob preview or navigate to Smart Drive.
 */
export default function ExportSuccessPanel({
  successResult,
  t = (k, d) => d || k,
  theme = 'light',
}) {
  if (!successResult) return null;

  const isExcel = successResult.format === EXPORT_FORMAT.EXCEL;
  const filename =
    successResult.filename && String(successResult.filename).toLowerCase().endsWith('.xlsx')
      ? successResult.filename
      : `${successResult.filename || 'export'}.xlsx`;
  const blobUrl = buildBlobOpenUrl(successResult);
  const smartDriveUrl = buildSmartDriveHighlightUrl(successResult.fileId, {
    filename: successResult.filename,
    folderId: successResult.folderId,
  });

  const buttonBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.1rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.88rem',
    minWidth: '140px',
    flex: '1 1 180px',
    maxWidth: '260px',
  };

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '1.5rem 1rem',
        marginBottom: '1.5rem',
        background: 'rgba(34, 197, 94, 0.08)',
        border: '1px solid rgba(34, 197, 94, 0.25)',
        borderRadius: '0.75rem',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
        {getThemedIcon('ui', 'check_circle', 40, theme)}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: '1.05rem',
          marginBottom: '0.5rem',
          color: 'var(--text-primary, #1f2937)',
        }}
      >
        {t('report_exported_successfully', 'Report exported successfully')}
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          color: 'var(--muted, #6b7280)',
          marginBottom: '1rem',
          wordBreak: 'break-all',
        }}
      >
        {successResult.filename}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
        }}
      >
        {blobUrl && (
          <a
            href={blobUrl}
            {...(isExcel
              ? { download: filename }
              : { target: '_blank', rel: 'noreferrer' })}
            style={{
              ...buttonBase,
              background: 'var(--color-primary, #800020)',
              color: '#fff',
            }}
          >
            {getThemedIcon('ui', isExcel ? 'download' : 'external_link', 16, 'white')}
            {isExcel
              ? t('download_exported_file', 'Download exported file')
              : t('open_exported_file', 'Open exported file')}
          </a>
        )}
        {smartDriveUrl && (
          <a
            href={smartDriveUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              ...buttonBase,
              background: '#fff',
              color: 'var(--color-primary, #800020)',
              border: '2px solid var(--color-primary, #800020)',
            }}
          >
            {getThemedIcon('ui', 'folder', 16, theme)}
            {t('open_in_smart_drive', 'Open in Smart Drive')}
          </a>
        )}
      </div>
    </div>
  );
}
