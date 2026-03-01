import React from 'react';
import Joyride from 'react-joyride';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { MODE_TYPES } from '@utils/sharedTypes';
import logger from '@utils/logger';

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
      content: t('joyride_tour_mode_switcher') || 'Use these tabs to switch between Activities, Resources, and Quizzes',
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="stats"]',
      content: t('joyride_tour_stats') || 'These statistics show counts for completed, pending, required, featured, and bookmarked items',
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="search"]',
      content: t('joyride_tour_search') || 'Use this field to search in titles and descriptions',
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="filters"]',
      content: t('joyride_tour_filters') || 'Use these filters to search and filter items by type, level, and status',
      disableBeacon: true,
      placement: 'top'
    },
    {
      target: '[data-tour="status-filters"]',
      content: t('joyride_tour_status_filters') || 'Use these filters to find completed, pending, required, or bookmarked items',
      disableBeacon: true,
      placement: 'top'
    },
    {
      target: '[data-tour="difficulty-filters"]',
      content: t('joyride_tour_difficulty_filters') || 'Select difficulty level: Beginner, Intermediate, or Advanced',
      disableBeacon: true,
      placement: 'top'
    },
    ...(mode === MODE_TYPES.ACTIVITIES ? [{
      target: '[data-tour="mode-switcher"]',
      content: t('joyride_tour_mode_switcher') || 'Use these tabs to switch between Activities and Resources',
      disableBeacon: true,
      placement: 'bottom'
    }, {
      target: '[data-tour="activity-type-tabs"]',
      content: t('joyride_tour_activity_type_tabs') || 'Select activity type: All, Quiz, Homework, Training, Lab, or Project',
      disableBeacon: true,
      placement: 'bottom'
    }, {
      target: '[data-tour="category-tabs"]',
      content: t('joyride_tour_category_tabs') || 'Select category: All, Programming, Computing, Algorithm, or General',
      disableBeacon: true,
      placement: 'bottom'
    }] : []),
    ...(mode === MODE_TYPES.ACTIVITIES && activityType === 'quiz' ? [{
      target: '[data-tour="class-filter"]',
      content: t('joyride_tour_class_filter') || 'Select a class to view quizzes associated with it',
      disableBeacon: true,
      placement: 'top',
      disableScrolling: false
    }] : []),
    ...(mode === 'resources' ? [{
      target: '[data-tour="resource-type-filters"]',
      content: t('joyride_tour_resource_type_filters') || 'Select resource type: All, Video, Link, or Document',
      disableBeacon: true,
      placement: 'top'
    }] : []),
    {
      target: '[data-tour="cards-grid"]',
      content: t('joyride_tour_cards_grid') || 'These are the cards displaying items. You can click buttons to start, complete, or bookmark',
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
    console.debug('[JoyrideTour] Joyride callback:', data);
    
    if (data.status === 'finished' || data.status === 'skipped') {
      logger.log('[JoyrideTour] Tour finished/skipped');
      
      // Save to localStorage if key is provided
      if (tourSeenKey) {
        try {
          localStorage.setItem(tourSeenKey, 'true');
          console.debug('[JoyrideTour] Saved tour seen key:', tourSeenKey);
        } catch (e) {
          logger.error('[JoyrideTour] Failed to save tour seen key:', e);
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
      spotlightClicks={false}
      steps={tourSteps}
      locale={{
        back: t('joyride_back') || 'Back',
        close: t('joyride_close') || 'Close',
        last: t('joyride_last') || 'Finish',
        next: t('joyride_next') || 'Next',
        skip: t('joyride_skip') || 'Skip'
      }}
      styles={{ ...defaultStyles, ...customStyles }}
      callback={handleCallback}
    />
  );
};

export default JoyrideTour;

