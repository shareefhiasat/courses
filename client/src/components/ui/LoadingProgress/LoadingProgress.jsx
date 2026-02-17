import React, { useEffect, useRef, useState } from 'react';

const LoadingProgress = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLoadingRef = useRef(false);
  const timerRef = useRef(null);

  const startProgress = () => {
    isLoadingRef.current = true;
    setProgress(0);
    setVisible(true);
  };

  const endProgress = () => {
    isLoadingRef.current = false;
    setProgress(100);
    setTimeout(() => setVisible(false), 400);
  };

  useEffect(() => {
    window.addEventListener('loading-start', startProgress);
    window.addEventListener('loading-end', endProgress);
    return () => {
      window.removeEventListener('loading-start', startProgress);
      window.removeEventListener('loading-end', endProgress);
    };
  }, []);

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
      {/* DEBUG: Always visible dot to confirm component is mounted */}
      <div style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: visible ? '#d4af37' : '#ccc',
        zIndex: 2147483647,
        pointerEvents: 'none',
        boxShadow: visible ? '0 0 8px #d4af37' : 'none',
      }} />

      {visible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: 'rgba(0,0,0,0.15)',
            zIndex: 2147483647,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #d4af37, #f4e4a6, #d4af37)',
              transition: 'width 0.2s ease',
              boxShadow: '0 0 10px #d4af37, 0 0 20px #f4e4a6',
            }}
          />
        </div>
      )}
    </>
  );
};

export default LoadingProgress;
