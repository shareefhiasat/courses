import React from 'react';
import { useLang } from '@contexts/LangContext';
import styles from './LanguageSwitcher.module.css';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';export default function LanguageSwitcher({ compact = true }) {
  const { lang, toggleLang, t } = useLang();
  if (compact) {
    return (
      <PortalTooltip content={lang === 'en' ? 'العربية' : 'English'} position="bottom">
      <button
        className={styles.compact}
        onClick={toggleLang}
      >
        {lang === 'en' ? 'AR' : 'EN'}
      </button>
      </PortalTooltip>
    );
  }
  return (
    <button className={styles.full} onClick={toggleLang}>
      {lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    </button>
  );
}
