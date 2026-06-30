import React, { useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { useTypography } from '@contexts/TypographyContext';
import { getFontEntry } from '@config/fonts.registry.js';
import Select from '@ui/Select/Select';
import styles from './FontFamilyPicker.module.css';

const LTR_PREVIEW = 'The quick brown fox jumps over the lazy dog.';
const RTL_PREVIEW = 'نص تجريبي لمعاينة الخط العربي في واجهة النظام.';
const LTR_ARABIC_FALLBACK_PREVIEW = 'نص تجريبي لمعاينة الخط العربي عند استخدام واجهة إنجليزية.';

/**
 * @param {{ script: 'ltr' | 'rtl', value: string, onChange: (id: string) => void, label?: string }} props
 */
export default function FontFamilyPicker({ script, value, onChange, label }) {
  const { t } = useLang();
  const { theme } = useTheme();
  const { fontsLtr, fontsRtl } = useTypography();
  const fonts = script === 'rtl' ? fontsRtl : fontsLtr;
  const preview = script === 'rtl' ? RTL_PREVIEW : LTR_PREVIEW;
  const dir = script === 'rtl' ? 'rtl' : 'ltr';

  const selectedFamily = useMemo(
    () => getFontEntry(script, value)?.family ?? value,
    [script, value],
  );

  const options = useMemo(
    () => fonts.map((font) => ({
      value: font.id,
      label: t(font.labelKey) || font.family,
    })),
    [fonts, t],
  );

  return (
    <div className={styles.wrapper}>
      {label ? <label className={styles.label}>{label}</label> : null}
      <Select
        options={options}
        value={value}
        onChange={(val) => onChange(val)}
        theme={theme}
        fullWidth
        searchable
        aria-label={label}
      />
      <p
        className={styles.preview}
        dir={dir}
        style={{ fontFamily: `'${selectedFamily}', var(--font-family-sans)` }}
      >
        {preview}
      </p>
      {script === 'ltr' && (
        <p
          className={styles.preview}
          dir="rtl"
          style={{
            fontFamily: `'${selectedFamily}', var(--font-family-sans)`,
            fontSize: 'var(--font-size-sm, 0.875rem)',
            opacity: 0.8,
          }}
        >
          {LTR_ARABIC_FALLBACK_PREVIEW}
        </p>
      )}
    </div>
  );
}
