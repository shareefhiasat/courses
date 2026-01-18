/**
 * Timezone Utilities for Qatar (UTC+3)
 * Default system timezone for all date/time operations
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

// Qatar timezone constant
export const QATAR_TIMEZONE = 'Asia/Qatar'; // UTC+3
export const QATAR_UTC_OFFSET = '+03:00';

/**
 * Get current date/time in Qatar timezone
 * @returns {Date} Date object in Qatar timezone
 */
export function getQatarNow() {
  return toZonedTime(new Date(), QATAR_TIMEZONE);
}

/**
 * Convert UTC timestamp to Qatar timezone for display
 * @param {Date|Timestamp|string|number} date - Date to convert
 * @returns {Date} Date in Qatar timezone
 */
export function toQatarTime(date) {
  if (!date) return null;
  
  // Handle Firestore Timestamp
  if (date?.toDate && typeof date.toDate === 'function') {
    return toZonedTime(date.toDate(), QATAR_TIMEZONE);
  }
  
  // Handle Date object
  if (date instanceof Date) {
    return toZonedTime(date, QATAR_TIMEZONE);
  }
  
  // Handle timestamp (seconds or milliseconds)
  if (typeof date === 'number') {
    const timestamp = date < 10000000000 ? date * 1000 : date; // Convert seconds to milliseconds if needed
    return toZonedTime(new Date(timestamp), QATAR_TIMEZONE);
  }
  
  // Handle string
  if (typeof date === 'string') {
    return toZonedTime(new Date(date), QATAR_TIMEZONE);
  }
  
  return null;
}

/**
 * Format date in Qatar timezone for display
 * @param {Date|Timestamp|string|number} date - Date to format
 * @param {string} formatString - date-fns format string (default: 'dd/MM/yyyy, HH:mm')
 * @returns {string} Formatted date string
 */
export function formatQatarDate(date, formatString = 'dd/MM/yyyy, HH:mm') {
  if (!date) return 'N/A';
  
  const qatarDate = toQatarTime(date);
  if (!qatarDate) return 'N/A';
  
  return format(qatarDate, formatString);
}

/**
 * Format date in Qatar timezone (date only)
 * @param {Date|Timestamp|string|number} date - Date to format
 * @returns {string} Formatted date string (dd/MM/yyyy)
 */
export function formatQatarDateOnly(date) {
  return formatQatarDate(date, 'dd/MM/yyyy');
}

/**
 * Format date in Qatar timezone (time only)
 * @param {Date|Timestamp|string|number} date - Date to format
 * @returns {string} Formatted time string (HH:mm)
 */
export function formatQatarTimeOnly(date) {
  return formatQatarDate(date, 'HH:mm');
}

/**
 * Get serverTimestamp for Firestore (saves as UTC)
 * This should be used for all createdAt/updatedAt fields
 * The date will be stored as UTC in Firestore, then converted to Qatar timezone for display
 */
export { serverTimestamp };

/**
 * Create a Timestamp from Qatar timezone (converts to UTC for storage)
 * @param {Date} qatarDate - Date in Qatar timezone
 * @returns {Timestamp} Firestore Timestamp (UTC)
 */
export function qatarDateToTimestamp(qatarDate) {
  if (!qatarDate) return null;
  
  // Convert Qatar time to UTC
  const utcDate = fromZonedTime(qatarDate, QATAR_TIMEZONE);
  return Timestamp.fromDate(utcDate);
}

