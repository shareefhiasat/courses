/**
 * Unified Date/Time Formatter
 *
 * Single source of truth for all date/time display formatting in the LMS.
 *
 * Standards:
 * - Latin (Western) numerals only — no Arabic-Hindi digits
 * - DD/MM/YYYY for dates (slash separator)
 * - 12-hour hh:mm AM/PM for times (ص/م for Arabic)
 * - Qatar timezone (Asia/Qatar, UTC+3) by default
 * - English month names in all locales
 */

import { toZonedTime, format } from 'date-fns-tz';

export const QATAR_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Qatar';

/**
 * Normalize various date input types to a Date object.
 * @param {Date|string|number|null|undefined} date
 * @returns {Date|null}
 */
function toDate(date) {
  if (date == null || date === '') return null;

  // Firestore Timestamp
  if (typeof date === 'object' && date?.toDate && typeof date.toDate === 'function') {
    return date.toDate();
  }

  // Unix seconds vs milliseconds
  if (typeof date === 'number') {
    return new Date(date < 1e12 ? date * 1000 : date);
  }

  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Replace AM/PM with Arabic letters ص/م.
 * @param {string} formatted
 * @returns {string}
 */
function applyArabicAmPm(formatted) {
  return formatted
    .replace(/\bAM\b/g, 'ص')
    .replace(/\bPM\b/g, 'م');
}

/**
 * Core formatting function.
 * @param {Date|string|number|null|undefined} dateValue
 * @param {string} formatStr - date-fns format string
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone=QATAR_TIMEZONE]
 * @returns {string}
 */
function formatDateCore(dateValue, formatStr, lang = 'en', timezone = QATAR_TIMEZONE) {
  const d = toDate(dateValue);
  if (!d) return '';

  const zoned = toZonedTime(d, timezone);
  const formatted = format(zoned, formatStr, { timeZone: timezone });
  return lang === 'ar' ? applyArabicAmPm(formatted) : formatted;
}

/**
 * Format date as DD/MM/YYYY
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "07/02/2026"
 */
export function formatDate(date, lang = 'en', timezone) {
  return formatDateCore(date, 'dd/MM/yyyy', lang, timezone);
}

/**
 * Format time as hh:mm a (12-hour with AM/PM)
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "05:01 PM" or "05:01 م"
 */
export function formatTime(date, lang = 'en', timezone) {
  return formatDateCore(date, 'hh:mm a', lang, timezone);
}

/**
 * Format time as 24-hour HH:mm (Latin numerals)
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "08:30"
 */
export function formatTime24(date, lang = 'en', timezone) {
  return formatDateCore(date, 'HH:mm', lang, timezone);
}

/**
 * Format time with seconds as hh:mm:ss a
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "05:01:45 PM" or "05:01:45 م"
 */
export function formatTimeWithSeconds(date, lang = 'en', timezone) {
  return formatDateCore(date, 'hh:mm:ss a', lang, timezone);
}

/**
 * Format date and time as "dd/MM/yyyy, hh:mm a"
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "07/02/2026, 05:01 PM"
 */
export function formatDateTime(date, lang = 'en', timezone) {
  return formatDateCore(date, 'dd/MM/yyyy, hh:mm a', lang, timezone);
}

/**
 * Format date and time with seconds as "dd/MM/yyyy hh:mm:ss a"
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "07/02/2026 05:01:45 PM"
 */
export function formatDateTimeWithSeconds(date, lang = 'en', timezone) {
  return formatDateCore(date, 'dd/MM/yyyy hh:mm:ss a', lang, timezone);
}

/**
 * Format date as "dd MMM yyyy" (short month name)
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "07 Feb 2026"
 */
export function formatDateShort(date, lang = 'en', timezone) {
  return formatDateCore(date, 'dd MMM yyyy', lang, timezone);
}

/**
 * Format date with full month name as "dd MMMM yyyy"
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "07 February 2026"
 */
export function formatLongDate(date, lang = 'en', timezone) {
  return formatDateCore(date, 'dd MMMM yyyy', lang, timezone);
}

/**
 * Format date with weekday as "EEE, dd/MM/yyyy"
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "Sat, 07/02/2026"
 */
export function formatDateWithWeekday(date, lang = 'en', timezone) {
  return formatDateCore(date, 'EEE, dd/MM/yyyy', lang, timezone);
}

/**
 * Format date and time with weekday as "EEE, dd/MM/yyyy hh:mm a"
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "Sat, 07/02/2026 05:01 PM"
 */
export function formatDateTimeWithWeekday(date, lang = 'en', timezone) {
  return formatDateCore(date, 'EEE, dd/MM/yyyy hh:mm a', lang, timezone);
}

/**
 * Format date for datetime-local input: "yyyy-MM-dd'T'HH:mm"
 * @param {Date|string|number|null|undefined} date
 * @param {string} [timezone]
 * @returns {string} e.g. "2026-02-07T17:01"
 */
export function formatForDateTimeInput(date, timezone) {
  return formatDateCore(date, "yyyy-MM-dd'T'HH:mm", 'en', timezone);
}

/**
 * Format date for date input: "yyyy-MM-dd"
 * @param {Date|string|number|null|undefined} date
 * @param {string} [timezone]
 * @returns {string} e.g. "2026-02-07"
 */
export function formatForDateInput(date, timezone) {
  return formatDateCore(date, 'yyyy-MM-dd', 'en', timezone);
}

/**
 * Format date in full Qatar standard format: "MMM d, yyyy at h:mm:ss a"
 * Used for storage strings in Firebase.
 * @param {Date|string|number|null|undefined} date
 * @returns {string} e.g. "Feb 7, 2026 at 5:01:45 PM"
 */
export function formatStandard(date) {
  return formatDateCore(date, 'MMM d, yyyy \'at\' h:mm:ss a', 'en');
}

/**
 * Format date in full Qatar format with UTC offset: "MMMM d, yyyy at h:mm:ss a 'UTC+3'"
 * Used for storage strings in Firebase.
 * @param {Date|string|number|null|undefined} date
 * @returns {string} e.g. "February 7, 2026 at 5:01:45 PM UTC+3"
 */
export function formatFull(date) {
  return formatDateCore(date, 'MMMM d, yyyy \'at\' h:mm:ss a \'UTC+3\'', 'en');
}

/**
 * Relative time formatting.
 * @param {Date|string|number|null|undefined} date
 * @param {'en'|'ar'} [lang='en']
 * @param {string} [timezone]
 * @returns {string} e.g. "just now", "5 mins ago", "yesterday", or full date
 */
export function formatRelative(date, lang = 'en', timezone) {
  const d = toDate(date);
  if (!d) return '';

  const now = new Date();
  const zonedNow = toZonedTime(now, timezone || QATAR_TIMEZONE);
  const zonedDate = toZonedTime(d, timezone || QATAR_TIMEZONE);

  const diffMs = zonedNow - zonedDate;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (diffSeconds < 172800) return 'yesterday';

  return formatDateCore(date, 'dd/MM/yyyy, hh:mm a', lang, timezone);
}

/**
 * Get current date/time in Qatar timezone.
 * @returns {Date}
 */
export function getQatarNow() {
  return toZonedTime(new Date(), QATAR_TIMEZONE);
}

/**
 * Get date components (day, month, year, etc.) in Qatar timezone.
 * Use this instead of raw date.getDate()/getMonth()/getHours() which use browser timezone.
 * @param {Date|string|number|null|undefined} dateValue
 * @returns {{year:number,month:number,day:number,hours:number,minutes:number,seconds:number,dayOfWeek:number}|null}
 */
export function getQatarDateParts(dateValue) {
  const d = toDate(dateValue);
  if (!d) return null;
  const zoned = toZonedTime(d, QATAR_TIMEZONE);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
    hours: zoned.getHours(),
    minutes: zoned.getMinutes(),
    seconds: zoned.getSeconds(),
    dayOfWeek: zoned.getDay(),
  };
}

export default {
  formatDate,
  formatTime,
  formatTime24,
  formatTimeWithSeconds,
  formatDateTime,
  formatDateTimeWithSeconds,
  formatDateShort,
  formatLongDate,
  formatDateWithWeekday,
  formatDateTimeWithWeekday,
  formatForDateTimeInput,
  formatForDateInput,
  formatStandard,
  formatFull,
  formatRelative,
  getQatarNow,
  getQatarDateParts,
  QATAR_TIMEZONE,
};
