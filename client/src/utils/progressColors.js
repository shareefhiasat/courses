/**
 * Returns a color based on the ratio of value to max.
 *  - >= 100% → red (#dc2626)
 *  - >= 75%  → orange (#f59e0b)
 *  - >= 50%  → blue (#3b82f6)
 *  - >  0%   → green (#22c55e)
 *  - 0 / no max → gray (#6b7280)
 *
 * @param {number} value
 * @param {number} max
 * @returns {string} hex color
 */
export function getProgressColor(value, max) {
  if (!max) return '#6b7280';
  const pct = value / max;
  if (pct >= 1) return '#dc2626';
  if (pct >= 0.75) return '#f59e0b';
  if (pct >= 0.5) return '#3b82f6';
  return '#22c55e';
}

export default getProgressColor;
