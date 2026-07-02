/**
 * Generate official report serial numbers.
 * Format: {YYYYMMDD}-{HHmmss}-{scopeSuffix}
 */

import { getQatarDateParts } from '@utils/date-formatter.js';

const pad = (n) => String(n).padStart(2, '0');

export function buildSerialNumber(scopeId, { prefix = '' } = {}) {
  const parts = getQatarDateParts(new Date());
  if (!parts) return `${prefix}${scopeId || 0}`;
  const datePart = [
    parts.year,
    pad(parts.month),
    pad(parts.day),
  ].join('');
  const timePart = [
    pad(parts.hours),
    pad(parts.minutes),
    pad(parts.seconds),
  ].join('');
  const scope = scopeId != null ? String(scopeId) : '0';
  const suffix = prefix ? `${prefix}${scope}` : scope;
  return `${datePart}-${timePart}-${suffix}`;
}

export function buildDailyOfficialSerial(scopeId, isStandup = false) {
  const prefix = isStandup ? 'P' : 'C';
  return buildSerialNumber(scopeId, { prefix });
}

export function buildViolationsOfficialSerial(programId) {
  return buildSerialNumber(programId, { prefix: 'V' });
}
