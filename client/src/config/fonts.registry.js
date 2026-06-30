/**
 * Typography font registry — single source of truth for offline self-hosted fonts.
 *
 * To add a font:
 * 1. Add entry below (ltr or rtl)
 * 2. Run `pnpm fonts:vendor` then `pnpm fonts:generate`
 * 3. Add i18n keys font.<id> in LangContext
 */

export const DEFAULT_FONT_LTR = import.meta.env?.VITE_DEFAULT_FONT_LTR || 'inter';
export const DEFAULT_FONT_RTL = import.meta.env?.VITE_DEFAULT_FONT_RTL || 'ibm-plex-sans-arabic';

/**
 * @typedef {{ weight: number, file: string }} StaticWeightFile
 * @typedef {{
 *   id: string,
 *   family: string,
 *   labelKey: string,
 *   file?: string,
 *   weightRange?: string,
 *   staticWeights?: StaticWeightFile[],
 *   metrics?: { sizeAdjust?: string, lineHeight?: string, letterSpacing?: string }
 * }} FontEntry
 */

/** @type {{ ltr: FontEntry[], rtl: FontEntry[] }} */
export const FONT_REGISTRY = {
  ltr: [
    { id: 'inter', family: 'Inter Variable', labelKey: 'font.inter', file: 'inter-latin-wght-normal.woff2', weightRange: '100 900' },
    { id: 'ibm-plex-sans', family: 'IBM Plex Sans', labelKey: 'font.ibm_plex_sans', file: 'ibm-plex-sans-latin-wght-normal.woff2', weightRange: '100 700' },
    { id: 'source-sans-3', family: 'Source Sans 3', labelKey: 'font.source_sans_3', file: 'source-sans-3-latin-wght-normal.woff2', weightRange: '200 900' },
    { id: 'open-sans', family: 'Open Sans', labelKey: 'font.open_sans', file: 'open-sans-latin-wght-normal.woff2', weightRange: '300 800' },
    { id: 'roboto', family: 'Roboto', labelKey: 'font.roboto', file: 'roboto-latin-wght-normal.woff2', weightRange: '100 900' },
    { id: 'nunito-sans', family: 'Nunito Sans', labelKey: 'font.nunito_sans', file: 'nunito-sans-latin-wght-normal.woff2', weightRange: '200 1000' },
    { id: 'work-sans', family: 'Work Sans', labelKey: 'font.work_sans', file: 'work-sans-latin-wght-normal.woff2', weightRange: '100 900' },
    {
      id: 'lato',
      family: 'Lato',
      labelKey: 'font.lato',
      staticWeights: [
        { weight: 400, file: 'lato-latin-400-normal.woff2' },
        { weight: 700, file: 'lato-latin-700-normal.woff2' },
      ],
    },
    { id: 'plus-jakarta-sans', family: 'Plus Jakarta Sans', labelKey: 'font.plus_jakarta_sans', file: 'plus-jakarta-sans-latin-wght-normal.woff2', weightRange: '200 800' },
    { id: 'manrope', family: 'Manrope', labelKey: 'font.manrope', file: 'manrope-latin-wght-normal.woff2', weightRange: '200 800' },
  ],
  rtl: [
    {
      id: 'ibm-plex-sans-arabic',
      family: 'IBM Plex Sans Arabic',
      labelKey: 'font.ibm_plex_sans_arabic',
      staticWeights: [
        { weight: 400, file: 'ibm-plex-sans-arabic-arabic-400-normal.woff2' },
        { weight: 500, file: 'ibm-plex-sans-arabic-arabic-500-normal.woff2' },
        { weight: 600, file: 'ibm-plex-sans-arabic-arabic-600-normal.woff2' },
        { weight: 700, file: 'ibm-plex-sans-arabic-arabic-700-normal.woff2' },
      ],
      metrics: { lineHeight: '1.65' },
    },
    { id: 'noto-sans-arabic', family: 'Noto Sans Arabic', labelKey: 'font.noto_sans_arabic', file: 'noto-sans-arabic-arabic-wght-normal.woff2', weightRange: '100 900', metrics: { lineHeight: '1.65' } },
    { id: 'cairo', family: 'Cairo', labelKey: 'font.cairo', file: 'cairo-arabic-wght-normal.woff2', weightRange: '200 1000', metrics: { lineHeight: '1.65' } },
    {
      id: 'tajawal',
      family: 'Tajawal',
      labelKey: 'font.tajawal',
      staticWeights: [
        { weight: 400, file: 'tajawal-arabic-400-normal.woff2' },
        { weight: 500, file: 'tajawal-arabic-500-normal.woff2' },
        { weight: 700, file: 'tajawal-arabic-700-normal.woff2' },
      ],
      metrics: { lineHeight: '1.65' },
    },
    {
      id: 'almarai',
      family: 'Almarai',
      labelKey: 'font.almarai',
      staticWeights: [
        { weight: 400, file: 'almarai-arabic-400-normal.woff2' },
        { weight: 700, file: 'almarai-arabic-700-normal.woff2' },
      ],
      metrics: { lineHeight: '1.65' },
    },
    { id: 'readex-pro', family: 'Readex Pro', labelKey: 'font.readex_pro', file: 'readex-pro-arabic-wght-normal.woff2', weightRange: '160 700', metrics: { lineHeight: '1.65' } },
    { id: 'changa', family: 'Changa', labelKey: 'font.changa', file: 'changa-arabic-wght-normal.woff2', weightRange: '200 800', metrics: { lineHeight: '1.65' } },
    {
      id: 'harmattan',
      family: 'Harmattan',
      labelKey: 'font.harmattan',
      staticWeights: [
        { weight: 400, file: 'harmattan-arabic-400-normal.woff2' },
        { weight: 600, file: 'harmattan-arabic-600-normal.woff2' },
        { weight: 700, file: 'harmattan-arabic-700-normal.woff2' },
      ],
      metrics: { lineHeight: '1.7' },
    },
    { id: 'rubik-arabic', family: 'Rubik', labelKey: 'font.rubik_arabic', file: 'rubik-arabic-wght-normal.woff2', weightRange: '300 900', metrics: { lineHeight: '1.65' } },
    {
      id: 'el-messiri',
      family: 'El Messiri',
      labelKey: 'font.el_messiri',
      staticWeights: [
        { weight: 400, file: 'el-messiri-arabic-400-normal.woff2' },
        { weight: 600, file: 'el-messiri-arabic-600-normal.woff2' },
        { weight: 700, file: 'el-messiri-arabic-700-normal.woff2' },
      ],
      metrics: { lineHeight: '1.7', sizeAdjust: '98%' },
    },
  ],
};

export const MONO_FONT = {
  id: 'jetbrains-mono',
  family: 'JetBrains Mono Variable',
  file: 'jetbrains-mono-latin-wght-normal.woff2',
  weightRange: '100 800',
};

export const FONT_IDS_LTR = FONT_REGISTRY.ltr.map((f) => f.id);
export const FONT_IDS_RTL = FONT_REGISTRY.rtl.map((f) => f.id);

export function getFontEntry(script, id) {
  const list = script === 'rtl' ? FONT_REGISTRY.rtl : FONT_REGISTRY.ltr;
  return list.find((f) => f.id === id);
}

export function isValidFontId(script, id) {
  return script === 'rtl' ? FONT_IDS_RTL.includes(id) : FONT_IDS_LTR.includes(id);
}

export function getFontFamily(script, id) {
  const entry = getFontEntry(script, id);
  return entry?.family ?? null;
}
