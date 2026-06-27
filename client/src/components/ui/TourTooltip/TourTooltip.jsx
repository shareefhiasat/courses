import React, { useState } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';

const TourTooltip = ({ tourSeenKey } = {}) => {
  const TourTooltipInner = (props) => {
    const { theme } = useTheme();
    const { t, lang } = useLang();
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
      size,
    } = props;

    const isDark = theme === 'dark';
    const isRTL = lang === 'ar';
    const totalSteps = size || (step?.data?.totalSteps) || 0;
    const currentStep = (index ?? 0) + 1;
    const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

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
      if (skipProps?.onClick) skipProps.onClick(e);
    };

    const handleClose = (e) => {
      if (tourSeenKey && dontShow) {
        try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
      }
      if (closeProps?.onClick) closeProps.onClick(e);
    };

    const handlePrimary = (e) => {
      if (tourSeenKey && dontShow && isLastStep) {
        try { localStorage.setItem(tourSeenKey, 'true'); } catch {}
      }
      if (primaryProps?.onClick) primaryProps.onClick(e);
    };

    const btnStyle = (variant = 'primary') => ({
      padding: '0.25rem 0.6rem',
      borderRadius: 4,
      border: variant === 'primary'
        ? '1px solid var(--color-primary, #800020)'
        : `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 600,
      minWidth: 56,
      textAlign: 'center',
      transition: 'all 0.15s ease',
      background: variant === 'primary'
        ? 'var(--color-primary, #800020)'
        : (isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb'),
      color: variant === 'primary' ? '#fff' : (isDark ? '#e5e7eb' : '#374151'),
    });

    const checkboxLabel = t('tour_dont_show_again') || "Don't show this tour again";
    const closeLabel = t('tour_close') || 'Close';
    const skipLabel = t('tour_skip') || 'Skip';
    const nextLabel = t('tour_next') || 'Next';
    const finishLabel = t('tour_finish') || 'Finish';
    const backLabel = t('tour_back') || 'Back';
    const stepLabel = isRTL
      ? `الخطوة ${currentStep} من ${totalSteps}`
      : `Step ${currentStep} of ${totalSteps}`;

    return (
      <div
        {...tooltipProps}
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          background: isDark ? '#1f2937' : '#fff',
          color: isDark ? '#e5e7eb' : '#111',
          borderRadius: 10,
          padding: 0,
          maxWidth: 340,
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          fontSize: 14,
          lineHeight: 1.5,
          overflow: 'hidden',
          ...tooltipProps?.style,
        }}
      >
        {/* Progress bar */}
        {totalSteps > 0 && (
          <div style={{
            height: 4,
            background: isDark ? '#374151' : '#e5e7eb',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              borderRadius: 0,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}

        <div style={{ padding: '1rem' }}>
          {/* Header with step counter and close button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <div style={{
              fontWeight: 700,
              fontSize: 12,
              color: isDark ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {stepLabel}
            </div>
            <button
              {...closeProps}
              onClick={handleClose}
              aria-label={closeLabel}
              title={closeLabel}
              style={{
                background: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                cursor: 'pointer',
                color: isDark ? '#e5e7eb' : '#6b7280',
                fontSize: 13,
                lineHeight: 1,
                width: 22,
                height: 22,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
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

            {/* Buttons row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}>
              <div>
                {!isFirstStep && (
                  <button
                    {...backProps}
                    title={backLabel}
                    style={btnStyle('secondary')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.15)' : '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb';
                    }}
                  >
                    {isRTL ? '→ ' : '← '}{backLabel}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                {!isLastStep && (
                  <button
                    {...skipProps}
                    onClick={handleSkip}
                    title={skipLabel}
                    style={btnStyle('secondary')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.15)' : '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb';
                    }}
                  >
                    {skipLabel}
                  </button>
                )}
                <button
                  {...primaryProps}
                  onClick={handlePrimary}
                  title={isLastStep ? finishLabel : nextLabel}
                  style={btnStyle('primary')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {isLastStep ? finishLabel : nextLabel}
                  {isLastStep ? ' ✓' : (isRTL ? ' ←' : ' →')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return TourTooltipInner;
};

export default TourTooltip;
