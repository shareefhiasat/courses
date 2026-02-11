/**
 * Difficulty Types Constants
 * Centralized difficulty levels for activities, quizzes, and assessments
 */

import { getThemedIcon } from '@constants/iconTypes';

// Difficulty level types
export const DIFFICULTY_TYPES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate', 
  ADVANCED: 'advanced'
};

// Labels for UI display
export const DIFFICULTY_LABELS = {
  [DIFFICULTY_TYPES.BEGINNER]: 'Beginner',
  [DIFFICULTY_TYPES.INTERMEDIATE]: 'Intermediate',
  [DIFFICULTY_TYPES.ADVANCED]: 'Advanced'
};

// Arabic labels for bilingual support
export const DIFFICULTY_LABELS_AR = {
  [DIFFICULTY_TYPES.BEGINNER]: 'مبتدئ',
  [DIFFICULTY_TYPES.INTERMEDIATE]: 'متوسط',
  [DIFFICULTY_TYPES.ADVANCED]: 'متقدم'
};

// Options for dropdown/select components
export const DIFFICULTY_OPTIONS = Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
  value,
  label
}));

// Get difficulty configuration with icon and text
export const getDifficultyConfig = (type, theme = 'light', lang = 'en') => {
  const labels = lang === 'ar' ? DIFFICULTY_LABELS_AR : DIFFICULTY_LABELS;
  
  const typeConfig = {
    [DIFFICULTY_TYPES.BEGINNER]: { 
      icon: 'star', 
      text: labels[DIFFICULTY_TYPES.BEGINNER] 
    },
    [DIFFICULTY_TYPES.INTERMEDIATE]: { 
      icon: 'zap', 
      text: labels[DIFFICULTY_TYPES.INTERMEDIATE] 
    },
    [DIFFICULTY_TYPES.ADVANCED]: { 
      icon: 'trophy', 
      text: labels[DIFFICULTY_TYPES.ADVANCED] 
    }
  };
  
  const config = typeConfig[type] || { 
    icon: 'star', 
    text: type || 'Unknown' 
  };
  
  return {
    ...config,
    icon: config.icon
  };
};

// Get difficulty options for dropdown with icons
export const getDifficultyOptionsForDropdown = (theme = 'light', lang = 'en') => {
  return Object.entries(DIFFICULTY_TYPES).map(([key, value]) => {
    const config = getDifficultyConfig(value, theme, lang);
    return {
      value,
      label: config.text,
      icon: getThemedIcon('ui', config.icon, 16, theme)
    };
  });
};
