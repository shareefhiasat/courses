import { normalizeHexColor, adjustColor, hexToRgbString, DEFAULT_ACCENT } from './color';

// Apply a given color as the global brand color by updating CSS variables on :root
export const applyAccentColorGlobally = (color) => {
  if (typeof document === 'undefined') return;
  const accent = normalizeHexColor(color, DEFAULT_ACCENT);
  const root = document.documentElement;
  root.style.setProperty('--color-primary', accent);
  root.style.setProperty('--color-primary-light', adjustColor(accent, 15));
  root.style.setProperty('--color-primary-dark', adjustColor(accent, -15));
  root.style.setProperty('--color-primary-rgb', hexToRgbString(accent));
  root.style.setProperty('--input-focus', accent);
  // Ensure navbar/background usage updates with the new color
  root.style.setProperty('--navbar-bg', accent);
  root.style.setProperty('--accent-color', accent);
  // Notify any listeners that accent color has changed
  window.dispatchEvent(new CustomEvent('accent-color-changed', { detail: { color: accent } }));
};


