/**
 * Unified Application Configuration
 * 
 * PURPOSE: Single source of truth for all application configuration
 * ARCHITECTURE: Singleton pattern with environment-specific settings
 */

class AppConfig {
  constructor() {
    // Handle both browser and Node.js environments
    const isBrowser = typeof window !== 'undefined' && typeof import.meta !== 'undefined';
    
    // API Configuration
    this.api = {
      BASE_URL: isBrowser ? (import.meta.env.VITE_API_BASE_URL || '/api') : '/api',
      VERSION: isBrowser ? (import.meta.env.VITE_API_VERSION || 'v1') : 'v1',
      TIMEOUT: 30000,
      ENDPOINTS: {
        PROGRAMS: '/programs',
        SUBJECTS: '/subjects',
        CLASSES: '/classes',
        USERS: '/users',
        ENROLLMENTS: '/enrollments',
        SUBJECT_TYPES: '/subject-types',
        REQUIREMENT_TYPES: '/requirement-types',
        RESOURCES: '/resources',
        ANNOUNCEMENTS: '/announcements',
        ACTIVITIES: '/activities'
      },
      DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // Database Configuration
    this.database = {
      URL: isBrowser ? (import.meta.env.VITE_DATABASE_URL || 'postgresql://military_lms:military_lms123@localhost:5432/military_lms') : 'postgresql://military_lms:military_lms123@localhost:5432/military_lms',
      POOL_SIZE: 10,
      TIMEOUT: 30000
    };
    
    // Keycloak Configuration
    this.keycloak = {
      URL: isBrowser ? (import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080') : 'http://localhost:8080',
      REALM: isBrowser ? (import.meta.env.VITE_KEYCLOAK_REALM || 'military-lms') : 'military-lms',
      CLIENT_ID: isBrowser ? (import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'military-lms-app') : 'military-lms-app',
      REDIRECT_URI: isBrowser ? (import.meta.env.VITE_KEYCLOAK_REDIRECT_URI || 'https://localhost:5174') : 'https://localhost:5174'
    };
    
    // Local Storage Keys
    this.storage = {
      AUTH_TOKEN: 'auth_token',
      USER_PREFERENCES: 'user_preferences',
      DASHBOARD_CONFIG: 'dashboard_config',
      THEME: 'theme',
      LANGUAGE: 'language',
      KEYCLOAK_TOKEN: 'keycloak_token'
    };
    
    // Application Settings
    this.app = {
      NAME: 'Military LMS',
      VERSION: '2.0.0',
      DESCRIPTION: 'Military Learning Management System - PostgreSQL Edition',
      SUPPORT_EMAIL: 'shareef.hiasat@gmail.com',
      DATABASE_TYPE: 'postgresql',
      ORM: 'prisma'
    };
    
    // Feature Flags
    this.features = {
      KEYCLOAK_AUTH: true,
      PRISMA_OPTIMIZER: true,
      OFFLINE_MODE: false,
      ANALYTICS: false,
      DEBUG_MODE: isBrowser ? import.meta.env.DEV : false,
      SOFT_DELETE: true,
      AUDIT_TRAILS: true
    };
    
    // Pagination Defaults
    this.pagination = {
      DEFAULT_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100,
      DEFAULT_PAGE: 1
    };
    
    // Role-based Access
    this.roles = {
      SUPER_ADMIN: 'super_admin',
      ADMIN: 'admin',
      INSTRUCTOR: 'instructor',
      STUDENT: 'student',
      HR: 'hr',
      STAFF: 'staff',
      PARENT: 'parent',
      GUEST: 'guest'
    };
    
    // Error Messages (user-friendly)
    this.errorMessages = {
      400: 'Invalid request. Please check your input.',
      401: 'Session expired. Please login again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'This resource already exists or conflicts with existing data.',
      422: 'Validation error. Please check your input.',
      429: 'Too many requests. Please wait and try again.',
      500: 'Server error. Please try again later.',
      502: 'Service unavailable. Please try again later.',
      503: 'Service temporarily unavailable. Please try again later.',
      NETWORK_ERROR: 'Network error. Please check your connection.',
      UNKNOWN: 'An unexpected error occurred. Please try again.'
    };
    
    /**
     * Get user-friendly error message for HTTP status code
     * @param {number} status - HTTP status code
     * @returns {string} User-friendly error message
     */
    this.getErrorMessage = (status) => {
      return this.errorMessages[status] || this.errorMessages.UNKNOWN;
    };
    
    // Cache for frequently used URLs
    this.urlCache = new Map();
    
    // Freeze all configuration objects to prevent modifications
    Object.freeze(this.api);
    Object.freeze(this.api.DEFAULT_HEADERS);
    Object.freeze(this.database);
    Object.freeze(this.keycloak);
    Object.freeze(this.storage);
    Object.freeze(this.app);
    Object.freeze(this.features);
    Object.freeze(this.pagination);
    Object.freeze(this.roles);
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance() {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }
  
  // API Configuration Methods
  getApiBaseUrl() {
    return this.api.BASE_URL;
  }
  
  getApiVersion() {
    return this.api.VERSION;
  }
  
  getApiTimeout() {
    return this.api.TIMEOUT;
  }
  
  getApiHeaders() {
    return { ...this.api.DEFAULT_HEADERS };
  }
  
  /**
   * Build full API URL for a given endpoint
   */
  buildApiUrl(endpoint, params = {}) {
    // Validate endpoint - prevent undefined/null errors
    if (!endpoint || typeof endpoint !== 'string') {
      console.error('[AppConfig] Invalid endpoint provided:', endpoint);
      return `${this.api.BASE_URL}/api/${this.api.VERSION}`;
    }
    
    // Create cache key
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    
    // Return cached URL if available
    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey);
    }
    
    // Build URL - check if base URL already includes version
    const baseUrl = this.api.BASE_URL.includes('/v1') 
      ? this.api.BASE_URL 
      : `${this.api.BASE_URL}/${this.api.VERSION}`;
    const fullUrl = endpoint.startsWith('/')
      ? `${baseUrl}${endpoint}`
      : `${baseUrl}/${endpoint}`;
    
    // Add query parameters
    const queryString = new URLSearchParams(params).toString();
    const finalUrl = queryString ? `${fullUrl}?${queryString}` : fullUrl;
    
    // Cache the URL (limit cache size)
    if (this.urlCache.size > 100) {
      const firstKey = this.urlCache.keys().next().value;
      this.urlCache.delete(firstKey);
    }
    this.urlCache.set(cacheKey, finalUrl);
    
    return finalUrl;
  }
  
  /**
   * Create fetch options with default settings
   */
  createFetchOptions(options = {}) {
    // Add authorization header if token is available
    const token = typeof window !== 'undefined' ? localStorage.getItem('keycloak_token') : null;
    const headers = {
      ...this.api.DEFAULT_HEADERS,
      ...(options.headers || {})
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return {
      headers,
      signal: AbortSignal.timeout(this.api.TIMEOUT),
      ...options
    };
  }
  
  // Configuration Access Methods
  getDatabaseConfig() {
    return this.database;
  }
  
  getKeycloakConfig() {
    return this.keycloak;
  }
  
  getStorageKeys() {
    return this.storage;
  }
  
  getAppConfig() {
    return this.app;
  }
  
  getFeatures() {
    return this.features;
  }
  
  getPaginationConfig() {
    return this.pagination;
  }
  
  getRoles() {
    return this.roles;
  }
  
  /**
   * Get full configuration for debugging
   */
  getConfig() {
    return {
      api: {
        BASE_URL: this.api.BASE_URL,
        VERSION: this.api.VERSION,
        TIMEOUT: this.api.TIMEOUT,
        URL_CACHE_SIZE: this.urlCache.size
      },
      database: this.database,
      keycloak: this.keycloak,
      app: this.app,
      features: this.features
    };
  }
  
  /**
   * Clear URL cache
   */
  clearCache() {
    this.urlCache.clear();
  }
}

// Export singleton instance
export const appConfig = AppConfig.getInstance();

// Export individual configurations for backward compatibility
export const API_CONFIG = appConfig.api;
export const DB_CONFIG = appConfig.database;
export const KEYCLOAK_CONFIG = appConfig.keycloak;
export const STORAGE_KEYS = appConfig.storage;
export const APP_CONFIG = appConfig.app;
export const FEATURES = appConfig.features;
export const PAGINATION = appConfig.pagination;
export const ROLES = appConfig.roles;

// Export class for testing or advanced usage
export { AppConfig };

// Default export
export default appConfig;
