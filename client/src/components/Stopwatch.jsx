import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../contexts/LangContext';

const Stopwatch = ({ onTimeUpdate, autoStart = false, showControls = true }) => {
  const { t } = useLang();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 1;
          if (onTimeUpdate) onTimeUpdate(newTime);
          return newTime;
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
  }, [isRunning, isPaused, onTimeUpdate]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    if (time < 300) return '#4caf50'; // < 5 min
    if (time < 900) return '#ff9800'; // < 15 min
    return '#f44336'; // > 15 min
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
    setTime(0);
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
      {/* Stopwatch Display */}
      <div style={{
        fontSize: '3rem',
        fontWeight: 700,
        fontFamily: 'monospace',
        color: getColor(),
        marginBottom: '1rem',
        letterSpacing: '0.1em'
      }}>
        {formatTime(time)}
      </div>

      {/* Status Text */}
      <div style={{
        fontSize: '0.875rem',
        color: '#666',
        marginBottom: '1rem'
      }}>
        {!isRunning && time === 0 && (t('ready_to_track') || 'Ready to track time')}
        {isRunning && !isPaused && (t('tracking_time') || 'Tracking time...')}
        {isPaused && (t('paused') || 'Paused')}
      </div>

      {/* Controls */}
      {showControls && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {!isRunning && (
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

          {time > 0 && (
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

      {/* Time Milestones */}
      {time > 0 && (
        <div style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: '#999'
        }}>
          {time >= 3600 && `${Math.floor(time / 3600)} ${t('hours') || 'hours'} `}
          {time >= 60 && `${Math.floor((time % 3600) / 60)} ${t('minutes') || 'minutes'} `}
          {time % 60} {t('seconds') || 'seconds'}
        </div>
      )}
    </div>
  );
};

export default Stopwatch;
