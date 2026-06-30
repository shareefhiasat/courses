/**
 * Text size tiers — rem-based multiplier on --type-base (not CSS transform scale).
 */

export const TEXT_SIZE_IDS = ['default', 'large', 'larger', 'largest'];

export const DEFAULT_TEXT_SIZE = import.meta.env?.VITE_DEFAULT_TEXT_SIZE || 'default';

/** @type {Record<string, number>} */
export const TEXT_SIZE_MULTIPLIERS = {
  default: 1,
  large: 1.1,
  larger: 1.2,
  largest: 1.35,
};

export function isValidTextSize(id) {
  return typeof id === 'string' && TEXT_SIZE_IDS.includes(id);
}

export function getTextSizeMultiplier(id) {
  return TEXT_SIZE_MULTIPLIERS[isValidTextSize(id) ? id : DEFAULT_TEXT_SIZE] ?? 1;
}
