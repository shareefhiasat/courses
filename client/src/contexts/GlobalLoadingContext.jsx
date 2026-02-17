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

  const clearLoading = useCallback(() => {
    setActiveCount(0);
    setIsVisible(false);
    setMessage('');
    // End loading progress when manually cleared
    window.dispatchEvent(new CustomEvent('loading-end'));
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const startLoading = useCallback((options = {}) => {
    setActiveCount((count) => count + 1);
    if (options.message) {
      setMessage(options.message);
    }
    let stopped = false;

    return () => {
      if (stopped) return;
      stopped = true;
      setActiveCount((prevCount) => {
        const newCount = Math.max(0, prevCount - 1);
        if (newCount === 0) {
          setMessage('');
        }
        return newCount;
      });
    };
  }, []);

  useEffect(() => {
    if (activeCount > 0) {
      clearTimeout(hideTimerRef.current);
      if (!isVisible) {
        showTimerRef.current = setTimeout(() => {
          setIsVisible(true);
          window.dispatchEvent(new CustomEvent('loading-start'));
        }, 0);
      }
    } else {
      clearTimeout(showTimerRef.current);
      if (isVisible) {
        hideTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          setMessage('');
          window.dispatchEvent(new CustomEvent('loading-end'));
        }, 350);
      }
    }

    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, [activeCount, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const safetyTimer = setTimeout(() => {
      setIsVisible(false);
      setMessage('');
      setActiveCount(0);
      window.dispatchEvent(new CustomEvent('loading-end'));
    }, 10000);
    return () => clearTimeout(safetyTimer);
  }, [isVisible]);

  useEffect(() => {
    window.addEventListener('clearGlobalLoading', clearLoading);
    return () => window.removeEventListener('clearGlobalLoading', clearLoading);
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

if (typeof window !== 'undefined') {
  window.clearGlobalLoading = () => {
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
