/**
 * Middleware Index
 * 
 * PURPOSE:
 * Centralized export for all middleware
 * Provides easy access to security, logging, and error handling
 * 
 * @module middleware
 */

const security = require('./security.cjs');
const logging = require('./logging.cjs');
const errorHandler = require('./errorHandler.cjs');

module.exports = {
  // Security middleware
  ...security,
  
  // Logging middleware
  ...logging,
  
  // Error handling middleware
  ...errorHandler
};
