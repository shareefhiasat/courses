import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  DEFAULT_FONT_LTR,
  DEFAULT_FONT_RTL,
  FONT_REGISTRY,
  isValidFontId,
} from '@config/fonts.registry.js';
import {
  DEFAULT_TEXT_SIZE,
  TEXT_SIZE_IDS,
  isValidTextSize,
} from '@config/textSize.config.js';
import {
  applyTypographyVars,
  applyTextSize,
  readTypographyFromStorage,
  writeTypographyToStorage,
} from '@utils/typography';
import { apiService } from '@services/api/apiService';

const TypographyContext = createContext({
  fontLtr: DEFAULT_FONT_LTR,
  fontRtl: DEFAULT_FONT_RTL,
  textSize: DEFAULT_TEXT_SIZE,
  setFontLtr: () => {},
  setFontRtl: () => {},
  setTextSize: () => {},
  setFonts: () => {},
  fontsLtr: FONT_REGISTRY.ltr,
  fontsRtl: FONT_REGISTRY.rtl,
  textSizeOptions: TEXT_SIZE_IDS,
  saveTypographyToServer: async () => {},
  isLoading: false,
});

export const TypographyProvider = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const [fontLtr, setFontLtrState] = useState(() => readTypographyFromStorage(uid).fontLtr);
  const [fontRtl, setFontRtlState] = useState(() => readTypographyFromStorage(uid).fontRtl);
  const [textSize, setTextSizeState] = useState(() => readTypographyFromStorage(uid).textSize);
  const [isLoading, setIsLoading] = useState(false);

  const persistLocal = useCallback((ltr, rtl, size) => {
    writeTypographyToStorage(uid, ltr, rtl, size);
  }, [uid]);

  const applyFonts = useCallback((ltr, rtl) => {
    const safeLtr = isValidFontId('ltr', ltr) ? ltr : DEFAULT_FONT_LTR;
    const safeRtl = isValidFontId('rtl', rtl) ? rtl : DEFAULT_FONT_RTL;
    applyTypographyVars(safeLtr, safeRtl);
    return { fontLtr: safeLtr, fontRtl: safeRtl };
  }, []);

  const applySize = useCallback((size) => {
    const safe = isValidTextSize(size) ? size : DEFAULT_TEXT_SIZE;
    applyTextSize(safe);
    return safe;
  }, []);

  const setFontLtr = useCallback((id) => {
    const next = isValidFontId('ltr', id) ? id : DEFAULT_FONT_LTR;
    setFontLtrState(next);
    persistLocal(next, fontRtl, textSize);
    applyTypographyVars(next, fontRtl);
  }, [uid, fontRtl, textSize, persistLocal]);

  const setFontRtl = useCallback((id) => {
    const next = isValidFontId('rtl', id) ? id : DEFAULT_FONT_RTL;
    setFontRtlState(next);
    persistLocal(fontLtr, next, textSize);
    applyTypographyVars(fontLtr, next);
  }, [uid, fontLtr, textSize, persistLocal]);

  const setTextSize = useCallback((id) => {
    const next = applySize(id);
    setTextSizeState(next);
    persistLocal(fontLtr, fontRtl, next);
  }, [fontLtr, fontRtl, applySize, persistLocal]);

  const setFonts = useCallback((ltr, rtl, size = textSize) => {
    const applied = applyFonts(ltr, rtl);
    const appliedSize = applySize(size);
    setFontLtrState(applied.fontLtr);
    setFontRtlState(applied.fontRtl);
    setTextSizeState(appliedSize);
    persistLocal(applied.fontLtr, applied.fontRtl, appliedSize);
  }, [uid, textSize, applyFonts, applySize, persistLocal]);

  useEffect(() => {
    applyFonts(fontLtr, fontRtl);
    applySize(textSize);
  }, [fontLtr, fontRtl, textSize, applyFonts, applySize]);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    const hydrate = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.get('/me/preferences/typography');
        if (cancelled) return;
        const local = readTypographyFromStorage(uid);
        let ltr = local.fontLtr;
        let rtl = local.fontRtl;
        let size = local.textSize;
        if (res?.success && res.data) {
          ltr = res.data.fontLtr || ltr;
          rtl = res.data.fontRtl || rtl;
          size = res.data.textSize || size;
        }
        const safeLtr = isValidFontId('ltr', ltr) ? ltr : DEFAULT_FONT_LTR;
        const safeRtl = isValidFontId('rtl', rtl) ? rtl : DEFAULT_FONT_RTL;
        const safeSize = isValidTextSize(size) ? size : DEFAULT_TEXT_SIZE;
        setFontLtrState(safeLtr);
        setFontRtlState(safeRtl);
        setTextSizeState(safeSize);
        applyTypographyVars(safeLtr, safeRtl);
        applyTextSize(safeSize);
        persistLocal(safeLtr, safeRtl, safeSize);
      } catch {
        if (!cancelled) {
          const local = readTypographyFromStorage(uid);
          const safeLtr = isValidFontId('ltr', local.fontLtr) ? local.fontLtr : DEFAULT_FONT_LTR;
          const safeRtl = isValidFontId('rtl', local.fontRtl) ? local.fontRtl : DEFAULT_FONT_RTL;
          const safeSize = isValidTextSize(local.textSize) ? local.textSize : DEFAULT_TEXT_SIZE;
          setFontLtrState(safeLtr);
          setFontRtlState(safeRtl);
          setTextSizeState(safeSize);
          applyTypographyVars(safeLtr, safeRtl);
          applyTextSize(safeSize);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [uid, persistLocal]);

  const saveTypographyToServer = useCallback(async () => {
    const payload = { fontLtr, fontRtl, textSize };
    const res = await apiService.put('/me/preferences/typography', payload);
    if (res?.success) {
      persistLocal(fontLtr, fontRtl, textSize);
      return true;
    }
    throw new Error(res?.error || 'Failed to save typography preferences');
  }, [fontLtr, fontRtl, textSize, persistLocal]);

  const value = useMemo(() => ({
    fontLtr,
    fontRtl,
    textSize,
    setFontLtr,
    setFontRtl,
    setTextSize,
    setFonts,
    fontsLtr: FONT_REGISTRY.ltr,
    fontsRtl: FONT_REGISTRY.rtl,
    textSizeOptions: TEXT_SIZE_IDS,
    saveTypographyToServer,
    isLoading,
  }), [
    fontLtr,
    fontRtl,
    textSize,
    setFontLtr,
    setFontRtl,
    setTextSize,
    setFonts,
    saveTypographyToServer,
    isLoading,
  ]);

  return (
    <TypographyContext.Provider value={value}>
      {children}
    </TypographyContext.Provider>
  );
};

export const useTypography = () => useContext(TypographyContext);
