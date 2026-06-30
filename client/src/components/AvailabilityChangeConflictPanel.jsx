import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

const panelStyle = (theme, tone) => {
  const tones = {
    error: {
      bg: theme === 'dark' ? '#450a0a' : '#fef2f2',
      border: theme === 'dark' ? '#991b1b' : '#fecaca',
      text: theme === 'dark' ? '#fecaca' : '#991b1b'
    },
    info: {
      bg: theme === 'dark' ? '#1e3a5f' : '#eff6ff',
      border: theme === 'dark' ? '#1d4ed8' : '#bfdbfe',
      text: theme === 'dark' ? '#bfdbfe' : '#1e40af'
    }
  };
  return tones[tone] || tones.error;
};

export default function AvailabilityChangeConflictPanel({
  validation,
  theme = 'light',
  t,
  loading = false
}) {
  if (loading) {
    const colors = panelStyle(theme, 'info');
    return (
      <div style={{
        padding: '0.625rem 0.75rem',
        borderRadius: '0.375rem',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        fontSize: 'var(--font-size-sm)',
        color: colors.text,
        marginBottom: '1rem'
      }}>
        {t('checking_availability_conflicts')}
      </div>
    );
  }

  if (!validation) return null;

  if (validation.valid) {
    const colors = panelStyle(theme, 'info');
    return (
      <div style={{
        padding: '0.625rem 0.75rem',
        borderRadius: '0.375rem',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        fontSize: 'var(--font-size-sm)',
        color: colors.text,
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Info size={14} />
          {t('availability_change_safe')}
        </div>
      </div>
    );
  }

  const conflicts = validation.conflicts || [];
  if (!conflicts.length) return null;

  const colors = panelStyle(theme, 'error');

  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      borderRadius: '0.375rem',
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      fontSize: 'var(--font-size-sm)',
      color: colors.text,
      marginBottom: '1rem'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <AlertCircle size={14} />
        {t('availability_change_blocked_title')}
      </div>
      <p style={{ margin: '0 0 0.5rem 0' }}>{t('availability_change_blocked_hint')}</p>
      <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {conflicts.map((c, i) => (
          <li key={`${c.sessionId || c.type}-${i}`}>{c.message}</li>
        ))}
      </ul>
      {validation.blockingCount > conflicts.length && (
        <div style={{ marginTop: '0.375rem', opacity: 0.9 }}>
          {t('availability_change_more_conflicts', { count: validation.blockingCount - conflicts.length })}
        </div>
      )}
    </div>
  );
}
