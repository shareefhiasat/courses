import { info, error, warn, debug } from '@services/utils/logger.js';
import {
  QATAR_TIMEZONE,
  formatStandard as fmtStandard,
  formatFull as fmtFull,
  formatDateShort as fmtShort,
  formatLongDate as fmtLongDate,
  formatTimeWithSeconds as fmtTimeSec,
  formatForDateTimeInput as fmtInput,
  formatRelative as fmtRelative,
  getQatarNow as fmtQatarNow,
  formatDateTime as fmtDateTime,
} from './date-formatter.js';

export { QATAR_TIMEZONE };
export const QATAR_UTC_OFFSET = '+03:00';

/**
 * Get current date/time in Qatar timezone
 * @returns {Date} Date object representing current Qatar time
 */
export function getQatarNow() {
  return fmtQatarNow();
}

/**
 * Format date and time as "dd/MM/yyyy, hh:mm a" in Qatar timezone
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string e.g. "29/06/2026, 07:44 AM"
 */
export function formatQatarDateTime(date) {
  return fmtDateTime(date);
}

/**
 * Format date in STANDARD Qatar format: "FEB 7, 2026 at 5:01:45 PM"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatQatarStandard(date) {
  return fmtStandard(date);
}

/**
 * Format date in FULL Qatar format with UTC offset: "February 7, 2026 at 5:01:45 PM UTC+3"
 * This is used for storing dates in Firebase as formatted strings
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string with UTC offset
 */
export function formatQatarFull(date) {
  return fmtFull(date);
}

/**
 * Get current Qatari timestamp as formatted string for storage
 * @returns {string} Current date/time in format: "February 7, 2026 at 5:01:45 PM UTC+3"
 */
export function getQatarTimestampString() {
  return formatQatarFull(getQatarNow());
}

/**
 * Format date for form inputs (datetime-local)
 * Returns format: "2026-02-11T15:30"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Date string for form input
 */
export function formatQatarForInput(date) {
  return fmtInput(date);
}

/**
 * Parse date from form input (datetime-local)
 * Creates a Date object in Qatar timezone
 * @param {string} dateString - Date string from form input
 * @returns {Date} Date object in Qatar timezone
 */
export function parseQatarFromInput(dateString) {
  if (!dateString) return null;
  
  // Parse the input as if it's Qatar time
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  // Adjust for Qatar timezone (subtract 3 hours to get proper UTC representation)
  return new Date(date.getTime() - (3 * 60 * 60 * 1000));
}

/**
 * Create Firestore Timestamp from Qatar date
 * @param {Date|string|number} date - Date in Qatar timezone
 * @returns {Timestamp} Firestore Timestamp
 */
export function qatarDateToTimestamp(date) {
  if (!date) return null;
  
  let dateObj;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = date < 10000000000 ? new Date(date * 1000) : new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) return null;
  
  // Import dynamically to avoid circular dependencies
  const { Timestamp } = require('firebase/firestore');
  return new Timestamp(dateObj);
}

/**
 * Convert Firestore Timestamp to Qatar standard format
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {string} Formatted date string
 */
export function timestampToQatarStandard(timestamp) {
  if (!timestamp) return '';
  return formatQatarStandard(timestamp);
}

/**
 * Get relative time in Qatar timezone (e.g., "2 minutes ago")
 * @param {Date|string|number} date - Date to compare
 * @returns {string} Relative time string
 */
export function getQatarTimeAgo(date) {
  return fmtRelative(date, 'en');
}

/**
 * Legacy compatibility functions - DEPRECATED
 * These exist only to prevent breaking changes during migration
 */
export function formatQatarDate(date) {
  warn('formatQatarDate is deprecated. Use formatQatarStandard instead.');
  return formatQatarStandard(date);
}

export function toQatarTime(date) {
  console.warn('toQatarTime is deprecated. Dates should already be in Qatar time.');
  return date;
}

/**
 * Format date in short format: "Feb 7, 2026"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Short date string
 */
export function formatQatarShort(date) {
  return fmtShort(date, 'en');
}

/**
 * Format date only: "February 7, 2026"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Date only string
 */
export function formatQatarDateOnly(date) {
  return fmtLongDate(date, 'en');
}

/**
 * Format time only: "5:01:45 PM"
 * @param {Date|string|number} date - Date to format
 * @returns {string} Time only string
 */
export function formatQatarTimeOnly(date) {
  return fmtTimeSec(date, 'en');
}

// Export the main function as default for easy importing
export default formatQatarStandard;
