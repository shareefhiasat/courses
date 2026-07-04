import React, { useMemo } from 'react';
import Joyride from 'react-joyride';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getJoyrideBaseProps, getTourStyles } from '@utils/tourConfig';

/**
 * Wrapper around react-joyride with consistent styling and locale labels.
 * Props: run, steps, callback (from useTour hook)
 */
const TourOverlay = ({ run, steps, callback }) => {
  const { t } = useLang();
  const { theme } = useTheme();

  return (
    <Joyride
      {...getJoyrideBaseProps({ theme, t })}
      run={run}
      steps={steps}
      tooltipComponent={useMemo(() => TourTooltip({}), [])}
      callback={callback}
      styles={getTourStyles(theme)}
    />
  );
};

export default TourOverlay;
