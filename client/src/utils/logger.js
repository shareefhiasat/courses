/**
 * Production-safe logger utility
 * Replaces console statements with environment-aware logging
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      log: 4
    };
    
    // Set log level based on environment
    this.currentLevel = isDevelopment ? 4 : 1; // Only error and warn in production
  }

  shouldLog(level) {
    return this.levels[level] <= this.currentLevel;
  }

  formatMessage(level, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
    return [prefix, ...args];
  }

  error(...args) {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', ...args));
    }
  }

  warn(...args) {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', ...args));
    }
  }

  debug(...args) {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', ...args));
    }
  }

  log(...args) {
    if (this.shouldLog('log')) {
      console.log(...this.formatMessage('log', ...args));
    }
  }

  // Performance logging
  time(label) {
    if (isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Component lifecycle logging (dev only)
  componentMount(componentName) {
    if (isDevelopment) {
      console.log(`🟢 ${componentName} mounted`);
    }
  }

  componentUnmount(componentName) {
    if (isDevelopment) {
      console.log(`🔴 ${componentName} unmounted`);
    }
  }

  // Firebase operation logging
  firebaseOperation(operation, success = true, error = null) {
    if (isDevelopment) {
      const status = success ? '✅' : '❌';
      console.log(`${status} Firebase ${operation}`, error || '');
    }
  }

  // Network request logging
  networkRequest(url, method, status) {
    if (isDevelopment) {
      const emoji = status >= 200 && status < 300 ? '🌐' : '⚠️';
      console.log(`${emoji} ${method} ${url} - ${status}`);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
