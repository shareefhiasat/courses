import React, { useMemo } from 'react';
import Joyride from 'react-joyride';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { MODE_TYPES } from '@utils/sharedTypes';
import TourTooltip from '@ui/TourTooltip/TourTooltip';
import { info, error, warn, debug } from '@services/utils/logger.js';

const JoyrideTour = ({ 
  run, 
  onTourFinish, 
  mode, 
  activityType, 
  tourSeenKey,
  steps = [],
  customStyles = {}
}) => {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const tooltipComponent = useMemo(() => TourTooltip({ tourSeenKey }), [tourSeenKey]);

  // Get primary color from CSS variable
  const getPrimaryColor = () => {
    if (typeof window === 'undefined') return '#800020';
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue('--color-primary').trim() || '#800020';
  };

  const primaryColor = getPrimaryColor();

  // Default steps for HomePage
  const defaultSteps = [
    {
      target: '[data-tour="mode-switcher"]',
      content: t('joyride_tour_mode_switcher'),
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="stats"]',
      content: t('joyride_tour_stats'),
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="search"]',
      content: t('joyride_tour_search'),
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="filters"]',
      content: t('joyride_tour_filters'),
      disableBeacon: true,
      placement: 'top'
    },
    {
      target: '[data-tour="status-filters"]',
      content: t('joyride_tour_status_filters'),
      disableBeacon: true,
      placement: 'top'
    },
    {
      target: '[data-tour="difficulty-filters"]',
      content: t('joyride_tour_difficulty_filters'),
      disableBeacon: true,
      placement: 'top'
    },
    ...(mode === MODE_TYPES.ACTIVITIES ? [{
      target: '[data-tour="mode-switcher"]',
      content: t('joyride_tour_mode_switcher'),
      disableBeacon: true,
      placement: 'bottom'
    }, {
      target: '[data-tour="activity-type-tabs"]',
      content: t('joyride_tour_activity_type_tabs'),
      disableBeacon: true,
      placement: 'bottom'
    }, {
      target: '[data-tour="category-tabs"]',
      content: t('joyride_tour_category_tabs'),
      disableBeacon: true,
      placement: 'bottom'
    }] : []),
    ...(mode === MODE_TYPES.ACTIVITIES && activityType === 'quiz' ? [{
      target: '[data-tour="class-filter"]',
      content: t('joyride_tour_class_filter'),
      disableBeacon: true,
      placement: 'top',
      disableScrolling: false
    }] : []),
    ...(mode === 'resources' ? [{
      target: '[data-tour="resource-type-filters"]',
      content: t('joyride_tour_resource_type_filters'),
      disableBeacon: true,
      placement: 'top'
    }] : []),
    {
      target: '[data-tour="cards-grid"]',
      content: t('joyride_tour_cards_grid'),
      disableBeacon: true,
      placement: 'top',
      disableScrolling: false
    }
  ];

  const tourSteps = steps.length > 0 ? steps : defaultSteps;

  const defaultStyles = {
    options: {
      primaryColor: primaryColor,
      textColor: isDark ? '#fff' : '#000',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      arrowColor: isDark ? '#1a1a1a' : '#fff',
      zIndex: 10000
    }
  };

  const handleCallback = (data) => {
    debug('[JoyrideTour] Joyride callback:', data);
    
    if (data.status === 'finished' || data.status === 'skipped' || data.action === 'close') {
      info('[JoyrideTour] Tour finished/skipped');
      
      // Save to localStorage if key is provided
      if (tourSeenKey) {
        try {
          localStorage.setItem(tourSeenKey, 'true');
          debug('[JoyrideTour] Saved tour seen key:', tourSeenKey);
        } catch (e) {
          error('[JoyrideTour] Failed to save tour seen key:', e);
        }
      }
      
      // Call parent callback
      if (onTourFinish) {
        onTourFinish();
      }
    }
  };

  return (
    <Joyride
      continuous
      run={run}
      disableScrolling={false}
      scrollOffset={100}
      scrollToFirstStep={true}
      showSkipButton={true}
      showProgress={true}
      spotlightClicks={false}
      steps={tourSteps}
      tooltipComponent={tooltipComponent}
      locale={{
        back: t('joyride_back'),
        close: t('joyride_close'),
        last: t('joyride_last'),
        next: t('joyride_next'),
        skip: t('joyride_skip')
      }}
      styles={{ ...defaultStyles, ...customStyles }}
      callback={handleCallback}
    />
  );
};

export default JoyrideTour;

