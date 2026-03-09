/**
 * API Configuration and Version Management
 * 
 * PURPOSE:
 * Centralized API configuration with version management
 * Makes it easy to update API versions across the entire application
 * 
 * USAGE:
 * Import API_BASE from this file instead of hardcoding URLs
 * Update API_VERSION to bump API version for all services
 */

// API Configuration
export const API_CONFIG = {
  // Current API version
  VERSION: 'v1',
  
  // Base URL for API server
  BASE_URL: 'https://localhost:3000',
  
  // API endpoints
  ENDPOINTS: {
    CATEGORIES: '/api/v1/categories',
    HEALTH: '/api/v1/health',
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
export const API_BASE = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`;
export const API_HEALTH = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`;
export const API_VERSION = API_CONFIG.VERSION;

/**
 * Get full API URL for a specific endpoint
 * @param {string} endpoint - API endpoint (e.g., 'categories')
 * @param {string} version - API version (defaults to current version)
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint, version = API_CONFIG.VERSION) => {
  return `${API_CONFIG.BASE_URL}/api/${version}/${endpoint}`;
};

/**
 * Get API headers with optional additional headers
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Complete headers object
 */
export const getApiHeaders = (additionalHeaders = {}) => {
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
export const getFetchConfig = (options = {}) => {
  return {
    headers: getApiHeaders(),
    ...options
  };
};

export default API_CONFIG;
