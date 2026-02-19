/**
 * Performance Optimization Utilities for LMS Services
 * Provides memoization, query optimization, and performance monitoring
 */

import { memoize, measurePerformance, optimizeQuery } from './errorHandling.js';
import logger from '@utils/logger';

// Memoized database operations for frequently accessed data
export const memoizedOperations = {
  // Memoize user lookups since they're frequently accessed
  getUserById: memoize(async (userId) => {
    const { getUserById } = await import('../services/business/userService.js');
    return await getUserById(userId);
  }),
  
  // Memoize course lookups
  getCourseById: memoize(async (courseId) => {
    const { getCourseById } = await import('../services/business/courseService.js');
    return await getCourseById(courseId);
  }),
  
  // Memoize class lookups
  getClassById: memoize(async (classId) => {
    const { getClassById } = await import('../services/business/classService.js');
    return await getClassById(classId);
  })
};

// Performance monitoring for database operations
export const performanceMonitors = {
  // Monitor query performance
  monitorQuery: measurePerformance(
    async (queryFn, ...args) => {
      return await queryFn(...args);
    },
    'database_query'
  ),
  
  // Monitor batch operations
  monitorBatch: measurePerformance(
    async (batchFn, items) => {
      return await batchFn(items);
    },
    'batch_operation'
  ),
  
  // Monitor file operations
  monitorFileOperation: measurePerformance(
    async (fileFn, ...args) => {
      return await fileFn(...args);
    },
    'file_operation'
  )
};

// Query optimization helpers
export const queryOptimizers = {
  // Optimize large queries with pagination
  paginateQuery: (queryFn, pageSize = 50) => {
    return async (filters = {}) => {
      const page = filters.page || 1;
      const offset = (page - 1) * pageSize;
      
      const paginatedFilters = {
        ...filters,
        limit: pageSize,
        offset
      };
      
      return await queryFn(paginatedFilters);
    };
  },
  
  // Optimize search queries with debouncing
  debounceSearch: (searchFn, delay = 300) => {
    let timeoutId;
    
    return async (...args) => {
      clearTimeout(timeoutId);
      
      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await searchFn(...args);
            resolve(result);
          } catch (error) {
            resolve({ success: false, error: error.message });
          }
        }, delay);
      });
    };
  },
  
  // Cache frequently accessed static data
  cacheStaticData: (dataFn, ttl = 5 * 60 * 1000) => { // 5 minutes default TTL
    let cache = null;
    let cacheTime = 0;
    
    return async (...args) => {
      const now = Date.now();
      
      // Return cached data if still valid
      if (cache && (now - cacheTime) < ttl) {
        return cache;
      }
      
      // Fetch fresh data
      try {
        cache = await dataFn(...args);
        cacheTime = now;
        return cache;
      } catch (error) {
        // Return stale cache if available, otherwise throw error
        if (cache) {
          logger.warn('Using stale cache due to fetch error:', { error: error.message });
          return cache;
        }
        throw error;
      }
    };
  }
};

// Performance metrics collector
export const performanceMetrics = {
  metrics: new Map(),
  
  // Record operation performance
  record: (operation, duration, success = true) => {
    if (!performanceMetrics.metrics.has(operation)) {
      performanceMetrics.metrics.set(operation, {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        successCount: 0,
        failureCount: 0,
        minDuration: Infinity,
        maxDuration: 0
      });
    }
    
    const metric = performanceMetrics.metrics.get(operation);
    metric.count++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.count;
    
    if (success) {
      metric.successCount++;
    } else {
      metric.failureCount++;
    }
    
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
  },
  
  // Get performance report
  getReport: () => {
    const report = {};
    
    for (const [operation, metric] of performanceMetrics.metrics.entries()) {
      report[operation] = {
        ...metric,
        successRate: (metric.successCount / metric.count * 100).toFixed(2) + '%',
        failureRate: (metric.failureCount / metric.count * 100).toFixed(2) + '%'
      };
    }
    
    return report;
  },
  
  // Clear metrics
  clear: () => {
    performanceMetrics.metrics.clear();
  }
};

// Performance monitoring decorator
export const withPerformanceMonitoring = (fn, operationName) => {
  return async (...args) => {
    const startTime = performance.now();
    let success = true;
    
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceMetrics.record(operationName, duration, success);
      
      // Log slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
    }
  };
};

// Resource usage monitor
export const resourceMonitor = {
  // Monitor memory usage
  getMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        percentage: Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100)
      };
    }
    return null;
  },
  
  // Monitor connection count (for real-time listeners)
  activeConnections: new Set(),
  
  addConnection: (id) => {
    resourceMonitor.activeConnections.add(id);
    logger.debug(`Active connections: ${resourceMonitor.activeConnections.size}`);
  },
  
  removeConnection: (id) => {
    resourceMonitor.activeConnections.delete(id);
    logger.debug(`Active connections: ${resourceMonitor.activeConnections.size}`);
  },
  
  getConnectionCount: () => {
    return resourceMonitor.activeConnections.size;
  }
};

// Batch processing optimization
export const batchProcessor = {
  // Process items in batches with controlled concurrency
  processBatch: async (items, processorFn, options = {}) => {
    const {
      batchSize = 10,
      maxConcurrency = 3,
      delayBetweenBatches = 100,
      retryFailures = true,
      maxRetries = 2
    } = options;
    
    const results = [];
    const failures = [];
    
    // Split items into batches
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    // Process batches with controlled concurrency
    const processBatchWithRetry = async (batch, retryCount = 0) => {
      try {
        const batchResults = await Promise.all(
          batch.map(item => processorFn(item))
        );
        return batchResults;
      } catch (error) {
        if (retryFailures && retryCount < maxRetries) {
          logger.warn(`Batch failed, retrying... (${retryCount + 1}/${maxRetries})`, { error: error.message });
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches * (retryCount + 1)));
          return await processBatchWithRetry(batch, retryCount + 1);
        }
        throw error;
      }
    };
    
    // Process all batches
    for (let i = 0; i < batches.length; i += maxConcurrency) {
      const concurrentBatches = batches.slice(i, i + maxConcurrency);
      
      try {
        const batchResults = await Promise.all(
          concurrentBatches.map(batch => processBatchWithRetry(batch))
        );
        
        // Flatten results
        batchResults.forEach(batchResult => {
          results.push(...batchResult);
        });
        
        // Add delay between batch groups
        if (i + maxConcurrency < batches.length && delayBetweenBatches > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      } catch (error) {
        logger.error(`Batch group failed:`, { error: error.message });
        failures.push({ batchIndex: i, error });
      }
    }
    
    return {
      success: failures.length === 0,
      results,
      failures,
      totalProcessed: results.length,
      totalFailed: failures.reduce((sum, failure) => sum + failure.batchSize || 0, 0)
    };
  }
};

// Export all performance utilities
export { memoize, measurePerformance, optimizeQuery } from './errorHandling.js';

export default {
  memoizedOperations,
  performanceMonitors,
  queryOptimizers,
  performanceMetrics,
  withPerformanceMonitoring,
  resourceMonitor,
  batchProcessor
};
