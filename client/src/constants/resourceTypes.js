import { getIconWithColor } from './iconTypes';
import { RESOURCE_TYPES } from '../utils/sharedTypes';
import { info, error, warn, debug } from '../services/utils/logger.js';

// Labels for UI display
export const RESOURCE_TYPE_LABELS = {
  [RESOURCE_TYPES.ALL]: 'All Types',
  [RESOURCE_TYPES.VIDEO]: 'Video',
  [RESOURCE_TYPES.LINK]: 'Link',
  [RESOURCE_TYPES.DOCUMENT]: 'Document'
};

// Arabic labels for bilingual support
export const RESOURCE_TYPE_LABELS_AR = {
  [RESOURCE_TYPES.ALL]: 'جميع الأنواع',
  [RESOURCE_TYPES.VIDEO]: 'فيديو',
  [RESOURCE_TYPES.LINK]: 'رابط',
  [RESOURCE_TYPES.DOCUMENT]: 'مستند'
};

// Colors for resource types
export const RESOURCE_TYPE_COLORS = {
  [RESOURCE_TYPES.ALL]: '#6b7280',
  [RESOURCE_TYPES.VIDEO]: '#ef4444',
  [RESOURCE_TYPES.LINK]: '#3b82f6',
  [RESOURCE_TYPES.DOCUMENT]: '#10b981'
};

// Helper functions
export const getResourceTypeLabel = (type, lang = 'en') => {
  if (lang === 'ar') {
    return RESOURCE_TYPE_LABELS_AR[type] || type;
  }
  return RESOURCE_TYPE_LABELS[type] || type;
};

export const getResourceTypeColor = (type) => {
  return RESOURCE_TYPE_COLORS[type] || '#6b7280';
};

export const getResourceTypeIcon = (type, theme = 'light', lang = 'en') => {
  const color = getResourceTypeColor(type);
  const iconMap = {
    all: getIconWithColor('ui', 'folder', 16, color),
    video: getIconWithColor('ui', 'video', 16, color),
    link: getIconWithColor('ui', 'link', 16, color),
    document: getIconWithColor('ui', 'file_text', 16, color)
  };
  return iconMap[type] || getIconWithColor('ui', 'file', 16, color);
};

export const getResourceTypeConfig = (type, theme = 'light', lang = 'en') => {
  return {
    label: getResourceTypeLabel(type, lang),
    color: getResourceTypeColor(type),
    icon: getResourceTypeIcon(type, theme, lang)
  };
};

export const isValidResourceType = (type) => {
  return Object.values(RESOURCE_TYPES).includes(type);
};

export default {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_LABELS_AR,
  RESOURCE_TYPE_COLORS,
  getResourceTypeLabel,
  getResourceTypeColor,
  getResourceTypeIcon,
  getResourceTypeConfig,
  isValidResourceType
};
