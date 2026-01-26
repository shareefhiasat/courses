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
 * @returns {Object} SMTP configuration object
 */
const getSMTPConfigForFunctions = async () => {
  // Priority 1: Environment variables (primary source)
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

  // Priority 2: Test SMTP (if USE_TEST_SMTP=true)
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

  // Priority 3: Firestore config (fallback for production)
  try {
    const db = admin.firestore();
    const configDoc = await db.collection('config').doc('smtp').get();
    
    if (configDoc.exists) {
      const data = configDoc.data();
      return {
        ...data,
        source: 'firestore',
        provider: data.provider || 'custom'
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
    password: process.env.GMAIL_SMTP_PASSWORD || '',
    senderName: 'QAF Learning Hub',
    source: 'default',
    provider: 'gmail'
  };
};

module.exports = { getSMTPConfigForFunctions };
