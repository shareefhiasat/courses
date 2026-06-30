import { useState, useEffect } from 'react';

/**
 * Shared mobile detection hook with debounced resize.
 * Used by QRScannerPage, QRScanner, StudentRoster, StudentActionStatsPanel, StudentActionZapPanel.
 * @param {number} breakpoint - Pixel width threshold (default 768)
 * @param {number} debounceMs - Resize debounce delay (default 150)
 * @returns {{ isMobile: boolean }}
 */
export const useMobileDetect = (breakpoint = 768, debounceMs = 150) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth <= breakpoint);
      }, debounceMs);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint, debounceMs]);

  return { isMobile };
};

export default useMobileDetect;
