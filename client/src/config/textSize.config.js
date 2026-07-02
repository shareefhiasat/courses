/**
 * Text size tiers — rem-based multiplier on --type-base (not CSS transform scale).
 */

export const TEXT_SIZE_IDS = ['compact', 'small', 'default', 'large', 'larger', 'largest'];

export const DEFAULT_TEXT_SIZE = import.meta.env?.VITE_DEFAULT_TEXT_SIZE || 'default';

/** @type {Record<string, number>} */
export const TEXT_SIZE_MULTIPLIERS = {
  compact: 0.825,
  small: 0.9,
  default: 0.95,
  large: 1.05,
  larger: 1.15,
  largest: 1.3,
};

export function isValidTextSize(id) {
  return typeof id === 'string' && TEXT_SIZE_IDS.includes(id);
}

export function getTextSizeMultiplier(id) {
  return TEXT_SIZE_MULTIPLIERS[isValidTextSize(id) ? id : DEFAULT_TEXT_SIZE] ?? 1;
}
