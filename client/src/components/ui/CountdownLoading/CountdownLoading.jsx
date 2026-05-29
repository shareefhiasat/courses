import React, { useState, useEffect, useCallback } from 'react';
import './CountdownLoading.css';

/**
 * CountdownLoading - A reusable countdown timer component for auto-refresh indicators
 * Shows a progress bar at the top that counts down from a specified duration
 * 
 * @param {Object} props
 * @param {number} props.duration - Duration in seconds (default: 30)
 * @param {Function} props.onComplete - Callback when countdown completes
 * @param {boolean} props.isActive - Whether the countdown is active (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
const CountdownLoading = ({
  duration = 30,
  onComplete,
  isActive = true,
  className = '',
  style = {}
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isActive || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (onComplete) {
            onComplete();
          }
          return duration; // Reset to start new cycle
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, duration, onComplete]);

  // Reset when duration changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  // Pause when page is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const progress = ((duration - timeLeft) / duration) * 100;

  if (!isActive) {
    return null;
  }

  return (
    <div className={`countdown-loading ${className}`} style={style}>
      <div className="countdown-loading__bar">
        <div 
          className="countdown-loading__progress" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="countdown-loading__text">
        {timeLeft}s
      </div>
    </div>
  );
};

export default CountdownLoading;
