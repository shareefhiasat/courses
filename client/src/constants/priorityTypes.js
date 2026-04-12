/**
 * Priority Types Constants
 * 
 * Maps priority values to display properties and styling
 */

export const PRIORITY_TYPES = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4,
  CRITICAL: 5
};

export const PRIORITY_LABELS = {
  en: {
    [PRIORITY_TYPES.LOW]: 'Low',
    [PRIORITY_TYPES.NORMAL]: 'Normal',
    [PRIORITY_TYPES.HIGH]: 'High',
    [PRIORITY_TYPES.URGENT]: 'Urgent',
    [PRIORITY_TYPES.CRITICAL]: 'Critical'
  },
  ar: {
    [PRIORITY_TYPES.LOW]: 'منخفض',
    [PRIORITY_TYPES.NORMAL]: 'عادي',
    [PRIORITY_TYPES.HIGH]: 'مرتفع',
    [PRIORITY_TYPES.URGENT]: 'عاجل',
    [PRIORITY_TYPES.CRITICAL]: 'حرج'
  }
};

export const PRIORITY_COLORS = {
  [PRIORITY_TYPES.LOW]: '#16a34a',      // Green
  [PRIORITY_TYPES.NORMAL]: '#2563eb',   // Blue
  [PRIORITY_TYPES.HIGH]: '#ea580c',     // Orange
  [PRIORITY_TYPES.URGENT]: '#dc2626',   // Red
  [PRIORITY_TYPES.CRITICAL]: '#991b1b'  // Dark Red
};

export const PRIORITY_CODES = {
  [PRIORITY_TYPES.LOW]: 'low',
  [PRIORITY_TYPES.NORMAL]: 'normal',
  [PRIORITY_TYPES.HIGH]: 'high',
  [PRIORITY_TYPES.URGENT]: 'urgent',
  [PRIORITY_TYPES.CRITICAL]: 'critical'
};

// Helper functions
export const getPriorityLabel = (priorityId, lang = 'en') => {
  return PRIORITY_LABELS[lang]?.[priorityId] || PRIORITY_LABELS.en[priorityId] || 'Unknown';
};

export const getPriorityColor = (priorityId) => {
  return PRIORITY_COLORS[priorityId] || '#6b7280'; // Default gray
};

export const getPriorityCode = (priorityId) => {
  return PRIORITY_CODES[priorityId] || 'normal';
};

export const getPriorityConfig = (priorityId) => {
  return {
    id: priorityId,
    label: getPriorityLabel(priorityId, 'en'),
    labelAr: getPriorityLabel(priorityId, 'ar'),
    color: getPriorityColor(priorityId),
    code: getPriorityCode(priorityId)
  };
};

export default {
  PRIORITY_TYPES,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_CODES,
  getPriorityLabel,
  getPriorityColor,
  getPriorityCode,
  getPriorityConfig
};
