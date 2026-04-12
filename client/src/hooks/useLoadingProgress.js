import { useCallback } from 'react';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * Hook for controlling the global loading progress bar
 * Provides easy methods to show/hide/update loading progress
 */
export const useLoadingProgress = () => {
  const startLoading = useCallback(() => {
    window.dispatchEvent(new CustomEvent('loading-start'));
  }, []);

  const updateProgress = useCallback((progress) => {
    window.dispatchEvent(new CustomEvent('loading-progress', { detail: { progress } }));
  }, []);

  const endLoading = useCallback(() => {
    window.dispatchEvent(new CustomEvent('loading-end'));
  }, []);

  const simulateLoading = useCallback(async (duration = 2000) => {
    startLoading();
    
    // Simulate progress updates
    const steps = [10, 25, 40, 60, 75, 85, 95];
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, duration / steps.length));
      updateProgress(step);
    }
    
    // Complete loading
    await new Promise(resolve => setTimeout(resolve, duration / steps.length));
    endLoading();
  }, [startLoading, updateProgress, endLoading]);

  return {
    startLoading,
    updateProgress,
    endLoading,
    simulateLoading
  };
};

export default useLoadingProgress;
