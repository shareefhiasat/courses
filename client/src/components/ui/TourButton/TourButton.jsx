import React from 'react';
import { useLang } from '@contexts/LangContext';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';

/**
 * Small "? Tour" button that starts the guided tour for the current page.
 * Usage: <TourButton onStart={() => setRun(true)} />
 */
const TourButton = ({ onStart, style = {} }) => {
  const { t } = useLang();
  return (
    <ColoredTooltip title={t('tour_help')}>
      <button
        type="button"
        onClick={onStart}
        aria-label={t('tour_help')}
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
        <span>{t('tour_help')}</span>
      </button>
    </ColoredTooltip>
  );
};

export default TourButton;
