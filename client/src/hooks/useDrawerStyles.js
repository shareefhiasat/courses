import { useMemo } from 'react';

export const DRAWER_BACKDROP_COLOR = 'rgba(0,0,0,0.45)';

/**
 * Produces the standard drawer + backdrop style objects shared by
 * DeductionDrawer, DayWorkflowsDrawer, MarksHistoryDrawer, etc.
 *
 * @param {Object} opts
 * @param {boolean} opts.isOpen
 * @param {number} opts.drawerWidth
 * @param {boolean} opts.isRTL
 * @param {string} opts.bgColor
 * @param {Object} [opts.extraDrawerStyle]
 * @param {Object} [opts.extraBackdropStyle]
 * @returns {{ drawerStyle:Object, backdropStyle:Object }}
 */
export default function useDrawerStyles({
  isOpen,
  drawerWidth,
  isRTL,
  bgColor,
  extraDrawerStyle,
  extraBackdropStyle,
}) {
  const drawerStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    right: isRTL ? 'auto' : (isOpen ? 0 : `-${drawerWidth}px`),
    left: isRTL ? (isOpen ? 0 : `-${drawerWidth}px`) : 'auto',
    width: `${drawerWidth}px`,
    height: '100vh',
    background: bgColor,
    boxShadow: isRTL ? '2px 0 10px rgba(0,0,0,0.1)' : '-2px 0 10px rgba(0,0,0,0.1)',
    transition: 'right 0.3s ease-in-out, left 0.3s ease-in-out',
    zIndex: 1000,
    overflow: 'auto',
    ...extraDrawerStyle,
  }), [isOpen, drawerWidth, isRTL, bgColor, extraDrawerStyle]);

  const backdropStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: isRTL ? `${drawerWidth}px` : 0,
    right: isRTL ? 0 : `${drawerWidth}px`,
    height: '100vh',
    background: DRAWER_BACKDROP_COLOR,
    zIndex: 999,
    ...extraBackdropStyle,
  }), [drawerWidth, isRTL, extraBackdropStyle]);

  return { drawerStyle, backdropStyle };
}
