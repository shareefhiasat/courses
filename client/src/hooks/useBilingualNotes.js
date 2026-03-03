import { useContext } from 'react';
import { LangContext } from '../contexts/LangContext';

/**
 * Hook for handling bilingual notes with automatic localization
 * Provides utilities for creating, storing, and displaying bilingual notes
 * Completely backward compatible and safe to use
 */
export const useBilingualNotes = () => {
  try {
    const { lang } = useContext(LangContext);

    /**
     * Get the appropriate note based on current language
     * @param {Object|string} note - Note object (with en/ar) or string
     * @returns {string} Localized note text
     */
    const getNote = (note) => {
      try {
        if (!note) return '';
        
        if (typeof note === 'string') {
          // Legacy format - just return the string
          return note;
        }
        
        if (typeof note === 'object') {
          // New bilingual format
          return lang === 'ar' && note.ar ? note.ar : note.en || note;
        }
        
        return String(note);
      } catch (error) {
        console.warn('Error in getNote:', error);
        return String(note || '');
      }
    };

    /**
     * Create a bilingual note object for database storage
     * @param {string} noteEn - English note
     * @param {string} noteAr - Arabic note (optional)
     * @returns {Object} Bilingual note object
     */
    const createNote = (noteEn, noteAr = null) => {
      try {
        return {
          en: noteEn || '',
          ar: noteAr || noteEn || '', // Fallback to English if no Arabic provided
          hasArabic: !!noteAr && noteAr !== noteEn
        };
      } catch (error) {
        console.warn('Error in createNote:', error);
        return { en: String(noteEn || ''), ar: String(noteEn || ''), hasArabic: false };
      }
    };

    /**
     * Get translated note for system-defined notes
     * @param {string} noteKey - Note key to translate
     * @param {string} customArabic - Custom Arabic translation (optional)
     * @returns {string} Translated note
     */
    const getTranslatedNote = (noteKey, customArabic = null) => {
      try {
        if (!noteKey) return '';
        
        // If we have a custom Arabic note and language is Arabic, use it
        if (lang === 'ar' && customArabic) {
          return customArabic;
        }
        
        // For system-defined notes, try to translate using the dictionary
        if (typeof noteKey === 'string') {
          // Import dynamically to avoid circular dependencies
          try {
            const { DICT } = require('../contexts/LangContext');
            const translationKey = noteKey.toLowerCase().replace(/\s+/g, '_');
            const translated = DICT[lang]?.[translationKey];
            if (translated && translated !== noteKey) {
              return translated;
            }
          } catch (dictError) {
            // Dictionary not available, fallback to original
          }
        }
        
        // Fallback to original note
        return noteKey;
      } catch (error) {
        console.warn('Error in getTranslatedNote:', error);
        return String(noteKey || '');
      }
    };

    /**
     * Check if a note has Arabic content
     * @param {Object|string} note - Note to check
     * @returns {boolean} True if note has Arabic content
     */
    const hasArabic = (note) => {
      try {
        if (!note) return false;
        if (typeof note === 'string') return false;
        if (typeof note === 'object') {
          return note.hasArabic || (note.ar && note.ar !== note.en);
        }
        return false;
      } catch (error) {
        console.warn('Error in hasArabic:', error);
        return false;
      }
    };

    /**
     * Get both English and Arabic versions of a note
     * @param {Object|string} note - Note object or string
     * @returns {Object} Object with en and ar properties
     */
    const getBothLanguages = (note) => {
      try {
        if (!note) return { en: '', ar: '' };
        
        if (typeof note === 'string') {
          return { en: note, ar: note };
        }
        if (typeof note === 'object') {
          return {
            en: note.en || note,
            ar: note.ar || note.en || note
          };
        }
        return { en: String(note), ar: String(note) };
      } catch (error) {
        console.warn('Error in getBothLanguages:', error);
        return { en: String(note || ''), ar: String(note || '') };
      }
    };

    return {
      // Core functions
      getNote,
      createNote,
      getTranslatedNote,
      
      // Utility functions
      hasArabic,
      getBothLanguages,
      
      // Current language
      currentLang: lang || 'en',
      isArabic: lang === 'ar'
    };
  } catch (error) {
    console.error('Error initializing useBilingualNotes:', error);
    // Return safe fallback functions
    return {
      getNote: (note) => String(note || ''),
      createNote: (noteEn, noteAr = null) => ({ 
        en: String(noteEn || ''), 
        ar: String(noteAr || noteEn || ''), 
        hasArabic: !!noteAr && noteAr !== noteEn 
      }),
      getTranslatedNote: (noteKey, customArabic = null) => String(customArabic || noteKey || ''),
      hasArabic: () => false,
      getBothLanguages: (note) => ({ en: String(note || ''), ar: String(note || '') }),
      currentLang: 'en',
      isArabic: false
    };
  }
};
