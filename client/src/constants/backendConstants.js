import { info, error, warn, debug } from '../services/utils/logger.js';

/**
 * Backend Constants - Secure server-side configuration
 * These values should never be exposed to the client
 */

// Super Admin Configuration
// In production, these should come from environment variables or server-side config
const getSuperAdminEmails = () => {
  // Try to get from environment variables first
  const envEmails = import.meta.env.VITE_SUPER_ADMIN_EMAILS;
  if (envEmails) {
    return envEmails.split(',').map(email => email.trim().toLowerCase());
  }
  
  // Fallback to hardcoded emails for development
  return [
    'admin@example.com',
    'superadmin@example.com'
  ];
};

// System Configuration
export const SYSTEM_CONFIG = {
  maxSuperAdmins: parseInt(import.meta.env.VITE_MAX_SUPER_ADMINS) || 10,
  requireSuperAdminApproval: import.meta.env.VITE_REQUIRE_SUPER_ADMIN_APPROVAL === 'true',
  allowSuperAdminSelfManagement: import.meta.env.VITE_ALLOW_SUPER_ADMIN_SELF_MANAGEMENT !== 'false'
};

// Database Configuration
export const DB_CONFIG = {
  // Connection settings
  host: import.meta.env.DB_HOST || 'localhost',
  port: parseInt(import.meta.env.DB_PORT) || 5432,
  database: import.meta.env.DB_NAME || 'courses_db',
  username: import.meta.env.DB_USER || 'postgres',
  
  // Pool settings
  maxConnections: parseInt(import.meta.env.DB_MAX_CONNECTIONS) || 10,
  minConnections: parseInt(import.meta.env.DB_MIN_CONNECTIONS) || 2,
  idleTimeout: parseInt(import.meta.env.DB_IDLE_TIMEOUT) || 30000,
  
  // Security
  ssl: import.meta.env.DB_SSL === 'true',
  sslMode: import.meta.env.DB_SSL_MODE || 'prefer'
};

// API Configuration
export const API_CONFIG = {
  version: 'v1',
  baseUrl: import.meta.env.API_BASE_URL || '/api',
  timeout: parseInt(import.meta.env.API_TIMEOUT) || 30000,
  retryAttempts: parseInt(import.meta.env.API_RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(import.meta.env.API_RETRY_DELAY) || 1000
};

// Security Configuration
export const SECURITY_CONFIG = {
  // JWT settings
  jwtSecret: import.meta.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: import.meta.env.JWT_EXPIRATION || '24h',
  jwtRefreshExpiration: import.meta.env.JWT_REFRESH_EXPIRATION || '7d',
  
  // Password settings
  passwordMinLength: parseInt(import.meta.env.PASSWORD_MIN_LENGTH) || 8,
  passwordRequireUppercase: import.meta.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  passwordRequireNumbers: import.meta.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
  passwordRequireSymbols: import.meta.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
  
  // Session settings
  sessionTimeout: parseInt(import.meta.env.SESSION_TIMEOUT) || 1800000, // 30 minutes
  maxSessions: parseInt(import.meta.env.MAX_SESSIONS) || 5
};

// Email Configuration
export const EMAIL_CONFIG = {
  provider: import.meta.env.EMAIL_PROVIDER || 'smtp',
  host: import.meta.env.EMAIL_HOST || 'localhost',
  port: parseInt(import.meta.env.EMAIL_PORT) || 587,
  secure: import.meta.env.EMAIL_SECURE === 'true',
  user: import.meta.env.EMAIL_USER || '',
  password: import.meta.env.EMAIL_PASSWORD || '',
  from: import.meta.env.EMAIL_FROM || 'noreply@example.com'
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: parseInt(import.meta.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  allowedTypes: import.meta.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  uploadPath: import.meta.env.UPLOAD_PATH || './uploads',
  tempPath: import.meta.env.TEMP_PATH || './temp'
};

// Cache Configuration
export const CACHE_CONFIG = {
  provider: import.meta.env.CACHE_PROVIDER || 'memory',
  ttl: parseInt(import.meta.env.CACHE_TTL) || 3600, // 1 hour
  maxSize: parseInt(import.meta.env.CACHE_MAX_SIZE) || 100,
  host: import.meta.env.REDIS_HOST || 'localhost',
  port: parseInt(import.meta.env.REDIS_PORT) || 6379,
  password: import.meta.env.REDIS_PASSWORD || ''
};

// Logging Configuration
export const LOG_CONFIG = {
  level: import.meta.env.LOG_LEVEL || 'info',
  format: import.meta.env.LOG_FORMAT || 'json',
  file: import.meta.env.LOG_FILE || './logs/app.log',
  maxSize: import.meta.env.LOG_MAX_SIZE || '10m',
  maxFiles: parseInt(import.meta.env.LOG_MAX_FILES) || 5
};

// Feature Flags
export const FEATURE_FLAGS = {
  enableRegistration: import.meta.env.ENABLE_REGISTRATION !== 'false',
  enableEmailVerification: import.meta.env.ENABLE_EMAIL_VERIFICATION === 'true',
  enablePasswordReset: import.meta.env.ENABLE_PASSWORD_RESET !== 'false',
  enableTwoFactorAuth: import.meta.env.ENABLE_2FA === 'true',
  enableSocialLogin: import.meta.env.ENABLE_SOCIAL_LOGIN === 'true',
  enableAuditLog: import.meta.env.ENABLE_AUDIT_LOG === 'true'
};

// Helper functions
export const isSuperAdmin = (email) => {
  return getSuperAdminEmails().includes(email.toLowerCase());
};

export const validatePassword = (password) => {
  const config = SECURITY_CONFIG;
  
  if (password.length < config.passwordMinLength) {
    return { valid: false, message: `Password must be at least ${config.passwordMinLength} characters` };
  }
  
  if (config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (config.passwordRequireNumbers && !/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (config.passwordRequireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
};

export const isFileTypeAllowed = (mimeType) => {
  return UPLOAD_CONFIG.allowedTypes.includes(mimeType);
};

export default {
  getSuperAdminEmails,
  SYSTEM_CONFIG,
  DB_CONFIG,
  API_CONFIG,
  SECURITY_CONFIG,
  EMAIL_CONFIG,
  UPLOAD_CONFIG,
  CACHE_CONFIG,
  LOG_CONFIG,
  FEATURE_FLAGS,
  isSuperAdmin,
  validatePassword,
  isFileTypeAllowed
};
