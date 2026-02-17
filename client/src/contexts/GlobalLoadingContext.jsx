import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { SimpleLoading } from '@ui';

const GlobalLoadingContext = createContext({
  startLoading: () => () => {},
  isLoading: false
});

export const GlobalLoadingProvider = ({ children }) => {
  const [activeCount, setActiveCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const startLoading = useCallback(() => {
    setActiveCount((count) => count + 1);
    let stopped = false;

    return () => {
      if (stopped) return;
      stopped = true;
      setActiveCount((count) => Math.max(0, count - 1));
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

  const value = useMemo(
    () => ({
      startLoading,
      isLoading: isVisible
    }),
    [startLoading, isVisible]
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      {isVisible && <SimpleLoading.BrandFullscreen />}
    </GlobalLoadingContext.Provider>
  );
};

export const useGlobalLoading = () => useContext(GlobalLoadingContext);

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
