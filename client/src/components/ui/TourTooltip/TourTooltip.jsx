import React, { useState } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';

/**
 * TourTooltip
 * Custom Joyride tooltip with a "Don't show again" checkbox.
 *
 * Usage:
 *   <Joyride tooltipComponent={TourTooltip({ tourSeenKey: 'myTour_v1' })} ... />
 */
const TourTooltip = ({ tourSeenKey } = {}) => {
  const TourTooltipInner = (props) => {
    const { theme } = useTheme();
    const { t } = useLang();
    const {
      index,
      step,
      primaryProps,
      skipProps,
      backProps,
      closeProps,
      tooltipProps,
      isLastStep,
      isFirstStep,
    } = props;

    const isDark = theme === 'dark';
    const [dontShow, setDontShow] = useState(() => {
      if (!tourSeenKey) return false;
      try {
        return localStorage.getItem(tourSeenKey) === 'true';
      } catch {
        return false;
      }
    });

    const handleSkip = (e) => {
      if (tourSeenKey && dontShow) {
        try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
      }
      if (skipProps?.onClick) {
        skipProps.onClick(e);
      }
    };

    const handleClose = (e) => {
      if (tourSeenKey && dontShow) {
        try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
      }
      if (closeProps?.onClick) {
        closeProps.onClick(e);
      }
    };

    const handlePrimary = (e) => {
      if (tourSeenKey && dontShow && isLastStep) {
        try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
      }
      if (primaryProps?.onClick) {
        primaryProps.onClick(e);
      }
    };

    const btnStyle = (variant = 'primary') => ({
      padding: '0.4rem 0.8rem',
      borderRadius: 6,
      border: '1px solid var(--border)',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      background: variant === 'primary'
        ? 'var(--color-primary, #800020)'
        : (isDark ? 'rgba(255,255,255,0.1)' : 'var(--panel)'),
      color: variant === 'primary' ? '#fff' : 'var(--text)',
    });

    const checkboxLabel = t('tour_dont_show_again') || "Don't show again";
    const closeLabel = t('tour_close') || 'Close';
    const skipLabel = t('tour_skip') || 'Skip';
    const nextLabel = t('tour_next') || 'Next';
    const finishLabel = t('tour_finish') || 'Finish';
    const backLabel = t('tour_back') || 'Back';

    return (
      <div
        {...tooltipProps}
        style={{
          background: isDark ? '#1f2937' : '#fff',
          color: isDark ? '#e5e7eb' : '#111',
          borderRadius: 10,
          padding: '1rem',
          maxWidth: 320,
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          fontSize: 14,
          lineHeight: 1.5,
          ...tooltipProps?.style,
        }}
      >
        {/* Close (X) in the top-right corner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-primary, #800020)' }}>
            {step.title || `Step ${index + 1}`}
          </div>
          <button
            {...closeProps}
            onClick={handleClose}
            aria-label={closeLabel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#e5e7eb' : '#6b7280',
              fontSize: 18,
              lineHeight: 1,
              padding: 2,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 12 }}>
          {step.content}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Don't show again checkbox */}
          {tourSeenKey && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 12,
                color: isDark ? '#e5e7eb' : '#374151',
              }}
            >
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                style={{ accentColor: 'var(--color-primary, #800020)', cursor: 'pointer' }}
              />
              {checkboxLabel}
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              {!isFirstStep && (
                <button {...backProps} style={btnStyle('secondary')}>
                  {backLabel}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!isLastStep && (
                <button {...skipProps} onClick={handleSkip} style={btnStyle('secondary')}>
                  {skipLabel}
                </button>
              )}
              <button {...primaryProps} onClick={handlePrimary} style={btnStyle('primary')}>
                {isLastStep ? finishLabel : nextLabel}
                {isLastStep ? '' : ' →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return TourTooltipInner;
};

export default TourTooltip;
