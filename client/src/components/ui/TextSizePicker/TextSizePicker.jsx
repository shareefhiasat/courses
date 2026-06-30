import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTypography } from '@contexts/TypographyContext';
import styles from './TextSizePicker.module.css';

const PREVIEW_EN = 'The quick brown fox jumps over the lazy dog.';
const PREVIEW_AR = 'نص تجريبي لمعاينة حجم الخط في واجهة النظام.';

export default function TextSizePicker() {
  const { t, lang } = useLang();
  const { textSize, setTextSize, textSizeOptions } = useTypography();

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{t('profile_text_size') || 'Text size'}</label>
      <div className={styles.options} role="radiogroup" aria-label={t('profile_text_size') || 'Text size'}>
        {textSizeOptions.map((id) => (
          <label
            key={id}
            className={`${styles.option} ${textSize === id ? styles.selected : ''}`}
          >
            <input
              type="radio"
              name="text-size"
              value={id}
              checked={textSize === id}
              onChange={() => setTextSize(id)}
            />
            {t(`text_size.${id}`) || id}
          </label>
        ))}
      </div>
      <p className={styles.preview} dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ fontSize: 'var(--type-body)' }}>
        {lang === 'ar' ? PREVIEW_AR : PREVIEW_EN}
      </p>
    </div>
  );
}
