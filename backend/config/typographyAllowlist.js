/**
 * Font ID allowlist for typography preferences API validation.
 * Keep in sync with client/src/config/fonts.registry.js
 */

export const FONT_IDS_LTR = [
  'inter',
  'ibm-plex-sans',
  'source-sans-3',
  'open-sans',
  'roboto',
  'nunito-sans',
  'work-sans',
  'lato',
  'plus-jakarta-sans',
  'manrope',
];

export const FONT_IDS_RTL = [
  'ibm-plex-sans-arabic',
  'noto-sans-arabic',
  'cairo',
  'tajawal',
  'almarai',
  'readex-pro',
  'changa',
  'harmattan',
  'rubik-arabic',
  'el-messiri',
];

export const DEFAULT_FONT_LTR = process.env.VITE_DEFAULT_FONT_LTR || 'inter';
export const DEFAULT_FONT_RTL = process.env.VITE_DEFAULT_FONT_RTL || 'ibm-plex-sans-arabic';

export function isValidFontId(script, id) {
  if (typeof id !== 'string') return false;
  return script === 'rtl' ? FONT_IDS_RTL.includes(id) : FONT_IDS_LTR.includes(id);
}
