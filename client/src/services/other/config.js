/**
 * Config Service
 * 
 * PURPOSE:
 * Provides configuration and initialization for app services
 * Handles mock functions, app configuration, and service settings
 * 
 * ARCHITECTURE:
 * Frontend Components → Config Service → Backend Services
 */

import { info, error, warn, debug } from '../utils/logger.js';

const serviceName = 'configService';

// Functions instance cache (mock implementation)
let functionsInstance = null;
let appConfig = null;

/**
 * Initialize Functions (mock implementation)
 * @returns {Object} Functions instance
 */
export const getFunctions = () => {
  try {
    info(`${serviceName}:getFunctions`);

    if (functionsInstance) {
      debug(`${serviceName}:getFunctions:cached`);
      return functionsInstance;
    }

    // Mock Functions for development
    // In production, this would initialize actual backend functions
    functionsInstance = {
      httpsCallable: (functionName) => {
        return async (data) => {
          debug(`${serviceName}:httpsCallable`, { functionName, data });
          
          // Mock function calls for development
          switch (functionName) {
            case 'sendQRCodeEmail':
              return {
                data: {
                  success: true,
                  message: 'QR code email sent successfully',
                  emailId: `email_${Date.now()}`
                }
              };
              
            case 'sendSummaryEmail':
              return {
                data: {
                  success: true,
                  message: 'Summary email sent successfully',
                  emailId: `summary_${Date.now()}`
                }
              };
              
            case 'generateReport':
              return {
                data: {
                  success: true,
                  reportId: `report_${Date.now()}`,
                  downloadUrl: `#download/report_${Date.now()}`
                }
              };
              
            default:
              return {
                data: {
                  success: false,
                  error: `Unknown function: ${functionName}`
                }
              };
          }
        };
      }
    };

    debug(`${serviceName}:getFunctions:success`);
    return functionsInstance;

  } catch (error) {
    error(`${serviceName}:getFunctions:error`, { error: error.message });
    
    // Return mock functions even on error to prevent app crashes
    return {
      httpsCallable: (functionName) => {
        return async (data) => ({
          data: {
            success: false,
            error: 'Functions service unavailable'
          }
        });
      }
    };
  }
};

/**
 * Get application configuration
 * @returns {Object} App configuration object
 */
export const getAppConfig = () => {
  try {
    info(`${serviceName}:getAppConfig`);

    if (appConfig) {
      debug(`${serviceName}:getAppConfig:cached`);
      return appConfig;
    }

    // Default app configuration
    appConfig = {
      // Environment settings
      environment: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV !== 'production',
      
      // API endpoints
      apiBaseUrl: process.env.VITE_API_BASE_URL || '/api',
      wsUrl: process.env.VITE_WS_URL || 'ws://localhost:8001',
      
      // Feature flags
      features: {
        qrScanning: true,
        bulkAttendance: true,
        emailNotifications: true,
        realTimeUpdates: true,
        fileUpload: true,
        reports: true
      },
      
      // App settings
      settings: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['.csv', '.pdf', '.xlsx', '.json'],
        defaultPageSize: 10,
        maxPageSize: 100,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        refreshInterval: 30 * 1000 // 30 seconds
      },
      
      // UI settings
      ui: {
        theme: 'light',
        language: 'en',
        rtl: false,
        animations: true,
        compactMode: false
      },
      
      // Debug settings
      debug: {
        enableLogging: true,
        logLevel: 'info',
        enablePerformanceMonitoring: false
      }
    };

    debug(`${serviceName}:getAppConfig:success`, { 
      environment: appConfig.environment,
      features: Object.keys(appConfig.features).filter(f => appConfig.features[f])
    });

    return appConfig;

  } catch (error) {
    error(`${serviceName}:getAppConfig:error`, { error: error.message });
    
    // Return minimal config on error
    return {
      environment: 'development',
      isProduction: false,
      features: { qrScanning: true },
      settings: { maxFileSize: 1048576 },
    };
  }
};

/**
 * Get Firebase configuration
 * @returns {Object} Firebase configuration
 */
export const getFirebaseConfig = () => {
  try {
    info(`${serviceName}:getFirebaseConfig`);

    // Mock config for development
    // In production, this would come from environment variables or config files
    const config = {
      name: 'Military LMS',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:8001',
      enableDebugMode: process.env.NODE_ENV === 'development'
    };

    debug(`${serviceName}:getFirebaseConfig:success`, { 
      name: config.name,
      environment: config.environment 
    });

    return config;

  } catch (error) {
    error(`${serviceName}:getFirebaseConfig:error`, { error: error.message });
    
    // Return minimal config on error
    return {
      name: 'Military LMS',
      version: '1.0.0',
      environment: 'development',
      apiBaseUrl: 'http://localhost:8001',
      enableDebugMode: true
    };
  }
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} Whether the feature is enabled
 */
export const isFeatureEnabled = (featureName) => {
  try {
    const config = getAppConfig();
    const isEnabled = config.features?.[featureName] || false;
    
    debug(`${serviceName}:isFeatureEnabled`, { 
      featureName, 
      enabled: isEnabled 
    });

    return isEnabled;

  } catch (error) {
    error(`${serviceName}:isFeatureEnabled:error`, { 
      error: error.message, 
      featureName 
    });
    
    return false;
  }
};

/**
 * Get a setting value
 * @param {string} settingName - Name of the setting
 * @param {*} defaultValue - Default value if setting not found
 * @returns {*} Setting value
 */
export const getSetting = (settingName, defaultValue = null) => {
  try {
    const config = getAppConfig();
    const value = config.settings?.[settingName] ?? defaultValue;
    
    debug(`${serviceName}:getSetting`, { 
      settingName, 
      value,
      usedDefault: value === defaultValue 
    });

    return value;

  } catch (error) {
    error(`${serviceName}:getSetting:error`, { 
      error: error.message, 
      settingName 
    });
    
    return defaultValue;
  }
};

/**
 * Reload configuration from source
 * @returns {Object} Fresh configuration
 */
export const reloadConfig = () => {
  try {
    info(`${serviceName}:reloadConfig`);
    
    // Clear cached configuration
    functionsInstance = null;
    appConfig = null;
    
    // Get fresh configuration
    const freshConfig = getAppConfig();
    
    debug(`${serviceName}:reloadConfig:success`);
    
    return freshConfig;

  } catch (error) {
    error(`${serviceName}:reloadConfig:error`, { error: error.message });
    
    return getAppConfig();
  }
};

// Export all functions for easy importing
export default {
  getFunctions,
  getAppConfig,
  isFeatureEnabled,
  getSetting,
  reloadConfig
};
