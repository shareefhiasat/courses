const Handlebars = require('handlebars');
const moment = require('moment-timezone');

// Qatar timezone
const QATAR_TZ = 'Asia/Qatar';

// Register Handlebars helpers for date formatting
Handlebars.registerHelper('qatarDateTime', (date) => {
  if (!date) return '';
  return moment(date).tz(QATAR_TZ).format('DD/MM/YYYY HH:mm');
});

Handlebars.registerHelper('qatarDate', (date) => {
  if (!date) return '';
  return moment(date).tz(QATAR_TZ).format('DD/MM/YYYY');
});

/**
 * Render an email template with variables
 * @param {string} templateHtml - HTML template with {{variables}}
 * @param {object} variables - Variables to replace
 * @param {string} siteUrl - Base URL of the site
 * @returns {string} Rendered HTML
 */
function renderEmailTemplate(templateHtml, variables = {}, siteUrl = 'https://your-domain.com') {
  // Add common variables
  const allVariables = {
    ...variables,
    siteName: 'CS Learning Hub',
    siteUrl: siteUrl,
    currentDate: moment().tz(QATAR_TZ).format('DD/MM/YYYY'),
    currentDateTime: moment().tz(QATAR_TZ).format('DD/MM/YYYY HH:mm'),
  };

  // Add greeting if recipientName exists
  if (allVariables.recipientName) {
    allVariables.greeting = `Dear ${allVariables.recipientName}`;
  }

  // Format any date fields to Qatar timezone
  Object.keys(allVariables).forEach(key => {
    const value = allVariables[key];
    
    // If it's a Firestore Timestamp, convert it
    if (value && typeof value === 'object' && value.toDate) {
      const date = value.toDate();
      if (key.includes('DateTime') || key.includes('Time')) {
        allVariables[key] = moment(date).tz(QATAR_TZ).format('DD/MM/YYYY HH:mm');
      } else if (key.includes('Date')) {
        allVariables[key] = moment(date).tz(QATAR_TZ).format('DD/MM/YYYY');
      }
    }
    // If it's a Date object
    else if (value instanceof Date) {
      if (key.includes('DateTime') || key.includes('Time')) {
        allVariables[key] = moment(value).tz(QATAR_TZ).format('DD/MM/YYYY HH:mm');
      } else if (key.includes('Date')) {
        allVariables[key] = moment(value).tz(QATAR_TZ).format('DD/MM/YYYY');
      }
    }
  });

  // Compile and render template
  try {
    const template = Handlebars.compile(templateHtml);
    return template(allVariables);
  } catch (error) {
    console.error('Error rendering template:', error);
    throw new Error('Failed to render email template: ' + error.message);
  }
}

/**
 * Get email template from Firestore
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} templateId - Template ID
 * @returns {Promise<object>} Template data
 */
async function getEmailTemplate(db, templateId) {
  try {
    const templateDoc = await db.collection('emailTemplates').doc(templateId).get();
    
    if (!templateDoc.exists) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    return templateDoc.data();
  } catch (error) {
    console.error('Error getting template:', error);
    throw error;
  }
}

/**
 * Check if email notifications are enabled for a trigger
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} triggerType - Type of trigger (announcements, activities, etc.)
 * @returns {Promise<boolean>} Whether notifications are enabled
 */
async function isEmailEnabled(db, triggerType) {
  try {
    const settingsDoc = await db.collection('config').doc('emailSettings').get();
    if (!settingsDoc.exists) return true; // default if no settings doc

    const settings = settingsDoc.data() || {};

    // Map singular template type to plural trigger key
    const mapping = {
      announcement: 'announcements',
      activity: 'activities',
      enrollment: 'enrollments',
      resource: 'resources',
      chat_digest: 'chatDigest',
      activity_complete: 'activityComplete',
      activity_graded: 'activityGraded',
      welcome_signup: 'welcomeSignup',
      password_reset: 'passwordReset'
    };

    const pluralKey = mapping[triggerType] || triggerType;

    // Prefer the exact trigger key first
    if (Object.prototype.hasOwnProperty.call(settings, pluralKey)) {
      return settings[pluralKey]?.enabled !== false;
    }
    // Fallback to singular (legacy saved key)
    const legacyKey = Object.keys(mapping).find(k => mapping[k] === pluralKey) || triggerType;
    if (Object.prototype.hasOwnProperty.call(settings, legacyKey)) {
      return settings[legacyKey]?.enabled !== false;
    }

    return true; // default if neither exists
  } catch (error) {
    console.error('Error checking email settings:', error);
    return true; // default to enabled on error
  }
}

/**
 * Log email to Firestore for audit trail
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {object} emailData - Email data to log
 */
async function logEmail(db, emailData) {
  try {
    const { FieldValue } = require('firebase-admin/firestore');
    
    await db.collection('emailLogs').add({
      ...emailData,
      timestamp: FieldValue.serverTimestamp(),
      status: emailData.status || 'sent',
    });
  } catch (error) {
    console.error('Error logging email:', error);
    // Don't throw - logging failure shouldn't break email sending
  }
}

module.exports = {
  renderEmailTemplate,
  getEmailTemplate,
  isEmailEnabled,
  logEmail,
  QATAR_TZ
};
