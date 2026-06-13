/**
 * Scheduling Calendar Constants
 * Centralized configuration for status options, labels, and transitions
 * Note: Labels should be localized using t() function in the component
 */

export const SESSION_STATUS_OPTIONS = [
  { value: 'all', labelKey: 'all' },
  { value: 'scheduled', labelKey: 'scheduled', icon: '📅' },
  { value: 'in_progress', labelKey: 'in_progress', icon: '⏳' },
  { value: 'completed', labelKey: 'completed', icon: '✅' },
  { value: 'cancelled', labelKey: 'cancelled', icon: '❌' }
];

export const STATUS_TRANSITIONS = {
  scheduled: [
    { value: 'in_progress', labelKey: 'in_progress', icon: '⏳' },
    { value: 'cancelled', labelKey: 'cancelled', icon: '❌' }
  ],
  in_progress: [
    { value: 'completed', labelKey: 'completed', icon: '✅' },
    { value: 'cancelled', labelKey: 'cancelled', icon: '❌' }
  ],
  cancelled: [
    { value: 'scheduled', labelKey: 'restore_to_scheduled', icon: '📅' }
  ],
  completed: [] // No valid transitions from completed
};

export const STATUS_COLORS = {
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444'
};

export const STATUS_BORDER_COLORS = {
  scheduled: '#2563eb',
  in_progress: '#d97706',
  completed: '#059669',
  cancelled: '#dc2626'
};
