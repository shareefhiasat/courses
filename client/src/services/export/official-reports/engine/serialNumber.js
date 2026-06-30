/**
 * Generate official report serial numbers.
 * Format: {YYYYMMDD}-{HHmmss}-{scopeSuffix}
 */

const pad = (n) => String(n).padStart(2, '0');

export function buildSerialNumber(scopeId, { prefix = '' } = {}) {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join('');
  const timePart = [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
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
