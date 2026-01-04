const DEFAULT_ACCENT = '#800020'; // Maroon

const sanitizeHex = (value) => {
  if (!value) return null;
  let hex = value.trim();
  if (!hex) return null;
  if (!hex.startsWith('#')) {
    hex = `#${hex}`;
  }
  const shortMatch = /^#([0-9a-fA-F]{3})$/;
  const fullMatch = /^#([0-9a-fA-F]{6})$/;
  if (shortMatch.test(hex)) {
    const [, group] = hex.match(shortMatch);
    hex = `#${group.split('').map((ch) => ch + ch).join('')}`;
  }
  if (fullMatch.test(hex)) {
    return hex.toUpperCase();
  }
  return null;
};

export const normalizeHexColor = (value, fallback = DEFAULT_ACCENT) => {
  return sanitizeHex(value) || fallback;
};

export const hexToRgb = (value) => {
  const hex = sanitizeHex(value);
  if (!hex) return null;
  const intVal = parseInt(hex.slice(1), 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return { r, g, b };
};

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  return { h, s, l };
};

const hslToHex = (h, s, l) => {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r;
  let g;
  let b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x) => {
    const clamped = Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
    return clamped;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const adjustColor = (value, percent = 10) => {
  const rgb = hexToRgb(value);
  if (!rgb) return normalizeHexColor(value);
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const adjusted = Math.min(1, Math.max(0, l + percent / 100));
  return hslToHex(h, s, adjusted);
};

export const hexToRgbString = (value, fallback = '102, 126, 234') => {
  const rgb = hexToRgb(value);
  if (!rgb) return fallback;
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
};

export const trySanitizeHexColor = (value) => sanitizeHex(value);

export { DEFAULT_ACCENT };

