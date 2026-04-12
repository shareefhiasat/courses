import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './LoadingProgress.module.css';


import { info, error, warn, debug } from '@services/utils/logger.js';const LoadingProgress = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLoadingRef = useRef(false);
  const timerRef = useRef(null);

  const endTimerRef = useRef(null);

  const startProgress = useCallback(() => {
    isLoadingRef.current = true;
    setProgress(0);
    setVisible(true);
  }, []);

  const endProgress = useCallback(() => {
    isLoadingRef.current = false;
    setProgress(100);
    endTimerRef.current = setTimeout(() => setVisible(false), 400);
  }, []);

  useEffect(() => {
    window.addEventListener('loading-start', startProgress);
    window.addEventListener('loading-end', endProgress);
    return () => {
      window.removeEventListener('loading-start', startProgress);
      window.removeEventListener('loading-end', endProgress);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, [startProgress, endProgress]);

  // Simulate incremental progress while loading
  useEffect(() => {
    if (!visible || !isLoadingRef.current) return;
    if (progress >= 90) return;
    timerRef.current = setTimeout(() => {
      setProgress(p => Math.min(p + Math.random() * 15 + 5, 90));
    }, 200);
    return () => clearTimeout(timerRef.current);
  }, [visible, progress]);

  return (
    <>
      {visible && (
        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>
  );
};

export default LoadingProgress;
