import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logLearningTime } from '../firebase/studentProgress';

/**
 * Hook to track time spent on a page and log to student progress
 * @param {string} pageName - Name of the page/activity being tracked
 * @param {boolean} enabled - Whether tracking is enabled (default: true)
 */
export function useTimeTracking(pageName, enabled = true) {
  const { user } = useAuth();
  const startTimeRef = useRef(null);
  const accumulatedTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled || !user?.uid) return;

    // Start tracking
    startTimeRef.current = Date.now();

    // Track visibility changes (pause when tab is hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - accumulate time
        if (startTimeRef.current) {
          accumulatedTimeRef.current += Date.now() - startTimeRef.current;
          startTimeRef.current = null;
        }
      } else {
        // Tab visible again - restart timer
        startTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup and log time when component unmounts or user leaves
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Calculate total time spent
      let totalTime = accumulatedTimeRef.current;
      if (startTimeRef.current) {
        totalTime += Date.now() - startTimeRef.current;
      }

      // Only log if spent more than 10 seconds
      if (totalTime > 10000 && user?.uid) {
        const hours = totalTime / (1000 * 60 * 60); // Convert to hours
        logLearningTime(user.uid, hours).catch(err => {
          console.warn('Failed to log learning time:', err);
        });
      }

      // Reset refs
      startTimeRef.current = null;
      accumulatedTimeRef.current = 0;
    };
  }, [user?.uid, pageName, enabled]);
}
