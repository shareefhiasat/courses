import { getThemedIcon } from './iconTypes';
import { info, error, warn, debug } from '../services/utils/logger.js';

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

// Colors for difficulty levels
export const DIFFICULTY_COLORS = {
  [DIFFICULTY_TYPES.BEGINNER]: '#10b981', // Green
  [DIFFICULTY_TYPES.INTERMEDIATE]: '#f59e0b', // Yellow
  [DIFFICULTY_TYPES.ADVANCED]: '#ef4444' // Red
};

// Icons for difficulty levels
export const DIFFICULTY_ICONS = {
  [DIFFICULTY_TYPES.BEGINNER]: getThemedIcon('difficulty', 'beginner'),
  [DIFFICULTY_TYPES.INTERMEDIATE]: getThemedIcon('difficulty', 'intermediate'),
  [DIFFICULTY_TYPES.ADVANCED]: getThemedIcon('difficulty', 'advanced')
};

// Helper functions
export const getDifficultyLabel = (type) => {
  return DIFFICULTY_LABELS[type] || type;
};

export const getDifficultyColor = (type) => {
  return DIFFICULTY_COLORS[type] || '#6b7280';
};

export const getDifficultyIcon = (type) => {
  return DIFFICULTY_ICONS[type] || getThemedIcon('difficulty', 'default');
};

export const isValidDifficultyType = (type) => {
  return Object.values(DIFFICULTY_TYPES).includes(type);
};

export const getDifficultyLevel = (type) => {
  const levels = {
    [DIFFICULTY_TYPES.BEGINNER]: 1,
    [DIFFICULTY_TYPES.INTERMEDIATE]: 2,
    [DIFFICULTY_TYPES.ADVANCED]: 3
  };

  return levels[type] || 2;
};

export const compareDifficulty = (type1, type2) => {
  return getDifficultyLevel(type1) - getDifficultyLevel(type2);
};

// Get difficulty configuration
export const getDifficultyConfig = (type) => {
  return {
    type,
    label: DIFFICULTY_LABELS[type] || type,
    color: DIFFICULTY_COLORS[type] || '#6b7280',
    icon: DIFFICULTY_ICONS[type] || getThemedIcon('difficulty', 'default'),
    level: getDifficultyLevel(type)
  };
};

export const getDifficultyOptionsForDropdown = () => {
  return Object.entries(DIFFICULTY_LABELS).map(([key, value]) => ({
    value: key,
    label: value
  }));
};

export default {
  DIFFICULTY_TYPES,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_ICONS,
  getDifficultyLabel,
  getDifficultyColor,
  getDifficultyIcon,
  isValidDifficultyType,
  getDifficultyLevel,
  compareDifficulty,
  getDifficultyConfig,
  getDifficultyOptionsForDropdown
};
