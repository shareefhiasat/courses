import React from 'react';
import Joyride from 'react-joyride';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';

/**
 * Wrapper around react-joyride with consistent styling and locale labels.
 * Props: run, steps, callback (from useTour hook)
 */
const TourOverlay = ({ run, steps, callback }) => {
  const { t } = useLang();
  const { theme } = useTheme();

  return (
    <Joyride
      continuous
      run={run}
      steps={steps}
      disableScrolling={false}
      scrollOffset={100}
      scrollToFirstStep
      spotlightClicks={false}
      callback={callback}
      locale={{
        back: t('tour_back') || 'Back',
        close: t('tour_close') || 'Close',
        last: t('tour_finish') || 'Finish',
        next: t('tour_next') || 'Next',
        skip: t('tour_skip') || 'Skip',
      }}
      styles={{
        options: {
          primaryColor: 'var(--color-primary, #800020)',
          textColor: theme === 'dark' ? '#e5e7eb' : '#111',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
          overlayColor: 'rgba(0,0,0,0.45)',
          arrowColor: theme === 'dark' ? '#1f2937' : '#fff',
          zIndex: 10000,
        },
      }}
    />
  );
};

export default TourOverlay;
