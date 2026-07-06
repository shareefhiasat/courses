import React from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '@contexts/LangContext';

/**
 * Bottom-center export progress indicator (matches QR scanner pattern).
 */
export default function ExportProgressToast({ visible = false, message }) {
  const { t } = useLang();
  if (!visible) return null;

  const label = message || t('exporting_report', 'Exporting report...');

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--surface, #fff)',
        padding: '1rem 2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 10001,
        border: '1px solid var(--border, #e5e7eb)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '22px',
          height: '22px',
          border: '3px solid var(--border, #e5e7eb)',
          borderTop: '3px solid var(--color-primary, #10b981)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary, #374151)' }}>
        {label}
      </span>
    </div>,
    document.body
  );
}
