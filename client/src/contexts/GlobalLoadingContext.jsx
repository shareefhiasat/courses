import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { SimpleLoading } from '@ui';

const GlobalLoadingContext = createContext({
  startLoading: () => () => {},
  isLoading: false,
  clearLoading: () => {}
});

export const GlobalLoadingProvider = ({ children }) => {
  const [activeCount, setActiveCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  // Debug function to clear stuck loading
  const clearLoading = useCallback(() => {
    console.warn('[GlobalLoading] Manual clear triggered');
    setActiveCount(0);
    setIsVisible(false);
    setMessage('');
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const startLoading = useCallback((options = {}) => {
    console.log('[GlobalLoading] Start loading, count:', activeCount + 1, 'message:', options.message);
    setActiveCount((count) => count + 1);
    if (options.message) {
      setMessage(options.message);
    }
    let stopped = false;

    return () => {
      if (stopped) return;
      stopped = true;
      console.log('[GlobalLoading] Stop loading called');
      setActiveCount((prevCount) => {
        const newCount = Math.max(0, prevCount - 1);
        console.log('[GlobalLoading] New count:', newCount);
        if (newCount === 0) {
          setMessage('');
        }
        return newCount;
      });
    };
  }, []);

  useEffect(() => {
    if (activeCount > 0) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      if (!isVisible) {
        showTimerRef.current = setTimeout(() => {
          setIsVisible(true);
        }, 0);
      }
    } else {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
      if (isVisible) {
        hideTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          setMessage(''); // Clear message when hiding
        }, 350);
      }
    }

    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [activeCount, isVisible]);

  // Safety mechanism: force hide after 10 seconds
  useEffect(() => {
    if (isVisible) {
      const safetyTimer = setTimeout(() => {
        console.warn('[GlobalLoading] Force hiding loading after 10 seconds');
        setIsVisible(false);
        setMessage('');
        setActiveCount(0);
      }, 10000);

      return () => clearTimeout(safetyTimer);
    }
  }, [isVisible]);

  // Listen for manual clear events
  useEffect(() => {
    const handleClear = () => {
      console.warn('[GlobalLoading] Manual clear event received');
      clearLoading();
    };

    window.addEventListener('clearGlobalLoading', handleClear);
    return () => window.removeEventListener('clearGlobalLoading', handleClear);
  }, [clearLoading]);

  const value = useMemo(
    () => ({
      startLoading,
      isLoading: isVisible,
      clearLoading
    }),
    [startLoading, isVisible, clearLoading]
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      {isVisible && <SimpleLoading.BrandFullscreen message={message} />}
    </GlobalLoadingContext.Provider>
  );
};

export const useGlobalLoading = () => useContext(GlobalLoadingContext);

// Add global debug function
if (typeof window !== 'undefined') {
  window.clearGlobalLoading = () => {
    console.warn('[GlobalLoading] Manual clear from console - this will work on next render');
    // Force a state reset by dispatching a custom event
    window.dispatchEvent(new CustomEvent('clearGlobalLoading'));
  };
}

export const GlobalLoadingFallback = () => {
  const { startLoading } = useGlobalLoading();
  const stopRef = useRef(null);

  useEffect(() => {
    stopRef.current = startLoading();
    return () => {
      if (stopRef.current) {
        stopRef.current();
      }
    };
  }, [startLoading]);

  return null;
};
