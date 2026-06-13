/**
 * Scheduling Calendar Constants
 * Centralized configuration for status options, labels, and transitions
 */

export const SESSION_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: '📅 Scheduled' },
  { value: 'in_progress', label: '⏳ In Progress' },
  { value: 'completed', label: '✅ Completed' },
  { value: 'cancelled', label: '❌ Cancelled' }
];

export const STATUS_TRANSITIONS = {
  scheduled: [
    { value: 'in_progress', label: '⏳ In Progress' },
    { value: 'cancelled', label: '❌ Cancelled' }
  ],
  in_progress: [
    { value: 'completed', label: '✅ Completed' },
    { value: 'cancelled', label: '❌ Cancelled' }
  ],
  cancelled: [
    { value: 'scheduled', label: '📅 Restore to Scheduled' }
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
