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
  applyTypographyVars,
  readTypographyFromStorage,
  writeTypographyToStorage,
} from '@utils/typography';
import { apiService } from '@services/api/apiService';

const TypographyContext = createContext({
  fontLtr: DEFAULT_FONT_LTR,
  fontRtl: DEFAULT_FONT_RTL,
  setFontLtr: () => {},
  setFontRtl: () => {},
  setFonts: () => {},
  fontsLtr: FONT_REGISTRY.ltr,
  fontsRtl: FONT_REGISTRY.rtl,
  saveTypographyToServer: async () => {},
  isLoading: false,
});

export const TypographyProvider = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const [fontLtr, setFontLtrState] = useState(() => readTypographyFromStorage(uid).fontLtr);
  const [fontRtl, setFontRtlState] = useState(() => readTypographyFromStorage(uid).fontRtl);
  const [isLoading, setIsLoading] = useState(false);

  const applyFonts = useCallback((ltr, rtl) => {
    const safeLtr = isValidFontId('ltr', ltr) ? ltr : DEFAULT_FONT_LTR;
    const safeRtl = isValidFontId('rtl', rtl) ? rtl : DEFAULT_FONT_RTL;
    applyTypographyVars(safeLtr, safeRtl);
    return { fontLtr: safeLtr, fontRtl: safeRtl };
  }, []);

  const setFontLtr = useCallback((id) => {
    const next = isValidFontId('ltr', id) ? id : DEFAULT_FONT_LTR;
    setFontLtrState(next);
    writeTypographyToStorage(uid, next, fontRtl);
    applyTypographyVars(next, fontRtl);
  }, [uid, fontRtl, applyFonts]);

  const setFontRtl = useCallback((id) => {
    const next = isValidFontId('rtl', id) ? id : DEFAULT_FONT_RTL;
    setFontRtlState(next);
    writeTypographyToStorage(uid, fontLtr, next);
    applyTypographyVars(fontLtr, next);
  }, [uid, fontLtr, applyFonts]);

  const setFonts = useCallback((ltr, rtl) => {
    const applied = applyFonts(ltr, rtl);
    setFontLtrState(applied.fontLtr);
    setFontRtlState(applied.fontRtl);
    writeTypographyToStorage(uid, applied.fontLtr, applied.fontRtl);
  }, [uid, applyFonts]);

  // Apply on mount and when selections change
  useEffect(() => {
    applyFonts(fontLtr, fontRtl);
  }, [fontLtr, fontRtl, applyFonts]);

  // Hydrate from server when user logs in
  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    const hydrate = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.get('/me/preferences/typography');
        if (cancelled) return;
        if (res?.success && res.data) {
          const { fontLtr: serverLtr, fontRtl: serverRtl } = res.data;
          const local = readTypographyFromStorage(uid);
          const nextLtr = serverLtr || local.fontLtr;
          const nextRtl = serverRtl || local.fontRtl;
          setFonts(nextLtr, nextRtl);
        } else {
          const local = readTypographyFromStorage(uid);
          setFonts(local.fontLtr, local.fontRtl);
        }
      } catch {
        const local = readTypographyFromStorage(uid);
        if (!cancelled) setFonts(local.fontLtr, local.fontRtl);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [uid, setFonts]);

  const saveTypographyToServer = useCallback(async () => {
    const payload = { fontLtr, fontRtl };
    const res = await apiService.put('/me/preferences/typography', payload);
    if (res?.success) {
      writeTypographyToStorage(uid, fontLtr, fontRtl);
      return true;
    }
    throw new Error(res?.error || 'Failed to save typography preferences');
  }, [fontLtr, fontRtl, uid]);

  const value = useMemo(() => ({
    fontLtr,
    fontRtl,
    setFontLtr,
    setFontRtl,
    setFonts,
    fontsLtr: FONT_REGISTRY.ltr,
    fontsRtl: FONT_REGISTRY.rtl,
    saveTypographyToServer,
    isLoading,
  }), [
    fontLtr,
    fontRtl,
    setFontLtr,
    setFontRtl,
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
