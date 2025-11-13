import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../contexts/LangContext';

const Timer = ({ duration = 300, onComplete, autoStart = false, showControls = true }) => {
  const { t } = useLang();
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (onComplete) onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, onComplete]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((duration - timeLeft) / duration) * 100;
  };

  const getColor = () => {
    const percentage = (timeLeft / duration) * 100;
    if (percentage > 50) return '#4caf50';
    if (percentage > 20) return '#ff9800';
    return '#f44336';
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: `3px solid ${getColor()}`
    }}>
      {/* Timer Display */}
      <div style={{
        fontSize: '3rem',
        fontWeight: 700,
        fontFamily: 'monospace',
        color: getColor(),
        marginBottom: '1rem',
        letterSpacing: '0.1em'
      }}>
        {formatTime(timeLeft)}
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        background: '#e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        <div style={{
          width: `${getProgressPercentage()}%`,
          height: '100%',
          background: getColor(),
          transition: 'width 1s linear, background 0.3s'
        }} />
      </div>

      {/* Status Text */}
      <div style={{
        fontSize: '0.875rem',
        color: '#666',
        marginBottom: '1rem'
      }}>
        {!isRunning && timeLeft === duration && (t('ready_to_start') || 'Ready to start')}
        {isRunning && !isPaused && (t('time_running') || 'Time running...')}
        {isPaused && (t('paused') || 'Paused')}
        {timeLeft === 0 && (t('time_up') || 'Time\'s up!')}
      </div>

      {/* Controls */}
      {showControls && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {!isRunning && timeLeft > 0 && (
            <button
              onClick={handleStart}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ▶️ {t('start') || 'Start'}
            </button>
          )}

          {isRunning && !isPaused && (
            <button
              onClick={handlePause}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ⏸️ {t('pause') || 'Pause'}
            </button>
          )}

          {isPaused && (
            <button
              onClick={handleResume}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ▶️ {t('resume') || 'Resume'}
            </button>
          )}

          {(isRunning || isPaused || timeLeft === 0) && (
            <button
              onClick={handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔄 {t('reset') || 'Reset'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Timer;
