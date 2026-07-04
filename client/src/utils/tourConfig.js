/** Shared Joyride defaults — keeps tooltips below the sticky navbar. */

export const NAVBAR_SCROLL_OFFSET = 80;

export function getTourFloaterProps() {
  return {
    offset: 12,
    styles: {
      floater: { filter: 'none' },
    },
    options: {
      preventOverflow: {
        boundariesElement: 'viewport',
        padding: NAVBAR_SCROLL_OFFSET,
      },
    },
  };
}

export function getTourStyles(theme) {
  const isDark = theme === 'dark';
  return {
    options: {
      primaryColor: 'var(--color-primary, #800020)',
      textColor: isDark ? '#e5e7eb' : '#111',
      backgroundColor: isDark ? '#1f2937' : '#fff',
      overlayColor: 'rgba(0,0,0,0.5)',
      arrowColor: isDark ? '#1f2937' : '#fff',
      zIndex: 10050,
    },
    overlay: { zIndex: 10040 },
    spotlight: { zIndex: 10045 },
  };
}

export function getTourLocale(t) {
  return {
    back: t('tour_back'),
    close: t('tour_close'),
    last: t('tour_finish'),
    next: t('tour_next'),
    skip: t('tour_skip'),
  };
}

/** Props spread onto every <Joyride /> instance. */
export function getJoyrideBaseProps({ theme, t } = {}) {
  return {
    continuous: true,
    disableScrolling: false,
    scrollOffset: NAVBAR_SCROLL_OFFSET,
    scrollToFirstStep: true,
    showSkipButton: true,
    showProgress: true,
    spotlightClicks: false,
    floaterProps: getTourFloaterProps(),
    ...(theme && t
      ? {
          locale: getTourLocale(t),
          styles: getTourStyles(theme),
        }
      : {}),
  };
}

/** Ribbon / navbar-adjacent targets need bottom placement and extra padding. */
export function ribbonTabStep(target, content) {
  return {
    target,
    content,
    disableBeacon: true,
    placement: 'bottom',
    spotlightPadding: 8,
    offset: 10,
  };
}
