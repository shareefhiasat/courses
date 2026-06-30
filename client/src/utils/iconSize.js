/**
 * Icon sizing utilities — scale pixel design sizes with --type-multiplier.
 */

export function getTypeMultiplier() {
  if (typeof window === 'undefined') return 1;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--type-multiplier')
    .trim();
  const mult = parseFloat(raw);
  return Number.isFinite(mult) && mult > 0 ? mult : 1;
}

/**
 * @param {number} basePx Design-time icon size (e.g. 16, 18)
 * @returns {number}
 */
export function resolveIconSize(basePx) {
  if (typeof basePx !== 'number' || !Number.isFinite(basePx)) return basePx;
  return Math.round(basePx * getTypeMultiplier());
}

/** CSS variable references for inline styles */
export const ICON_SIZE_VARS = {
  xs: 'var(--icon-size-xs)',
  sm: 'var(--icon-size-sm)',
  md: 'var(--icon-size-md)',
  lg: 'var(--icon-size-lg)',
  xl: 'var(--icon-size-xl)',
};
