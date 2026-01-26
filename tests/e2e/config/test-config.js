/**
 * Test Configuration
 * Store test credentials and environment variables
 * 
 * IMPORTANT: Add this file to .gitignore to keep credentials secure
 */

export const testConfig = {
  // Super Admin Credentials
  superAdmin: {
    email: process.env.TEST_SUPERADMIN_EMAIL || 'shareef.hiasat@gmail.com',
    password: process.env.TEST_SUPERADMIN_PASSWORD || 'Jordan123$',
    role: 'superAdmin',
    displayName: 'Super Admin Test User'
  },

  // Admin Credentials (if different from super admin)
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'shareef.hiasat@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Jordan123$',
    role: 'admin',
    displayName: 'Admin Test User'
  },

  // Base URL
  baseURL: process.env.BASE_URL || 'https://localhost:5174',

  // Mailtrap Configuration (for email testing)
  mailtrap: {
    // API Token for sending emails via Mailtrap API
    apiToken: process.env.MAILTRAP_API_TOKEN || '4eda497468586ee815e62dd85d53b5ed',
    
    // Inbox ID for receiving/testing emails
    inboxId: process.env.MAILTRAP_INBOX_ID || '',
    
    // API Base URL
    baseURL: 'https://mailtrap.io/api/v1',
    
    // SMTP Configuration (for sending emails via SMTP)
    smtp: {
      host: process.env.MAILTRAP_SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.MAILTRAP_SMTP_PORT) || 587,
      username: process.env.MAILTRAP_SMTP_USERNAME || '9c908a427b6636',
      password: process.env.MAILTRAP_SMTP_PASSWORD || '7f3c74c9e2aec3',
      secure: false, // Use STARTTLS
      tls: true
    },
    
    // Send API Configuration
    sendAPI: {
      baseURL: 'https://send.api.mailtrap.io',
      token: process.env.MAILTRAP_SEND_API_TOKEN || '4eda497468586ee815e62dd85d53b5ed'
    }
  },

  // Gmail Configuration (for super admin inbox checking)
  gmail: {
    email: process.env.SUPERADMIN_GMAIL || 'shareef.hiasat@gmail.com',
    appPassword: process.env.SUPERADMIN_GMAIL_APP_PASSWORD || 'qyus cilm srfh hadt',
    // Note: Gmail API requires OAuth2 for full access
    // For testing, we use Gmail plus addressing (user+tag@gmail.com)
    // All emails go to shareef.hiasat@gmail.com inbox
    // Mailtrap Inbox is used for SMTP testing (captures emails sent via SMTP)
    // Mailtrap Send API sends to real emails (like Gmail)
  },

  // Test Data Generation
  testData: {
    // Generate unique emails for test users using Gmail plus addressing
    // Format: shareef.hiasat+DDMMYYYYHHMM@gmail.com
    // This ensures all emails go to shareef.hiasat@gmail.com inbox
    generateEmail: (prefix, role = 'test') => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const timestamp = `${day}${month}${year}${hour}${minute}`;
      return `shareef.hiasat+${timestamp}${prefix}${role}@gmail.com`;
    },
    
    // Generate display names
    generateDisplayName: (prefix, role = 'Test') => {
      const timestamp = Date.now();
      return `${role} ${prefix} ${timestamp}`;
    },
    
    // Default password for test users
    defaultPassword: process.env.TEST_DEFAULT_PASSWORD || 'Test123!@#'
  },

  // Timeouts
  timeouts: {
    navigation: 30000,
    action: 10000,
    api: 15000,
    email: 30000 // For email delivery
  },

  // Test Tags
  tags: {
    smoke: '@smoke',
    critical: '@critical',
    regression: '@regression',
    mainFlow: '@main-flow',
    email: '@email',
    dashboard: '@dashboard',
    crud: '@crud'
  },

  // Cleanup flag - set to true to clean up test data after tests
  cleanup: {
    enabled: process.env.CLEANUP_TEST_DATA === 'true' || false,
    skipCleanup: process.env.SKIP_CLEANUP === 'true' || false
  }
};

// Export individual configs for convenience
export const { superAdmin, admin, baseURL, mailtrap, testData, timeouts, tags } = testConfig;
