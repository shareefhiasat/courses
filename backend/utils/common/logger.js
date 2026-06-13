/**
 * Unified Logger System - Backend
 * 
 * PURPOSE:
 * Centralized logging for backend with ELK support and console output
 * Configurable for development vs production environments
 * 
 * ENVIRONMENT VARIABLES:
 * - LOG_LEVEL: debug|info|warn|error (default: info)
 * - ELK_ENABLED: true|false (default: false)
 * - ELK_URL: ELK endpoint URL
 * - NODE_ENV: development|production
 */

import winston from 'winston';

// Configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
const elkEnabled = process.env.ELK_ENABLED === 'true';
const elkUrl = process.env.ELK_URL;

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const serviceTag = service ? `[${service}] ` : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${serviceTag}${message} ${metaStr}`;
  })
);

// ELK format (JSON)
const elkFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transports
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    level: logLevel,
    format: consoleFormat
  })
);

// ELK transport (if enabled)
if (elkEnabled && elkUrl) {
  // Note: You'll need to install winston-elasticsearch
  // npm install winston-elasticsearch
  try {
    const { ElasticsearchTransport } = await import('winston-elasticsearch');
    
    transports.push(
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: elkUrl
        },
        index: 'lms-logs',
        format: elkFormat
      })
    );
  } catch (error) {
    console.warn('ELK transport not available, install winston-elasticsearch:', error.message);
  }
}

// Create logger
const winstonLogger = winston.createLogger({
  level: logLevel,
  transports,
  exitOnError: false
});

// Service-specific loggers
export const createServiceLogger = (serviceName) => {
  return {
    debug: (message, meta = {}) => winstonLogger.debug(message, { service: serviceName, ...meta }),
    info: (message, meta = {}) => winstonLogger.info(message, { service: serviceName, ...meta }),
    warn: (message, meta = {}) => winstonLogger.warn(message, { service: serviceName, ...meta }),
    error: (message, meta = {}) => winstonLogger.error(message, { service: serviceName, ...meta })
  };
};

// Default logger with no service tag
const defaultLogger = {
  debug: (message, meta = {}) => winstonLogger.debug(message, meta),
  info: (message, meta = {}) => winstonLogger.info(message, meta),
  warn: (message, meta = {}) => winstonLogger.warn(message, meta),
  error: (message, meta = {}) => winstonLogger.error(message, meta)
};

// Export default logger functions
export const logger = defaultLogger;
export const debug = defaultLogger.debug;
export const info = defaultLogger.info;
export const warn = defaultLogger.warn;
export const error = defaultLogger.error;
