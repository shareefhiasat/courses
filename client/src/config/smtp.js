/**
 * SMTP Configuration Manager
 * 
 * Priority Order:
 * 1. Environment Variables (primary source)
 * 2. Test SMTP (if USE_TEST_SMTP=true)
 * 3. Firestore config/smtp (fallback for production)
 * 4. Gmail default (last resort)
 * 
 * This consolidates SMTP configuration from Dashboard UI to environment variables
 * for better testing, tracking, and single source of truth.
 */

import { getSMTPConfig as getSMTPConfigFromFirestore } from '@services/business/emailService';

/**
 * Get SMTP configuration with priority order
 * @returns {Promise<Object>} SMTP configuration object
 */
export const getSMTPConfig = async () => {
  // Priority 1: Environment variables (primary source)
  if (import.meta.env.VITE_SMTP_HOST) {
    return {
      host: import.meta.env.VITE_SMTP_HOST,
      port: parseInt(import.meta.env.VITE_SMTP_PORT) || 587,
      secure: import.meta.env.VITE_SMTP_SECURE === 'true',
      user: import.meta.env.VITE_SMTP_USER,
      password: import.meta.env.VITE_SMTP_PASSWORD,
      senderName: import.meta.env.VITE_SMTP_SENDER_NAME || 'QAF Learning Hub',
      source: 'env',
      provider: import.meta.env.VITE_SMTP_PROVIDER || 'custom'
    };
  }

  // Priority 2: Test SMTP (if USE_TEST_SMTP=true)
  if (import.meta.env.VITE_USE_TEST_SMTP === 'true') {
    return {
      host: import.meta.env.VITE_TEST_SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(import.meta.env.VITE_TEST_SMTP_PORT) || 587,
      secure: false,
      user: import.meta.env.VITE_TEST_SMTP_USER || '9c908a427b6636',
      password: import.meta.env.VITE_TEST_SMTP_PASSWORD || '7f3c74c9e2aec3',
      senderName: 'QAF Learning Hub (Test)',
      source: 'test',
      provider: 'mailtrap'
    };
  }

  // Priority 3: Firestore config (fallback for production)
  try {
    const firestoreConfig = await getSMTPConfigFromFirestore();
    if (firestoreConfig?.success && firestoreConfig?.data) {
      return {
        ...firestoreConfig.data,
        source: 'firestore',
        provider: firestoreConfig.data.provider || 'custom'
      };
    }
  } catch (error) {
    console.warn('Failed to load SMTP config from Firestore:', error);
  }

  // Priority 4: Default to Gmail super admin (last resort)
  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'shareef.hiasat@gmail.com',
    password: import.meta.env.VITE_GMAIL_SMTP_PASSWORD || '',
    senderName: 'QAF Learning Hub',
    source: 'default',
    provider: 'gmail'
  };
};

/**
 * Get SMTP configuration for Cloud Functions (Node.js environment)
 * Uses process.env instead of import.meta.env
 */
export const getSMTPConfigForFunctions = () => {
  // Priority 1: Environment variables
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      senderName: process.env.SMTP_SENDER_NAME || 'QAF Learning Hub',
      source: 'env',
      provider: process.env.SMTP_PROVIDER || 'custom'
    };
  }

  // Priority 2: Test SMTP
  if (process.env.USE_TEST_SMTP === 'true') {
    return {
      host: process.env.TEST_SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.TEST_SMTP_PORT) || 587,
      secure: false,
      user: process.env.TEST_SMTP_USER || '9c908a427b6636',
      password: process.env.TEST_SMTP_PASSWORD || '7f3c74c9e2aec3',
      senderName: 'QAF Learning Hub (Test)',
      source: 'test',
      provider: 'mailtrap'
    };
  }

  // Priority 3: Default Gmail
  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'shareef.hiasat@gmail.com',
    password: process.env.GMAIL_SMTP_PASSWORD || '',
    senderName: 'QAF Learning Hub',
    source: 'default',
    provider: 'gmail'
  };
};

/**
 * Check if using test SMTP
 */
export const isTestSMTP = () => {
  return import.meta.env.VITE_USE_TEST_SMTP === 'true' || process.env.USE_TEST_SMTP === 'true';
};

/**
 * Get SMTP provider name
 */
export const getSMTPProvider = async () => {
  const config = await getSMTPConfig();
  return config.provider || 'custom';
};
