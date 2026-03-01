/**
 * Production-Ready Logger Utility
 * 
 * PURPOSE:
 * Centralized logging system that replaces console statements with
 * environment-aware logging, external service integration, and performance
 * monitoring capabilities.
 * 
 * USAGE:
 * Import this logger throughout the application instead of console.* methods.
 * Configured automatically through environment variables.
 * 
 * FEATURES:
 * - Environment-aware log levels (dev vs production)
 * - Loggly integration for centralized log aggregation
 * - Sentry integration for error tracking and performance monitoring
 * - Performance timing and transaction tracking
 * - Firebase operation logging
 * - Component lifecycle tracking
 * 
 * CONFIGURATION:
 * ```bash
 * # Loggly Configuration
 * VITE_LOGGLY_TOKEN=your-loggly-token
 * VITE_LOGGLY_TAGS=frontend,production
 * 
 * # Sentry Configuration
 * VITE_SENTRY_DSN=your-sentry-dsn
 * VITE_SENTRY_ENVIRONMENT=production
 * VITE_SENTRY_RELEASE=v1.0.0
 * VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
 * ```
 * 
 * EXAMPLES:
 * ```javascript
 * import logger from '@utils/logger';
 * 
 * // Basic logging
 * logger.info('User logged in', { userId: '123' });
 * logger.error('API call failed', error);
 * 
 * // Performance tracking
 * logger.time('api-call');
 * // ... do something
 * logger.timeEnd('api-call');
 * 
 * // Sentry integration
 * logger.setUser({ id: '123', email: 'user@example.com' });
 * logger.setTag('page', 'dashboard');
 * 
 * // Component lifecycle
 * logger.componentMount('UserProfile');
 * logger.componentUnmount('UserProfile');
 * ```
 * 
 * LOG LEVELS:
 * - Development: error, warn, info, log (no debug)
 * - Production: error, warn only
 * 
 * @author Utils Team
 * @since v2.0.0
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
    
    // Set log level based on environment - REDUCED DEBUG
    this.currentLevel = isDevelopment ? 2 : 1; // Only error, warn, and info in dev (no debug)
    
    // Loggly configuration
    this.logglyConfig = null;
    
    // Sentry configuration
    this.sentryConfig = null;
    this.sentryInitialized = false;
    
    // Store original console methods to avoid infinite loop
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
      info: console.info
    };
  }

  async importSentry() {
    try {
      const importer = new Function("return import('@sentry/browser')");
      return await importer();
    } catch {
      return null;
    }
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
      // Send to Sentry if configured
      this.sendToSentry('error', ...args);
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
    // Removed DEV-LOG to reduce console noise
    // if (isDevelopment) {
    //   this.originalConsole.log('🔧 [DEV-LOG]', ...args);
    // }
  }

  // Performance logging
  time(label) {
    if (isDevelopment && typeof this.originalConsole.time === 'function') {
      this.originalConsole.time(label);
    }
  }

  timeEnd(label) {
    if (isDevelopment && typeof this.originalConsole.timeEnd === 'function') {
      this.originalConsole.timeEnd(label);
    }
  }

  // Component lifecycle logging (dev only)
  componentMount(componentName) {
    if (isDevelopment && componentName !== 'ChatPage') {
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
      const status = success ? '✔️' : '❌';
      this.originalConsole.log(`${status} Firebase ${operation}`, error || '');
    }
  }

  // Network request logging
  networkRequest(url, method, status) {
    if (isDevelopment) {
      const emoji = status >= 200 && status < 300 ? '👍' : '🚨';
      this.originalConsole.log(`${emoji} ${method} ${url} - ${status}`);
    }
  }

  // Loggly configuration
  configureLoggly(config) {
    this.logglyConfig = config;
  }

  // Sentry configuration
  configureSentry(config) {
    this.sentryConfig = config;
    if (config && config.dsn && !this.sentryInitialized) {
      this.initializeSentry();
    }
  }

  // Initialize Sentry
  async initializeSentry() {
    if (this.sentryInitialized || !this.sentryConfig?.dsn) {
      return;
    }

    try {
      // Dynamically import Sentry to avoid bundle issues if not used
      const Sentry = await this.importSentry();
      
      if (!Sentry) {
        return; // Skip if Sentry not available
      }
      
      Sentry.init({
        dsn: this.sentryConfig.dsn,
        environment: this.sentryConfig.environment || (isProduction ? 'production' : 'development'),
        release: this.sentryConfig.release,
        tracesSampleRate: this.sentryConfig.tracesSampleRate || 0.1,
        beforeSend: (event) => {
          // Filter out certain errors if needed
          if (this.sentryConfig.beforeSend) {
            return this.sentryConfig.beforeSend(event);
          }
          return event;
        }
      });

      this.sentryInitialized = true;
      
      if (isDevelopment) {
        this.originalConsole.log('✅ Sentry initialized successfully');
      }
    } catch (error) {
      this.originalConsole.warn('❌ Failed to initialize Sentry:', error);
    }
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

  // Send to Sentry
  async sendToSentry(level, ...args) {
    if (!this.sentryInitialized || !this.sentryConfig?.dsn) {
      return; // Skip if Sentry not configured or not initialized
    }

    try {
      const Sentry = await this.importSentry();
      
      if (!Sentry) {
        return; // Skip if Sentry not available
      }
      
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      const extra = {
        level: level.toUpperCase(),
        timestamp: new Date().toISOString(),
        arguments: args
      };

      if (level === 'error') {
        // Check if first argument is an Error object
        const error = args.find(arg => arg instanceof Error);
        if (error) {
          Sentry.captureException(error, { extra });
        } else {
          Sentry.captureMessage(message, 'error', { extra });
        }
      } else if (level === 'warn') {
        Sentry.captureMessage(message, 'warning', { extra });
      }
    } catch (error) {
      // Silently fail Sentry errors to not break the app
      if (isDevelopment) {
        this.originalConsole.warn('Sentry error:', error);
      }
    }
  }

  // Additional Sentry methods for convenience
  setUser(user) {
    if (this.sentryInitialized) {
      this.importSentry().then(Sentry => {
        if (Sentry) {
          Sentry.setUser(user);
        }
      });
    }
  }

  setTag(key, value) {
    if (this.sentryInitialized) {
      this.importSentry().then(Sentry => {
        if (Sentry) {
          Sentry.setTag(key, value);
        }
      });
    }
  }

  addBreadcrumb(breadcrumb) {
    if (this.sentryInitialized) {
      this.importSentry().then(Sentry => {
        if (Sentry) {
          Sentry.addBreadcrumb(breadcrumb);
        }
      });
    }
  }

  // Performance monitoring with Sentry
  startTransaction(name, operation = 'navigation') {
    if (this.sentryInitialized) {
      return this.importSentry().then(Sentry => {
        if (Sentry) {
          return Sentry.startTransaction({
            name,
            operation
          });
        }
        return null;
      });
    }
    return Promise.resolve(null);
  }
}

// Create singleton instance
const logger = new Logger();

// Auto-configure from environment variables if available
if (import.meta.env.VITE_LOGGLY_TOKEN) {
  logger.configureLoggly({
    token: import.meta.env.VITE_LOGGLY_TOKEN,
    tags: import.meta.env.VITE_LOGGLY_TAGS?.split(',') || []
  });
}

if (import.meta.env.VITE_SENTRY_DSN) {
  logger.configureSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || (isProduction ? 'production' : 'development'),
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) || 0.1
  });
}

export default logger;
