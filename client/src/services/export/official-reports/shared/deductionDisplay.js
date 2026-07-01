/** Map numeric deduction to display fraction (matches official forms). */
const DEDUCTION_FRACTIONS = {
  0.5: '1/2',
  0.25: '1/4',
  0.75: '3/4',
  1: '1',
};

export function formatDeduction(value) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return '';
  if (DEDUCTION_FRACTIONS[num] !== undefined) return DEDUCTION_FRACTIONS[num];
  return num % 1 === 0 ? String(num) : num.toFixed(2);
}

export const DEDUCTION_RULES = {
  ABSENT_NO_EXCUSE: 0.5,
  ABSENT_WITH_EXCUSE: 0.25,
  EXCUSED_LEAVE: 0.25,
  LATE: 0.5,
  HUMAN_CASE: 0.25,
};

export function getDeductionForStatus(statusCode, excuseApprovedAt = null) {
  if (excuseApprovedAt) return DEDUCTION_RULES.ABSENT_WITH_EXCUSE;
  return DEDUCTION_RULES[statusCode] ?? 0;
}
