/**
 * Logging Middleware
 * 
 * PURPOSE:
 * Centralized logging middleware with debug levels
 * - Request/Response logging
 * - Performance monitoring
 * - Debug levels (error, warn, info, debug, trace)
 * - Request tracing with unique IDs
 * - Structured logging for ELK
 * 
 * @module middleware/logging
 */

const { logger, generateRequestId } = require('@services/utils/logger');
const { performance } = require('perf_hooks');

/**
 * Log levels configuration
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

/**
 * Get current log level from environment
 */
const getCurrentLogLevel = () => {
  const level = process.env.LOG_LEVEL || 'info';
  return LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
};

/**
 * Check if log level is enabled
 */
const isLogLevelEnabled = (level) => {
  return LOG_LEVELS[level.toUpperCase()] <= getCurrentLogLevel();
};

/**
 * Request logging middleware
 * Logs all incoming requests with structured data
 */
const requestLogger = (req, res, next) => {
  const requestId = generateRequestId();
  const startTime = performance.now();

  // Attach request ID to request object
  req.requestId = requestId;
  req.startTime = startTime;

  // Log request start
  if (isLogLevelEnabled('INFO')) {
    logger.info('Request started', {
      service: 'RequestLogger',
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });
  }

  // Log request body in debug mode
  if (isLogLevelEnabled('DEBUG') && req.body && Object.keys(req.body).length > 0) {
    logger.debug('Request body', {
      service: 'RequestLogger',
      requestId,
      body: req.body
    });
  }

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    // Log response
    if (isLogLevelEnabled('INFO')) {
      logger.info('Request completed', {
        service: 'RequestLogger',
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: data?.length || 0
      });
    }

    // Log response body in trace mode
    if (isLogLevelEnabled('TRACE')) {
      logger.debug('Response body', {
        service: 'RequestLogger',
        requestId,
        statusCode: res.statusCode,
        body: typeof data === 'string' ? data.substring(0, 500) : data
      });
    }

    // Log slow requests
    if (parseFloat(duration) > 1000) {
      logger.warn('Slow request detected', {
        service: 'RequestLogger',
        requestId,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        threshold: '1000ms'
      });
    }

    res.send = originalSend;
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Performance monitoring middleware
 * Tracks and logs performance metrics
 */
const performanceMonitor = (req, res, next) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = (endTime - startTime).toFixed(2);

    const metrics = {
      service: 'PerformanceMonitor',
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memory: {
        heapUsed: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(endMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(endMemory.rss / 1024 / 1024).toFixed(2)}MB`
      }
    };

    if (isLogLevelEnabled('DEBUG')) {
      logger.debug('Performance metrics', metrics);
    }

    // Alert on high memory usage
    if (endMemory.heapUsed > 500 * 1024 * 1024) { // 500MB
      logger.warn('High memory usage detected', {
        ...metrics,
        threshold: '500MB'
      });
    }
  });

  next();
};

/**
 * Error logging middleware
 * Logs all errors with stack traces
 */
const errorLogger = (err, req, res, next) => {
  const duration = req.startTime 
    ? `${(performance.now() - req.startTime).toFixed(2)}ms`
    : 'unknown';

  logger.error('Request error', {
    service: 'ErrorLogger',
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    duration
  });

  // Log error details in debug mode
  if (isLogLevelEnabled('DEBUG')) {
    logger.debug('Error details', {
      service: 'ErrorLogger',
      requestId: req.requestId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode
      }
    });
  }

  next(err);
};

/**
 * Debug middleware
 * Logs detailed information in development mode
 */
const debugLogger = (req, res, next) => {
  if (!isLogLevelEnabled('DEBUG')) {
    return next();
  }

  logger.debug('Request debug info', {
    service: 'DebugLogger',
    requestId: req.requestId,
    headers: req.headers,
    params: req.params,
    query: req.query,
    body: req.body,
    cookies: req.cookies,
    session: req.session,
    user: req.user
  });

  next();
};

/**
 * Database query logger
 * Logs database queries and performance
 */
const dbQueryLogger = (query, duration, result) => {
  if (!isLogLevelEnabled('DEBUG')) {
    return;
  }

  logger.debug('Database query', {
    service: 'DatabaseLogger',
    query: typeof query === 'string' ? query : JSON.stringify(query),
    duration: `${duration}ms`,
    resultCount: Array.isArray(result) ? result.length : 1,
    success: !!result
  });

  // Log slow queries
  if (duration > 100) {
    logger.warn('Slow database query', {
      service: 'DatabaseLogger',
      query: typeof query === 'string' ? query : JSON.stringify(query),
      duration: `${duration}ms`,
      threshold: '100ms'
    });
  }
};

/**
 * API endpoint logger
 * Logs API endpoint access patterns
 */
const apiEndpointLogger = (req, res, next) => {
  if (!isLogLevelEnabled('INFO')) {
    return next();
  }

  logger.info('API endpoint accessed', {
    service: 'APILogger',
    requestId: req.requestId,
    endpoint: req.path,
    method: req.method,
    version: req.baseUrl || 'v1',
    authenticated: !!req.user,
    userId: req.user?.id || 'anonymous'
  });

  next();
};

/**
 * Trace logger for detailed debugging
 * Only active when LOG_LEVEL=trace
 */
const traceLogger = (message, data = {}) => {
  if (!isLogLevelEnabled('TRACE')) {
    return;
  }

  logger.debug(`[TRACE] ${message}`, {
    service: 'TraceLogger',
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log level helper functions
 */
const logError = (message, data = {}) => {
  logger.error(message, { service: 'Application', ...data });
};

const logWarn = (message, data = {}) => {
  if (isLogLevelEnabled('WARN')) {
    logger.warn(message, { service: 'Application', ...data });
  }
};

const logInfo = (message, data = {}) => {
  if (isLogLevelEnabled('INFO')) {
    logger.info(message, { service: 'Application', ...data });
  }
};

const logDebug = (message, data = {}) => {
  if (isLogLevelEnabled('DEBUG')) {
    logger.debug(message, { service: 'Application', ...data });
  }
};

module.exports = {
  requestLogger,
  performanceMonitor,
  errorLogger,
  debugLogger,
  dbQueryLogger,
  apiEndpointLogger,
  traceLogger,
  logError,
  logWarn,
  logInfo,
  logDebug,
  isLogLevelEnabled,
  LOG_LEVELS
};
