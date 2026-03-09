/**
 * Centralized Logger Service
 * Sends logs to ELK Stack (Elasticsearch, Logstash, Kibana)
 * 
 * FEATURES:
 * - Structured logging with metadata
 * - Multiple log levels (error, warn, info, debug)
 * - ELK Stack integration
 * - Performance timing
 * - Request tracing
 */

const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Log levels configuration
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: customFormat,
  defaultMeta: {
    service: 'MilitaryLMS',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json()
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json()
    }),
    
    // Elasticsearch transport for ELK Stack
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: 'http://localhost:9200',
        auth: null // No auth for development
      },
      index: 'military-lms-logs',
      transformer: (logData) => {
        return {
          '@timestamp': logData.timestamp,
          level: logData.level,
          message: logData.message,
          fields: {
            service: logData.service,
            environment: logData.environment,
            version: logData.version,
            ...logData.meta
          }
        };
      }
    })
  ],
  
  // Exception handling
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  
  // Rejection handling
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Performance timing helper
const startTimer = (operation) => {
  const startTime = Date.now();
  return () => {
    const duration = Date.now() - startTime;
    logger.info(`Operation completed`, {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    return duration;
  };
};

// Request logging helper
const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    requestId: req.id || generateRequestId()
  });
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.id || generateRequestId()
    });
  });
  
  next();
};

// Generate unique request ID
const generateRequestId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Database operation logger
const logDbOperation = (operation, collection, query, result, duration) => {
  logger.info('Database operation', {
    operation,
    collection,
    query: JSON.stringify(query),
    resultCount: Array.isArray(result) ? result.length : 1,
    success: !!result,
    duration: `${duration}ms`
  });
};

// Error logging helper
const logError = (error, context = {}) => {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

// Security event logger
const logSecurityEvent = (event, details) => {
  logger.warn('Security event', {
    event,
    ...details,
    severity: 'high'
  });
};

module.exports = {
  logger,
  startTimer,
  logRequest,
  logDbOperation,
  logError,
  logSecurityEvent,
  generateRequestId
};
