import React from 'react';
import { useLang } from '@contexts/LangContext';

/**
 * Small "? Tour" button that starts the guided tour for the current page.
 * Usage: <TourButton onStart={() => setRun(true)} />
 */
const TourButton = ({ onStart, style = {} }) => {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onStart}
      title={t('tour_help') || 'Start guided tour'}
      aria-label={t('tour_help') || 'Start guided tour'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.35rem 0.65rem',
        fontSize: 'var(--font-size-sm)',
        borderRadius: '6px',
        border: 'none',
        background: 'var(--color-primary, #800020)',
        color: 'white',
        cursor: 'pointer',
        flexShrink: 0,
        ...style,
      }}
    >
      <span style={{ fontWeight: 700 }}>?</span>
      <span>{t('tour_help') || 'Tour'}</span>
    </button>
  );
};

export default TourButton;
