/**
 * Date utility functions for consistent date/time formatting across the application
 * All dates are displayed in Qatar timezone (UTC+3)
 */

import {
  formatDateTime as fmtDateTime,
  formatDate as fmtDate,
  formatTime as fmtTime,
  formatRelative as fmtRelative,
} from './date-formatter.js';

/**
 * Coerce DB/API date values (ISO string, ms, or Unix seconds) for display.
 */
export function coerceDateValue(dateValue) {
  if (dateValue == null || dateValue === '') return null;
  if (typeof dateValue === 'number' && Number.isFinite(dateValue)) {
    return dateValue < 1e12 ? new Date(dateValue * 1000) : new Date(dateValue);
  }
  return dateValue;
}

/**
 * Format date with time in Qatar timezone
 */
export const formatDateTime = (dateValue, lang = 'en', emptyLabel = '—') => {
  const result = fmtDateTime(dateValue, lang);
  return result || emptyLabel;
};

/**
 * Format date only (without time) in Qatar timezone
 */
export const formatDateOnly = (dateValue, lang = 'en') => {
  const result = fmtDate(dateValue, lang);
  return result || '—';
};

/**
 * Format time only in Qatar timezone
 */
export const formatTimeOnly = (dateValue, lang = 'en') => {
  const result = fmtTime(dateValue, lang);
  return result || '—';
};

/**
 * Get relative time in Qatar timezone (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateValue, lang = 'en') => {
  const result = fmtRelative(dateValue, lang);
  return result || '—';
};
