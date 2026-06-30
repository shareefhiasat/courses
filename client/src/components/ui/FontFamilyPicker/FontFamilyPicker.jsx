import React, { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTypography } from '@contexts/TypographyContext';
import { getFontEntry } from '@config/fonts.registry.js';
import styles from './FontFamilyPicker.module.css';

const LTR_PREVIEW = 'The quick brown fox jumps over the lazy dog.';
const RTL_PREVIEW = 'نص تجريبي لمعاينة الخط العربي في واجهة النظام.';

/**
 * @param {{ script: 'ltr' | 'rtl', value: string, onChange: (id: string) => void, label?: string }} props
 */
export default function FontFamilyPicker({ script, value, onChange, label }) {
  const { t } = useLang();
  const { fontsLtr, fontsRtl } = useTypography();
  const fonts = script === 'rtl' ? fontsRtl : fontsLtr;
  const preview = script === 'rtl' ? RTL_PREVIEW : LTR_PREVIEW;
  const dir = script === 'rtl' ? 'rtl' : 'ltr';

  const selectedFamily = useMemo(
    () => getFontEntry(script, value)?.family ?? value,
    [script, value],
  );

  return (
    <div className={styles.wrapper}>
      {label ? <label className={styles.label}>{label}</label> : null}
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        aria-label={label}
      >
        {fonts.map((font) => (
          <option key={font.id} value={font.id}>
            {t(font.labelKey) || font.family}
          </option>
        ))}
      </select>
      <p
        className={styles.preview}
        dir={dir}
        style={{ fontFamily: `'${selectedFamily}', var(--font-family-sans)` }}
      >
        {preview}
      </p>
    </div>
  );
}
