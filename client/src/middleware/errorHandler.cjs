/**
 * Error Handler Middleware
 * 
 * PURPOSE:
 * Centralized error handling for all API routes
 * - Standardized error responses
 * - Error logging with stack traces
 * - Development vs Production error details
 * - Custom error classes
 * - Error recovery strategies
 * 
 * @module middleware/errorHandler
 */

const { logger, logSecurityEvent } = require('@services/utils/logger');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`External service error: ${service} - ${message}`, 503);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * Error handler middleware
 * Catches and processes all errors
 */
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const requestId = req.requestId || 'unknown';

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorType = err.name || 'Error';

  // Log error with full details
  logger.error('Error occurred', {
    service: 'ErrorHandler',
    requestId,
    method: req.method,
    url: req.url,
    statusCode,
    errorType,
    message: err.message,
    stack: err.stack,
    isOperational: err.isOperational,
    user: req.user?.id || 'anonymous',
    ip: req.ip || req.connection.remoteAddress
  });

  // Log security-related errors
  if (statusCode === 401 || statusCode === 403) {
    logSecurityEvent('authentication_error', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode,
      message,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: message,
    requestId,
    timestamp: new Date().toISOString()
  };

  // Add additional details in development mode
  if (isDevelopment) {
    errorResponse.details = {
      type: errorType,
      stack: err.stack,
      originalError: err.originalError?.message,
      validationErrors: err.details
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Handles routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Route');
  
  logger.warn('Route not found', {
    service: 'ErrorHandler',
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress
  });

  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 * Formats validation errors consistently
 */
const handleValidationError = (errors) => {
  const formattedErrors = {};
  
  if (Array.isArray(errors)) {
    errors.forEach(err => {
      formattedErrors[err.field || 'unknown'] = err.message;
    });
  } else if (typeof errors === 'object') {
    Object.keys(errors).forEach(key => {
      formattedErrors[key] = errors[key].message || errors[key];
    });
  }

  return new ValidationError('Validation failed', formattedErrors);
};

/**
 * Database error handler
 * Handles database-specific errors
 */
const handleDatabaseError = (error) => {
  logger.error('Database error', {
    service: 'ErrorHandler',
    error: error.message,
    stack: error.stack,
    code: error.code
  });

  // Handle specific database errors
  if (error.code === 'P2002') {
    return new ValidationError('Duplicate entry', {
      field: error.meta?.target?.[0] || 'unknown'
    });
  } else if (error.code === 'P2025') {
    return new NotFoundError('Record');
  } else if (error.code === 'P2003') {
    return new ValidationError('Foreign key constraint failed');
  }

  return new DatabaseError('Database operation failed', error);
};

/**
 * Unhandled rejection handler
 * Catches unhandled promise rejections
 */
const unhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      service: 'ErrorHandler',
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });

    // Exit process in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
};

/**
 * Uncaught exception handler
 * Catches uncaught exceptions
 */
const uncaughtExceptionHandler = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      service: 'ErrorHandler',
      error: error.message,
      stack: error.stack
    });

    // Exit process
    process.exit(1);
  });
};

/**
 * Initialize error handlers
 */
const initializeErrorHandlers = () => {
  unhandledRejectionHandler();
  uncaughtExceptionHandler();
  
  logger.info('Error handlers initialized', {
    service: 'ErrorHandler',
    environment: process.env.NODE_ENV
  });
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
  
  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Helpers
  handleValidationError,
  handleDatabaseError,
  initializeErrorHandlers
};
