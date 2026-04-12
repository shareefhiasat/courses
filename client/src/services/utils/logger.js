/**
 * Unified Logger System - Frontend
 * 
 * PURPOSE:
 * Centralized logging for frontend with ELK support and console output
 * Configurable for development vs production environments
 * 
 * ENVIRONMENT VARIABLES:
 * - VITE_LOG_LEVEL: debug|info|warn|error (default: info)
 * - VITE_ELK_ENABLED: true|false (default: false)
 * - VITE_ELK_URL: ELK endpoint URL
 * - NODE_ENV: development|production
 */

const isDevelopment = import.meta?.env?.DEV || process.env.NODE_ENV === 'development';
const logLevel = import.meta.env?.VITE_LOG_LEVEL || (isDevelopment ? 'warn' : 'info');
const elkEnabled = import.meta.env?.VITE_ELK_ENABLED === 'true';
const elkUrl = import.meta.env?.VITE_ELK_URL;

// Log levels hierarchy
const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Check if log level should be displayed
const shouldLog = (level) => {
  return levels[level] >= levels[logLevel];
};

// Send to ELK (if enabled)
const sendToElk = async (logEntry) => {
  if (!elkEnabled || !elkUrl) return;
  
  try {
    await fetch(elkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logEntry)
    });
  } catch (error) {
    // Silently fail ELK logging to avoid infinite loops
    console.warn('Failed to send log to ELK:', error.message);
  }
};

const log = (level, message, meta = {}) => {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    environment: import.meta.env?.MODE || 'development',
    source: 'frontend',
    ...meta
  };

  // Console output with colors for development
  if (isDevelopment) {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m'  // White
    };
    
    const reset = '\x1b[0m';
    const color = colors[level.toUpperCase()] || '';
    
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`, meta);
  } else {
    // Production logging (clean)
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);
  }

  // Send to ELK (async, non-blocking)
  sendToElk(logEntry);
};

// Logger functions (all enabled now)
const info = (message, meta = {}) => {
  log('info', message, meta);
};

const error = (message, meta = {}) => {
  log('error', message, meta);
};

const warn = (message, meta = {}) => {
  log('warn', message, meta);
};

const debug = (message, meta = {}) => {
  log('debug', message, meta);
};

// Service-specific logger creator
const createServiceLogger = (serviceName) => {
  return {
    debug: (message, meta = {}) => debug(message, { service: serviceName, ...meta }),
    info: (message, meta = {}) => info(message, { service: serviceName, ...meta }),
    warn: (message, meta = {}) => warn(message, { service: serviceName, ...meta }),
    error: (message, meta = {}) => error(message, { service: serviceName, ...meta })
  };
};

// ES6 exports
export { info, error, warn, debug, log, createServiceLogger };

// ES6 default export
export default {
  info,
  error,
  warn,
  debug,
  log,
  createServiceLogger
};

// CommonJS exports for services
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    info,
    error,
    warn,
    debug,
    log,
    createServiceLogger
  };
}
