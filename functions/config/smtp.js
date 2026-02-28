/**
 * SMTP Configuration for Cloud Functions
 * 
 * Priority Order:
 * 1. Environment Variables (process.env.SMTP_*)
 * 2. Test SMTP (if USE_TEST_SMTP=true)
 * 3. Firestore config/smtp (fallback)
 * 4. Gmail default (last resort)
 */

const admin = require('firebase-admin');

/**
 * Get SMTP configuration for Cloud Functions
 * Priority Order:
 * 1. Environment Variables (Localhost Development - REAL EMAILS)
 * 2. Legacy functions.config() (Cloud Functions Production)
 * 3. Test SMTP (MailTrap for testing/staging)
 * 4. Firestore config (fallback)
 * 5. Default Gmail (last resort)
 * @returns {Object} SMTP configuration object
 */
const getSMTPConfigForFunctions = async () => {
  // Priority 1: Environment Variables (Localhost Development - REAL EMAILS)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      senderName: process.env.SMTP_SENDER_NAME || 'QAF Learning Hub',
      source: 'env',
      provider: process.env.SMTP_PROVIDER || 'gmail',
      environment: process.env.ENVIRONMENT || 'development'
    };
  }

  // Priority 1.5: Legacy functions.config() (Cloud Functions Production)
  try {
    const functions = require('firebase-functions');
    const config = functions.config();
    if (config.smtp && config.smtp.user) {
      return {
        host: config.smtp.host || 'smtp.gmail.com',
        port: parseInt(config.smtp.port) || 587,
        secure: config.smtp.secure === 'true',
        user: config.smtp.user,
        password: config.smtp.password,
        senderName: config.smtp.sender_name || 'QAF Learning Hub',
        source: 'functions.config',
        provider: config.smtp.provider || 'gmail',
        environment: 'production'
      };
    }
  } catch (error) {
    console.log('No functions.config() SMTP settings found:', error.message);
  }

  // Priority 2: Test SMTP (MailTrap for testing/staging)
  if (process.env.USE_TEST_SMTP === 'true') {
    return {
      host: process.env.TEST_SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.TEST_SMTP_PORT) || 2525,
      secure: false,
      user: process.env.TEST_SMTP_USER || '9c908a427b6636',
      password: process.env.TEST_SMTP_PASSWORD || '7f3c74c9e2aec3',
      senderName: process.env.TEST_SMTP_SENDER_NAME || 'QAF Learning Hub (Test)',
      source: 'test',
      provider: process.env.TEST_SMTP_PROVIDER || 'mailtrap',
      environment: 'testing'
    };
  }

  // Priority 3: Firestore config (fallback for production)
  try {
    const { getSMTPConfig } = require('../services/configService');
    const firestoreConfig = await getSMTPConfig();
    
    if (firestoreConfig && firestoreConfig.user) {
      return firestoreConfig;
    }
  } catch (error) {
    console.warn('Failed to load SMTP config from Firestore service:', error);
  }

  // Priority 4: Default to Gmail super admin (last resort)
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

module.exports = { getSMTPConfigForFunctions };
