import { getThemedIcon } from './iconTypes';
import { info, error, warn, debug } from '../services/utils/logger.js';

// Difficulty level types
export const DIFFICULTY_TYPES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Labels for UI display
export const DIFFICULTY_LABELS = {
  [DIFFICULTY_TYPES.EASY]: 'Easy',
  [DIFFICULTY_TYPES.MEDIUM]: 'Medium',
  [DIFFICULTY_TYPES.HARD]: 'Hard'
};

// Colors for difficulty levels
export const DIFFICULTY_COLORS = {
  [DIFFICULTY_TYPES.EASY]: '#10b981', // Green
  [DIFFICULTY_TYPES.MEDIUM]: '#f59e0b', // Yellow
  [DIFFICULTY_TYPES.HARD]: '#ef4444' // Red
};

// Icons for difficulty levels
export const DIFFICULTY_ICONS = {
  [DIFFICULTY_TYPES.EASY]: getThemedIcon('difficulty', 'easy'),
  [DIFFICULTY_TYPES.MEDIUM]: getThemedIcon('difficulty', 'medium'),
  [DIFFICULTY_TYPES.HARD]: getThemedIcon('difficulty', 'hard')
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
    [DIFFICULTY_TYPES.EASY]: 1,
    [DIFFICULTY_TYPES.MEDIUM]: 2,
    [DIFFICULTY_TYPES.HARD]: 3
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
