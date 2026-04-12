/**
 * Standardized Error Handling for LMS Services
 * Provides consistent error categorization, formatting, and logging
 */

import { info, error, warn, debug } from '@services/utils/logger.js';

// Error categories for better error handling and user experience
export const ERROR_CATEGORIES = {
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION', 
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK: 'NETWORK',
  DATABASE: 'DATABASE',
  BUSINESS_LOGIC: 'BUSINESS_LOGIC',
  INTERNAL: 'INTERNAL',
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM', 
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Standard error response format
export const createErrorResponse = (category, message, severity = ERROR_SEVERITY.MEDIUM, details = null, code = null) => {
  return {
    success: false,
    error: {
      category,
      message,
      severity,
      details,
      code,
      timestamp: new Date().toISOString()
    }
  };
};

// Error classification helper
export const classifyError = (error) => {
  const message = error.message || error.toString();
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return ERROR_CATEGORIES.NETWORK;
  }
  
  // Authentication errors
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('login')) {
    return ERROR_CATEGORIES.AUTHENTICATION;
  }
  
  // Authorization errors
  if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
    return ERROR_CATEGORIES.AUTHORIZATION;
  }
  
  // Not found errors
  if (message.includes('not found') || message.includes('does not exist') || message.includes('404')) {
    return ERROR_CATEGORIES.NOT_FOUND;
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  
  // Database errors
  if (message.includes('database') || message.includes('firestore') || message.includes('query')) {
    return ERROR_CATEGORIES.DATABASE;
  }
  
  // Rate limit errors
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return ERROR_CATEGORIES.RATE_LIMIT;
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR_CATEGORIES.TIMEOUT;
  }
  
  // Default to internal error
  return ERROR_CATEGORIES.INTERNAL;
};

// Standardized error handler for services
export const handleServiceError = (error, context = {}) => {
  const category = classifyError(error);
  const severity = getErrorSeverity(category, error);
  
  const errorResponse = createErrorResponse(
    category,
    error.message || 'An unexpected error occurred',
    severity,
    context,
    error.code
  );
  
  return errorResponse;
};

// Determine error severity based on category and error details
const getErrorSeverity = (category, error) => {
  switch (category) {
    case ERROR_CATEGORIES.VALIDATION:
      return ERROR_SEVERITY.LOW;
    case ERROR_CATEGORIES.NOT_FOUND:
      return ERROR_SEVERITY.LOW;
    case ERROR_CATEGORIES.AUTHENTICATION:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_CATEGORIES.AUTHORIZATION:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_CATEGORIES.NETWORK:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_CATEGORIES.DATABASE:
      return ERROR_SEVERITY.HIGH;
    case ERROR_CATEGORIES.RATE_LIMIT:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_CATEGORIES.TIMEOUT:
      return ERROR_SEVERITY.HIGH;
    case ERROR_CATEGORIES.BUSINESS_LOGIC:
      return ERROR_SEVERITY.MEDIUM;
    case ERROR_CATEGORIES.INTERNAL:
    default:
      return ERROR_SEVERITY.CRITICAL;
  }
};

// Retry decorator factory with exponential backoff
// Returns a wrapped async function that retries on network/database failures
export const withRetry = (fn, maxRetries = 3, baseDelay = 1000, context = {}) => {
  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        const category = classifyError(error);
        
        // Don't retry on validation or authorization errors
        if (category === ERROR_CATEGORIES.VALIDATION || 
            category === ERROR_CATEGORIES.AUTHORIZATION ||
            category === ERROR_CATEGORIES.NOT_FOUND) {
          throw error;
        }
        
        // If it's the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        
        info(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`, {
          category,
          message: error.message,
          context
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
};

// Performance monitoring helper
export const measurePerformance = (fn, operationName) => {
  return async (...args) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 1000) {
        warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      error(`Failed operation: ${operationName} failed after ${duration.toFixed(2)}ms`, { error: error.message });
      
      throw error;
    }
  };
};

// Memoization helper for expensive operations
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Set cache expiration after 5 minutes
    setTimeout(() => {
      cache.delete(key);
    }, 5 * 60 * 1000);
    
    return result;
  };
};

// Batch operation helper
export const batchOperation = async (items, operationFn, batchSize = 10, delayBetweenBatches = 100) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.all(
        batch.map(item => operationFn(item))
      );
      results.push(...batchResults);
      
      // Add delay between batches to avoid overwhelming the database
      if (i + batchSize < items.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    } catch (error) {
      error(`Batch operation failed at batch ${Math.floor(i / batchSize) + 1}:`, { error: error.message });
      throw error;
    }
  }
  
  return results;
};

// Query optimization helper
export const optimizeQuery = (queryFn) => {
  return measurePerformance(
    memoize(queryFn),
    'database_query'
  );
};
