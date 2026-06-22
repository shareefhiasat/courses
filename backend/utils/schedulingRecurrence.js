import { v4 as uuidv4 } from 'uuid';

const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const stripTime = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Generate the next occurrence date for a given recurrence pattern.
 * Supports daily, weekly, and custom (specific days) with end by date or count.
 *
 * @param {Object} config
 * @param {Date} config.startDate - First occurrence date
 * @param {string} config.recurrenceType - 'daily' | 'weekly' | 'custom' | 'yearly' | 'monthly'
 * @param {string[]} config.recurrenceDays - Day codes for custom/weekly (e.g., ['Sun','Tue'])
 * @param {Date|null} config.recurrenceEndDate - Optional end date
 * @param {number|null} config.recurrenceCount - Optional max occurrence count
 * @param {number} config.maxOccurrences - Hard safety limit (default 500)
 * @returns {Date[]} Array of occurrence dates
 */
export const expandRecurrenceDates = ({
  startDate,
  recurrenceType,
  recurrenceDays = [],
  recurrenceEndDate,
  recurrenceCount,
  maxOccurrences = 500,
}) => {
  const start = stripTime(startDate);
  const end = recurrenceEndDate ? stripTime(recurrenceEndDate) : null;
  const maxCount = recurrenceCount ? Math.min(recurrenceCount, maxOccurrences) : maxOccurrences;
  const days = Array.isArray(recurrenceDays) ? recurrenceDays : [];
  const dates = [];
  let current = new Date(start);
  let count = 0;

  while (count < maxCount) {
    const dayCode = DAY_CODES[current.getDay()];
    let include = false;

    if (recurrenceType === 'daily') {
      include = true;
    } else if (recurrenceType === 'weekly') {
      include = days.includes(dayCode);
      if (!include && dates.length === 0) {
        // If start date does not match weekly days, scan forward within the week
        current = addDays(current, 1);
        continue;
      }
    } else if (recurrenceType === 'custom') {
      include = days.includes(dayCode);
    } else if (recurrenceType === 'yearly') {
      include = current.getMonth() === start.getMonth() && current.getDate() === start.getDate();
    } else if (recurrenceType === 'monthly') {
      include = current.getDate() === start.getDate();
    } else {
      // Unknown type: treat as single occurrence
      include = true;
    }

    if (include) {
      dates.push(new Date(current));
      count++;
    }

    if (recurrenceType === 'weekly') {
      // Move to next matching day within the week, then jump to next week
      const nextDay = addDays(current, 1);
      if (nextDay.getDay() === start.getDay()) {
        current = nextDay;
      } else if (days.length === 0) {
        current = addDays(current, 7);
      } else {
        current = nextDay;
      }
    } else {
      current = addDays(current, 1);
    }

    if (end && current > end) break;
    if (recurrenceCount && count >= recurrenceCount) break;
  }

  return dates;
};

/**
 * Build a recurrencePattern summary string from config.
 */
export const buildRecurrencePattern = ({
  recurrenceType,
  recurrenceDays,
  recurrenceEndDate,
  recurrenceCount,
}) => {
  const parts = [recurrenceType];
  if (Array.isArray(recurrenceDays) && recurrenceDays.length) {
    parts.push(recurrenceDays.join(','));
  }
  if (recurrenceEndDate) {
    parts.push(`until:${recurrenceEndDate.toISOString().split('T')[0]}`);
  } else if (recurrenceCount) {
    parts.push(`count:${recurrenceCount}`);
  }
  return parts.join('|');
};

/**
 * Generate a new series UUID.
 */
export const generateSeriesId = () => uuidv4();

export default {
  expandRecurrenceDates,
  buildRecurrencePattern,
  generateSeriesId,
};
