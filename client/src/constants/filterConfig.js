import { getThemedIcon } from './iconTypes';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Centralized filter configuration for all pages
 * Provides consistent filter structure and localization
 */
export const FILTER_CONFIGS = {
  // Program filters
  programs: {
    allOption: {
      value: 'all',
      label: 'all_programs',
      icon: 'filter'
    },
    placeholder: 'select_program',
    dependencies: ['subjects', 'classes']
  },

  // Subject filters
  subjects: {
    allOption: {
      value: 'all',
      label: 'all_subjects',
      icon: 'filter'
    },
    placeholder: 'select_subject',
    dependencies: ['classes']
  },

  // Class filters
  classes: {
    allOption: {
      value: 'all',
      label: 'all_classes',
      icon: 'filter'
    },
    placeholder: 'select_class',
    dependencies: []
  },

  // Activity filters
  activities: {
    allOption: {
      value: 'all',
      label: 'all_activities',
      icon: 'filter'
    },
    placeholder: 'select_activity',
    dependencies: []
  },

  // Student filters
  students: {
    allOption: {
      value: 'all',
      label: 'all_students',
      icon: 'filter'
    },
    placeholder: 'select_student',
    dependencies: []
  },

  // Year filters
  years: {
    allOption: {
      value: 'all',
      label: 'all_years',
      icon: 'calendar'
    },
    placeholder: 'select_year',
    dependencies: []
  },

  // Term filters
  terms: {
    allOption: {
      value: 'all',
      label: 'all_terms',
      icon: 'calendar'
    },
    placeholder: 'select_term',
    dependencies: []
  },

  // Duration filters
  duration: {
    allOption: {
      value: 60,
      label: 'default_duration',
      icon: 'clock'
    },
    placeholder: 'select_duration',
    dependencies: []
  },

  // Retake settings
  retake: {
    allOption: {
      value: 'all',
      label: 'all_retake_settings',
      icon: 'filter'
    },
    placeholder: 'retake_setting',
    options: [
      { value: 'yes', label: 'retake_allowed' },
      { value: 'no', label: 'no_retake' }
    ]
  },

  // Difficulty settings
  difficulty: {
    allOption: {
      value: 'all',
      label: 'all_difficulties',
      icon: 'filter'
    },
    placeholder: 'difficulty_level',
    options: [
      { value: 'beginner', label: 'beginner' },
      { value: 'intermediate', label: 'intermediate' },
      { value: 'advanced', label: 'advanced' }
    ]
  },

  // Image settings
  hasImage: {
    allOption: {
      value: 'all',
      label: 'all_image_settings',
      icon: 'filter'
    },
    placeholder: 'image_setting',
    options: [
      { value: 'yes', label: 'has_image' },
      { value: 'no', label: 'no_image' }
    ]
  },

  // Status settings
  isOptional: {
    allOption: {
      value: 'all',
      label: 'all_status_types',
      icon: 'filter'
    },
    placeholder: 'status_type',
    options: [
      { value: 'yes', label: 'optional' },
      { value: 'no', label: 'required' }
    ]
  },

  // Featured settings
  isFeatured: {
    allOption: {
      value: 'all',
      label: 'all_featured_settings',
      icon: 'filter'
    },
    placeholder: 'featured_setting',
    options: [
      { value: 'yes', label: 'featured' },
      { value: 'no', label: 'not_featured' }
    ]
  },

  // Submission settings
  requiresSubmission: {
    allOption: {
      value: 'all',
      label: 'all_submission_settings',
      icon: 'filter'
    },
    placeholder: 'submission_setting',
    options: [
      { value: 'yes', label: 'requires_submission' },
      { value: 'no', label: 'no_submission' }
    ]
  }
};

/**
 * Get filter configuration by key
 */
export const getFilterConfig = (filterKey) => {
  return FILTER_CONFIGS[filterKey];
};

/**
 * Generate filter options with localization and theme
 */
export const generateFilterOptions = (config, data, theme, t) => {
  const allOption = config.allOption;
  
  const options = [
    {
      value: allOption.value,
      label: t(allOption.label) || allOption.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: getThemedIcon('ui', allOption.icon, 14, theme)
    },
    ...(data || []).map(item => ({
      value: item.id || item.docId || item.value,
      label: item.name_en || item.name_ar || item.code || item.label || item.id
    }))
  ];

  if (config.options) {
    options.push(...config.options.map(option => ({
      value: option.value,
      label: t(option.label) || option.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    })));
  }

  return options;
};

/**
 * Get localized placeholder text
 */
export const getFilterPlaceholder = (config, t, additionalText = '') => {
  const placeholder = t(config.placeholder) || config.placeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return additionalText ? `${placeholder} (${additionalText})` : placeholder;
};
