import React from 'react';
import { useLang } from '@contexts/LangContext';

export default function MaintenanceModePage() {
  const { t, isRTL } = useLang();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg, #f8fafc)',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          padding: '40px 32px',
          borderRadius: 16,
          background: 'var(--panel, #ffffff)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid var(--border, #e2e8f0)',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text, #1e293b)', marginBottom: 12 }}>
          {t('maintenance_title') || 'Under Maintenance'}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--muted, #64748b)', lineHeight: 1.5 }}>
          {t('maintenance_message') || 'We are currently performing maintenance. Please check back later.'}
        </p>
      </div>
    </div>
  );
}
