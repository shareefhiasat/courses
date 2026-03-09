/**
 * API Configuration and Version Management - CommonJS Version
 * 
 * PURPOSE:
 * Centralized API configuration with version management
 * For server-side use in API routes
 */

// API Configuration
const API_CONFIG = {
  // Current API version
  VERSION: process.env.API_VERSION || 'v1',
  
  // Base URL for API server
  BASE_URL: process.env.API_BASE_URL || 'https://localhost:3000',
  
  // API endpoints
  ENDPOINTS: {
    CATEGORIES: `/api/${process.env.API_VERSION || 'v1'}/categories`,
    HEALTH: `/api/${process.env.API_VERSION || 'v1'}/health`,
  },
  
  // Request configuration
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Convenience exports
const API_BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`;
const API_HEALTH = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`;
const API_VERSION = API_CONFIG.VERSION;

/**
 * Get full API URL for a specific endpoint
 * @param {string} endpoint - API endpoint (e.g., 'categories')
 * @param {string} version - API version (defaults to current version)
 * @returns {string} Full API URL
 */
const getApiUrl = (endpoint, version = API_CONFIG.VERSION) => {
  return `${API_CONFIG.BASE_URL}/api/${version}/${endpoint}`;
};

/**
 * Get API headers with optional additional headers
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Complete headers object
 */
const getApiHeaders = (additionalHeaders = {}) => {
  return {
    ...API_CONFIG.HEADERS,
    ...additionalHeaders
  };
};

/**
 * Default fetch configuration
 * @param {Object} options - Additional fetch options
 * @returns {Object} Fetch configuration
 */
const getFetchConfig = (options = {}) => {
  return {
    headers: getApiHeaders(),
    ...options
  };
};

module.exports = {
  API_CONFIG,
  API_BASE,
  API_HEALTH,
  API_VERSION,
  getApiUrl,
  getApiHeaders,
  getFetchConfig
};
