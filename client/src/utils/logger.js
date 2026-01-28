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
    
    // Loggly configuration
    this.logglyConfig = null;
    
    // Store original console methods to avoid infinite loop
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
      info: console.info
    };
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
      this.originalConsole.error(...this.formatMessage('error', ...args));
      // Send to Loggly if configured
      this.sendToLoggly('error', ...args);
    }
  }

  warn(...args) {
    if (this.shouldLog('warn')) {
      this.originalConsole.warn(...this.formatMessage('warn', ...args));
      // Send to Loggly if configured
      this.sendToLoggly('warn', ...args);
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      this.originalConsole.info(...this.formatMessage('info', ...args));
      // Send to Loggly if configured
      this.sendToLoggly('info', ...args);
    }
  }

  debug(...args) {
    if (this.shouldLog('debug')) {
      this.originalConsole.debug(...this.formatMessage('debug', ...args));
    }
  }

  log(...args) {
    if (this.shouldLog('log')) {
      this.originalConsole.log(...this.formatMessage('log', ...args));
    }
  }

  // Performance logging
  time(label) {
    if (isDevelopment) {
      this.originalConsole.time(label);
    }
  }

  timeEnd(label) {
    if (isDevelopment) {
      this.originalConsole.timeEnd(label);
    }
  }

  // Component lifecycle logging (dev only)
  componentMount(componentName) {
    if (isDevelopment) {
      this.originalConsole.log(`🟢 ${componentName} mounted`);
    }
  }

  componentUnmount(componentName) {
    if (isDevelopment) {
      this.originalConsole.log(`🔴 ${componentName} unmounted`);
    }
  }

  // Firebase operation logging
  firebaseOperation(operation, success = true, error = null) {
    if (isDevelopment) {
      const status = success ? '✅' : '❌';
      this.originalConsole.log(`${status} Firebase ${operation}`, error || '');
    }
  }

  // Network request logging
  networkRequest(url, method, status) {
    if (isDevelopment) {
      const emoji = status >= 200 && status < 300 ? '🌐' : '⚠️';
      this.originalConsole.log(`${emoji} ${method} ${url} - ${status}`);
    }
  }

  // Loggly configuration
  configureLoggly(config) {
    this.logglyConfig = config;
  }

  // Send to Loggly
  sendToLoggly(level, ...args) {
    if (!this.logglyConfig || !this.logglyConfig.token) {
      return; // Skip if Loggly not configured
    }

    try {
      const logData = {
        level: level.toUpperCase(),
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        timestamp: new Date().toISOString(),
        tags: this.logglyConfig.tags || []
      };

      // Send to Loggly
      const url = `https://logs-01.loggly.com/inputs/${this.logglyConfig.token}/tag/${encodeURIComponent(logData.tags.join(','))}`;
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      }).catch(error => {
        // Silently fail Loggly errors to not break the app
        if (isDevelopment) {
          this.originalConsole.warn('Failed to send to Loggly:', error);
        }
      });
    } catch (error) {
      // Silently fail Loggly errors to not break the app
      if (isDevelopment) {
        this.originalConsole.warn('Loggly error:', error);
      }
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
