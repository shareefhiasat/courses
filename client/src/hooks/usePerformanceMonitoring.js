/**
 * Custom Hook for Performance Monitoring
 * Integrates performance.js utilities with React components
 */

import { useEffect, useCallback, useRef } from 'react';
import { performanceMetrics, resourceMonitor } from '@utils/performance';

export const usePerformanceMonitoring = (operationName) => {
  const startTimeRef = useRef(null);
  
  const startTiming = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);
  
  const endTiming = useCallback((success = true) => {
    if (startTimeRef.current) {
      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;
      performanceMetrics.record(operationName, duration, success);
      startTimeRef.current = null;
    }
  }, [operationName]);
  
  const monitorAsync = useCallback(async (asyncFn) => {
    startTiming();
    try {
      const result = await asyncFn();
      endTiming(true);
      return result;
    } catch (error) {
      endTiming(false);
      throw error;
    }
  }, [startTiming, endTiming]);
  
  return { startTiming, endTiming, monitorAsync };
};

export const useResourceMonitoring = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      const memoryUsage = resourceMonitor.getMemoryUsage();
      if (memoryUsage && memoryUsage.percentage > 80) {
        console.warn('High memory usage detected:', memoryUsage);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    getMemoryUsage: resourceMonitor.getMemoryUsage,
    getConnectionCount: resourceMonitor.getConnectionCount
  };
};
