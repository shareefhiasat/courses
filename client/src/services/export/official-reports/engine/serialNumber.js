/**
 * Generate official report serial numbers.
 * Format: {YYYYMMDD}-{HHmmss}-{scopeSuffix}
 */

import { getQatarDateParts } from '@utils/date-formatter.js';

const pad = (n) => String(n).padStart(2, '0');

export function buildSerialNumber(scopeId, { prefix = '', date = null } = {}) {
  const dateParts = getQatarDateParts(date || new Date());
  const timeParts = getQatarDateParts(new Date());
  if (!dateParts || !timeParts) return `${prefix}${scopeId || 0}`;
  const datePart = [
    dateParts.year,
    pad(dateParts.month),
    pad(dateParts.day),
  ].join('');
  const timePart = [
    pad(timeParts.hours),
    pad(timeParts.minutes),
    pad(timeParts.seconds),
  ].join('');
  const scope = scopeId != null ? String(scopeId) : '0';
  const suffix = prefix ? `${prefix}${scope}` : scope;
  return `${datePart}-${timePart}-${suffix}`;
}

export function buildDailyOfficialSerial(scopeId, isStandup = false, date = null) {
  const prefix = isStandup ? 'P' : 'C';
  return buildSerialNumber(scopeId, { prefix, date });
}

export function buildViolationsOfficialSerial(programId, date = null) {
  return buildSerialNumber(programId, { prefix: 'V', date });
}

export function buildClassSubjectMarksSerial(classId, date = null) {
  return buildSerialNumber(classId, { prefix: 'CS', date });
}
