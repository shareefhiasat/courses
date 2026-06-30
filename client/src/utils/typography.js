import {
  DEFAULT_FONT_LTR,
  DEFAULT_FONT_RTL,
  getFontEntry,
} from '@config/fonts.registry.js';
import {
  DEFAULT_TEXT_SIZE,
  isValidTextSize,
} from '@config/textSize.config.js';

const FALLBACK_STACK = 'system-ui, sans-serif';

/**
 * Apply selected LTR/RTL font stacks to :root CSS variables.
 * @param {string} fontLtrId
 * @param {string} fontRtlId
 */
export function applyTypographyVars(fontLtrId, fontRtlId) {
  if (typeof document === 'undefined') return;

  const ltrEntry = getFontEntry('ltr', fontLtrId) || getFontEntry('ltr', DEFAULT_FONT_LTR);
  const rtlEntry = getFontEntry('rtl', fontRtlId) || getFontEntry('rtl', DEFAULT_FONT_RTL);

  const root = document.documentElement;
  const ltrFamily = ltrEntry ? `'${ltrEntry.family}', ${FALLBACK_STACK}` : FALLBACK_STACK;
  const rtlFamily = rtlEntry ? `'${rtlEntry.family}', ${FALLBACK_STACK}` : FALLBACK_STACK;

  root.style.setProperty('--font-active-ltr', ltrFamily);
  root.style.setProperty('--font-active-rtl', rtlFamily);

  if (rtlEntry?.metrics?.lineHeight) {
    root.style.setProperty('--line-height-body-rtl', rtlEntry.metrics.lineHeight);
  } else {
    root.style.removeProperty('--line-height-body-rtl');
  }

  const loadFamily = document.documentElement.lang === 'ar' ? rtlEntry?.family : ltrEntry?.family;
  if (loadFamily && document.fonts?.load) {
    document.fonts.load(`16px '${loadFamily}'`).catch(() => {});
  }

  window.dispatchEvent(new CustomEvent('typography-changed', {
    detail: { fontLtr: fontLtrId, fontRtl: fontRtlId },
  }));
}

/**
 * Apply text size tier via data-text-size on html.
 * @param {string} textSizeId
 */
export function applyTextSize(textSizeId) {
  if (typeof document === 'undefined') return;
  const safe = isValidTextSize(textSizeId) ? textSizeId : DEFAULT_TEXT_SIZE;
  document.documentElement.setAttribute('data-text-size', safe);
  window.dispatchEvent(new CustomEvent('text-size-changed', { detail: { textSize: safe } }));
}

export function getTypographyStorageKeys(uid) {
  return {
    ltr: uid ? `typography_font_ltr_${uid}` : 'typography_font_ltr_guest',
    rtl: uid ? `typography_font_rtl_${uid}` : 'typography_font_rtl_guest',
    textSize: uid ? `typography_text_size_${uid}` : 'typography_text_size_guest',
  };
}

export function readTypographyFromStorage(uid) {
  const keys = getTypographyStorageKeys(uid);
  try {
    return {
      fontLtr: localStorage.getItem(keys.ltr) || DEFAULT_FONT_LTR,
      fontRtl: localStorage.getItem(keys.rtl) || DEFAULT_FONT_RTL,
      textSize: localStorage.getItem(keys.textSize) || DEFAULT_TEXT_SIZE,
    };
  } catch {
    return { fontLtr: DEFAULT_FONT_LTR, fontRtl: DEFAULT_FONT_RTL, textSize: DEFAULT_TEXT_SIZE };
  }
}

export function readTextSizeFromStorage(uid) {
  return readTypographyFromStorage(uid).textSize;
}

export function writeTypographyToStorage(uid, fontLtr, fontRtl, textSize) {
  const keys = getTypographyStorageKeys(uid);
  try {
    localStorage.setItem(keys.ltr, fontLtr);
    localStorage.setItem(keys.rtl, fontRtl);
    if (textSize) localStorage.setItem(keys.textSize, textSize);
  } catch {
    /* ignore */
  }
}
