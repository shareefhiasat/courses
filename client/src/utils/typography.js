import {
  DEFAULT_FONT_LTR,
  DEFAULT_FONT_RTL,
  getFontEntry,
} from '@config/fonts.registry.js';

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

export function getTypographyStorageKeys(uid) {
  return {
    ltr: uid ? `typography_font_ltr_${uid}` : 'typography_font_ltr_guest',
    rtl: uid ? `typography_font_rtl_${uid}` : 'typography_font_rtl_guest',
  };
}

export function readTypographyFromStorage(uid) {
  const keys = getTypographyStorageKeys(uid);
  try {
    return {
      fontLtr: localStorage.getItem(keys.ltr) || DEFAULT_FONT_LTR,
      fontRtl: localStorage.getItem(keys.rtl) || DEFAULT_FONT_RTL,
    };
  } catch {
    return { fontLtr: DEFAULT_FONT_LTR, fontRtl: DEFAULT_FONT_RTL };
  }
}

export function writeTypographyToStorage(uid, fontLtr, fontRtl) {
  const keys = getTypographyStorageKeys(uid);
  try {
    localStorage.setItem(keys.ltr, fontLtr);
    localStorage.setItem(keys.rtl, fontRtl);
  } catch {
    /* ignore */
  }
}
