/**
 * Example Service with Performance Monitoring Integration
 * Shows how to use performance.js utilities in your services
 */

import logger from '@utils/logger';

// Example: Wrap your service functions with performance monitoring
export const getUserData = async (userId) => {
  // Your existing logic here
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
};


export const processMultipleGrades = async (grades) => {
  // Process grades sequentially (simplified without batch processor)
  const results = [];
  for (const grade of grades) {
    try {
      const response = await fetch(`/api/grades/${grade.id}`, {
        method: 'PUT',
        body: JSON.stringify(grade)
      });
      results.push(await response.json());
    } catch (error) {
      logger.error('Error processing grade:', error);
      results.push({ error: error.message });
    }
  }
  return results;
};

export const setupRealtimeListener = (listenerId) => {
  // Your listener setup
  const unsubscribe = someRealtimeService.onSnapshot((data) => {
    // Handle updates
  });
  
  // Return cleanup function
  return () => {
    unsubscribe();
  };
};
