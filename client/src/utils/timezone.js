/**
 * Timezone Utilities for Qatar (UTC+3)
 * Default system timezone for all date/time operations
 */

import moment from 'moment-timezone';

// Qatar timezone constant
export const QATAR_TIMEZONE = 'Asia/Qatar'; // UTC+3
export const QATAR_UTC_OFFSET = '+03:00';

/**
 * Get current date/time in Qatar timezone
 * @returns {Date} Date object in Qatar timezone
 */
export function getQatarNow() {
  return moment.tz(QATAR_TIMEZONE).toDate();
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
    return moment.tz(date.toDate(), QATAR_TIMEZONE).toDate();
  }
  
  // Handle Date object
  if (date instanceof Date) {
    return moment.tz(date, QATAR_TIMEZONE).toDate();
  }
  
  // Handle timestamp (seconds or milliseconds)
  if (typeof date === 'number') {
    const timestamp = date < 10000000000 ? date * 1000 : date; // Convert seconds to milliseconds if needed
    return moment.tz(new Date(timestamp), QATAR_TIMEZONE).toDate();
  }
  
  // Handle string
  if (typeof date === 'string') {
    return moment.tz(date, QATAR_TIMEZONE).toDate();
  }
  
  return null;
}

/**
 * Format date in Qatar timezone for display
 * @param {Date|Timestamp|string|number} date - Date to format
 * @param {string} format - Moment.js format string (default: 'DD/MM/YYYY, HH:mm')
 * @returns {string} Formatted date string
 */
export function formatQatarDate(date, format = 'DD/MM/YYYY, HH:mm') {
  if (!date) return 'N/A';
  
  const qatarDate = toQatarTime(date);
  if (!qatarDate) return 'N/A';
  
  return moment(qatarDate).format(format);
}

/**
 * Format date in Qatar timezone (date only)
 * @param {Date|Timestamp|string|number} date - Date to format
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export function formatQatarDateOnly(date) {
  return formatQatarDate(date, 'DD/MM/YYYY');
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
export { serverTimestamp } from 'firebase/firestore';

/**
 * Create a Timestamp from Qatar timezone (converts to UTC for storage)
 * @param {Date} qatarDate - Date in Qatar timezone
 * @returns {Promise<Timestamp>} Firestore Timestamp (UTC)
 */
export async function qatarDateToTimestamp(qatarDate) {
  if (!qatarDate) return null;
  
  const { Timestamp } = await import('firebase/firestore');
  // Convert Qatar time to UTC
  const utcDate = moment.tz(qatarDate, QATAR_TIMEZONE).utc().toDate();
  return Timestamp.fromDate(utcDate);
}

