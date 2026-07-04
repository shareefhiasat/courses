import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '@contexts/LangContext';
import { exportChart } from './chartExport';

const FORMAT_OPTIONS = [
  { value: 'svg', label: 'SVG', desc: 'Vector — scalable, editable' },
  { value: 'png', label: 'PNG', desc: 'Raster — high resolution (2x)' },
  { value: 'jpg', label: 'JPG', desc: 'Raster — compressed, smaller' },
];

function IconDownload({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Modal dialog for choosing chart export format.
 *
 * @param {HTMLElement} target - DOM element containing the chart SVG(s)
 * @param {string} filename - Base filename
 * @param {string} [title] - Optional chart title to embed in export
 * @param {function} onClose - Callback when dialog closes
 */
export default function ChartExportDialog({ target, filename = 'chart', title, onClose }) {
  const { t } = useLang();
  const [selected, setSelected] = useState('svg');
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(() => {
    if (!target) return;
    setExporting(true);
    setTimeout(() => {
      try {
        exportChart(target, { format: selected, filename, title });
      } catch (err) {
        console.error('[ChartExportDialog] Export failed:', err);
      }
      setExporting(false);
      onClose();
    }, 50);
  }, [target, selected, filename, title, onClose]);

  if (!target) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10002,
          background: 'var(--panel, #1f2937)',
          border: '1px solid var(--border, #374151)',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          minWidth: 320,
          maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          fontFamily: 'var(--font-family-sans)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconDownload size={18} color="var(--text, #f9fafb)" />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text, #f9fafb)' }}>
              {t('chart_export') || 'Export Chart'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              padding: 0,
              border: '1px solid var(--border, #374151)',
              borderRadius: 6,
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text, #f9fafb)',
            }}
          >
            <IconClose size={14} />
          </button>
        </div>

        {title && (
          <div style={{
            marginBottom: '0.85rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg, #111827)',
            borderRadius: 6,
            fontSize: '0.8rem',
            color: 'var(--muted, #9ca3af)',
          }}>
            <strong style={{ color: 'var(--text, #f9fafb)' }}>{title}</strong>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {FORMAT_OPTIONS.map(opt => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 0.75rem',
                border: `1.5px solid ${selected === opt.value ? 'var(--accent, #800020)' : 'var(--border, #374151)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                background: selected === opt.value ? 'var(--accent-bg, rgba(128, 0, 32, 0.08))' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="radio"
                name="export-format"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                style={{ accentColor: 'var(--accent, #800020)', width: 16, height: 16 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text, #f9fafb)' }}>{opt.label}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted, #9ca3af)' }}>{opt.desc}</span>
              </div>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border, #374151)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text, #f9fafb)',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 500,
            }}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: 6,
              background: 'var(--accent, #800020)',
              color: '#fff',
              cursor: exporting ? 'wait' : 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <IconDownload size={14} color="#fff" />
            {exporting ? (t('exporting') || 'Exporting...') : (t('download') || 'Download')}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
