import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';


import { info, error, warn, debug } from '@logger';
import enLocale from '../locales/en.json';
import arLocale from '../locales/ar.json';

const LangContext = createContext({
  lang: 'en',
  isRTL: false,
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
});

const DICT = {
  en: enLocale,
  ar: arLocale,
};

// Bilingual notes utility - handles both system-defined and custom notes
export const getBilingualNote = (note, customNoteAr, lang = 'en') => {
  // If we have a custom Arabic note and language is Arabic, use it
  if (lang === 'ar' && customNoteAr) {
    return customNoteAr;
  }
  
  // For system-defined notes, try to translate using the dictionary
  if (typeof note === 'string') {
    const translationKey = note.toLowerCase().replace(/\s+/g, '_');
    const translated = DICT[lang]?.[translationKey];
    if (translated && translated !== note) {
      return translated;
    }
  }
  
  // Fallback to original note
  return note;
};

// Helper to generate bilingual note object for database storage
export const createBilingualNote = (noteEn, noteAr = null) => {
  return {
    en: noteEn,
    ar: noteAr || noteEn, // Fallback to English if no Arabic provided
    hasArabic: !!noteAr && noteAr !== noteEn
  };
};

// Helper to extract appropriate note for display
export const getLocalizedNote = (bilingualNote, lang = 'en') => {
  if (!bilingualNote) return '';
  
  if (typeof bilingualNote === 'string') {
    // Legacy format - just a string
    return bilingualNote;
  }
  
  if (typeof bilingualNote === 'object') {
    // New bilingual format
    return lang === 'ar' && bilingualNote.ar ? bilingualNote.ar : bilingualNote.en;
  }
  
  return String(bilingualNote);
};

export const LangProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'en');

  const setLang = (l) => {
    const value = l === 'ar' ? 'ar' : 'en';
    setLangState(value);
    localStorage.setItem('lang', value);
  };

  const toggleLang = useCallback(() => setLang(lang === 'en' ? 'ar' : 'en'), [lang]);

  const isRTL = lang === 'ar';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang, isRTL]);

  const t = useMemo(() => {
    const dict = DICT[lang] || DICT.en;
    const enDict = DICT.en;
    const missingKeys = new Set();
    return (key, params) => {
      const count = params?.count;
      const pluralKey = count !== 1 ? `${key}_plural` : key;
      let v = dict[pluralKey] || dict[key];
      if (!v && lang !== 'en') v = enDict[pluralKey] || enDict[key];
      if (!v) {
        if (import.meta.env.DEV && !missingKeys.has(key)) {
          missingKeys.add(key);
          console.warn(`[i18n] Missing key: "${key}" (lang: ${lang})`);
        }
        v = String(key || '').replaceAll('_',' ');
      }
      
      if (params && typeof params === 'object') {
        Object.keys(params).forEach(paramKey => {
          v = v.replace(`{${paramKey}}`, params[paramKey]);
        });
      }
      return v;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, isRTL, setLang, toggleLang, t }), [lang, isRTL, t, toggleLang]);

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);

export { LangContext, DICT };
