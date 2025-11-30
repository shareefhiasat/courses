import React from 'react';
import { useLang } from '../../../contexts/LangContext';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher({ compact = true }) {
  const { lang, toggleLang } = useLang();
  if (compact) {
    return (
      <button
        className={styles.compact}
        title={lang === 'en' ? 'العربية' : 'English'}
        onClick={toggleLang}
      >
        {lang === 'en' ? 'AR' : 'EN'}
      </button>
    );
  }
  return (
    <button className={styles.full} onClick={toggleLang}>
      {lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    </button>
  );
}
