/**
 * Example Service with Performance Monitoring Integration
 * Shows how to use performance.js utilities in your services
 */

import { withPerformanceMonitoring, memoizedOperations, batchProcessor } from '@utils/performance';
import logger from '@utils/logger';

// Example: Wrap your service functions with performance monitoring
export const getUserData = withPerformanceMonitoring(
  async (userId) => {
    // Your existing logic here
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  'get_user_data'
);

// Example: Use memoized operations for frequently accessed data
export const getCourseData = memoizedOperations.getCourseById;

// Example: Batch processing for multiple operations
export const processMultipleGrades = async (grades) => {
  return await batchProcessor.processBatch(
    grades,
    async (grade) => {
      // Process individual grade
      const response = await fetch(`/api/grades/${grade.id}`, {
        method: 'PUT',
        body: JSON.stringify(grade)
      });
      return response.json();
    },
    {
      batchSize: 10,
      maxConcurrency: 3,
      delayBetweenBatches: 100
    }
  );
};

// Example: Resource monitoring for real-time connections
export const setupRealtimeListener = (listenerId) => {
  const { resourceMonitor } = require('@utils/performance');
  
  // Track connection
  resourceMonitor.addConnection(listenerId);
  
  // Your listener setup
  const unsubscribe = someRealtimeService.onSnapshot((data) => {
    // Handle updates
  });
  
  // Return cleanup function
  return () => {
    unsubscribe();
    resourceMonitor.removeConnection(listenerId);
  };
};
