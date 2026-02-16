/**
 * Resource Types Constants
 * Centralized resource types with colors for consistent theming
 */

import { getThemedIcon, getColoredIcon } from '@constants/iconTypes';
import { RESOURCE_TYPES } from '@utils/sharedTypes';

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

// Resource type configuration with colors and icons
export const getResourceTypeConfig = (type, theme = 'light', lang = 'en') => {
  console.log('[getResourceTypeConfig] Called with:', { type, theme, lang });
  
  const labels = lang === 'ar' ? RESOURCE_TYPE_LABELS_AR : RESOURCE_TYPE_LABELS;
  
  const typeConfig = {
    [RESOURCE_TYPES.ALL]: { 
      icon: 'layers', 
      color: null, // Use themed icon
      text: labels[RESOURCE_TYPES.ALL] 
    },
    [RESOURCE_TYPES.VIDEO]: { 
      icon: 'video', 
      color: '#3b82f6', // Blue for video
      text: labels[RESOURCE_TYPES.VIDEO] 
    },
    [RESOURCE_TYPES.LINK]: { 
      icon: 'link', 
      color: '#3b82f6', // Blue for link
      text: labels[RESOURCE_TYPES.LINK] 
    },
    [RESOURCE_TYPES.DOCUMENT]: { 
      icon: 'file', 
      color: null, // Use themed icon
      text: labels[RESOURCE_TYPES.DOCUMENT] 
    }
  };
  
  const config = typeConfig[type] || { 
    icon: 'file', 
    color: null,
    text: type || 'Unknown' 
  };
  
  console.log('[getResourceTypeConfig] Config selected:', config);
  
  const finalIcon = config.color 
    ? getColoredIcon('ui', config.icon, 14, config.color, theme)
    : getThemedIcon('ui', config.icon, 14, theme);
    
  console.log('[getResourceTypeConfig] Final icon generated:', finalIcon, 'with color:', config.color);
  
  return {
    ...config,
    icon: finalIcon
  };
};

// Get resource type options for dropdown with icons
export const getResourceTypeOptionsForDropdown = (theme = 'light', lang = 'en') => {
  return Object.entries(RESOURCE_TYPES).map(([key, value]) => {
    const config = getResourceTypeConfig(value, theme, lang);
    return {
      value,
      label: config.text,
      icon: config.icon
    };
  });
};
