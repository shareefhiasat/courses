/** Shared Joyride defaults — keeps tooltips below the sticky navbar. */

export const NAVBAR_SCROLL_OFFSET = 80;
/** Above app modals (panel z-index 10000) — overlay, spotlight, and tooltip stack together. */
export const MODAL_TOUR_Z_INDEX = 10200;

export function getTourFloaterProps(padding = NAVBAR_SCROLL_OFFSET) {
  return {
    offset: 12,
    styles: {
      floater: { filter: 'none' },
    },
    options: {
      preventOverflow: {
        boundariesElement: 'viewport',
        padding,
      },
    },
  };
}

export function getTourStyles(theme, zIndex = 10050) {
  const isDark = theme === 'dark';
  return {
    options: {
      primaryColor: 'var(--color-primary, #800020)',
      textColor: isDark ? '#e5e7eb' : '#111',
      backgroundColor: isDark ? '#1f2937' : '#fff',
      overlayColor: 'rgba(0, 0, 0, 0.55)',
      arrowColor: isDark ? '#1f2937' : '#fff',
      zIndex,
    },
    overlay: {
      zIndex,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    spotlight: {
      zIndex: zIndex + 1,
      borderRadius: 8,
    },
    tooltip: {
      zIndex: zIndex + 2,
    },
    tooltipContainer: {
      zIndex: zIndex + 2,
    },
  };
}

export function getModalTourStyles(theme) {
  return getTourStyles(theme, MODAL_TOUR_Z_INDEX);
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

/**
 * Joyride props for tours inside modals/dialogs.
 * Spotlight stays visible (cutout + ring); z-index stack clears the modal panel.
 */
export function getModalJoyrideProps({ theme, t } = {}) {
  return {
    continuous: true,
    disableScrolling: true,
    scrollToFirstStep: false,
    showSkipButton: true,
    showProgress: true,
    spotlightClicks: false,
    disableScrollParentFix: false,
    floaterProps: getTourFloaterProps(16),
    ...(theme && t
      ? {
          locale: getTourLocale(t),
          styles: getModalTourStyles(theme),
        }
      : {}),
  };
}

/** Standard step for a field/control inside a modal. */
export function modalTourStep(target, content, extra = {}) {
  return {
    target,
    content,
    disableBeacon: true,
    placement: 'bottom',
    spotlightPadding: 8,
    offset: 10,
    ...extra,
  };
}

/** Ribbon / tab button inside a modal. */
export function modalTabStep(target, content, tab) {
  return modalTourStep(target, content, { tab, placement: 'bottom' });
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
