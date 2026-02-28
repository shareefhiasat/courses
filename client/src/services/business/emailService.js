/**
 * Consolidated Email Business Service
 * 
 * PURPOSE:
 * Single email service that ONLY uses templates from Firestore.
 * No fallbacks, no raw HTML - templates are mandatory.
 * 
 * USAGE:
 * Import sendEmail in business services, UI components, or hooks.
 * This service abstracts email delivery using your template system.
 * 
 * ARCHITECTURE:
 * - Template-only approach (emailTemplates collection)
 * - Firebase Cloud Functions for delivery
 * - Delivery tracking and analytics
 * - Error handling and retry logic
 * 
 * CONFIGURATION:
 * - Firebase functions configuration
 * - Email templates in Firestore collection
 * 
 * EXAMPLES:
 * ```javascript
 * // In business service:
 * import { sendEmail } from '@services/business/emailService';
 * 
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   templateId: 'welcome_signup_default',
 *   variables: { userName: 'John' }
 * });
 * 
 * if (result.success) {
 *   logger.info('Email sent successfully');
 * }
 * ```
 * 
 * @author Service Layer Architecture
 * @since v3.0.0
 */

import logger from '@utils/logger';
import analytics from '@utils/analytics';
import emailDbService from './emailDbService';

/**
 * Send email using template from Firestore
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.templateId - Template ID from emailTemplates collection
 * @param {Object} emailData.variables - Variables for template substitution
 * @param {string} [emailData.cc] - CC recipients
 * @param {string} [emailData.bcc] - BCC recipients
 * @returns {Promise<Object>} Result object
 */
export const sendEmail = async (emailData) => {
  const startTime = Date.now();
  
  try {
    logger.info('📧 Sending email template', {
      to: emailData.to,
      templateId: emailData.templateId,
      variableCount: Object.keys(emailData.variables || {}).length
    });

    // Import Firebase functions dynamically
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    
    // Use the new template-only function
    const sendEmailTemplateFn = httpsCallable(functions, 'sendEmailTemplate');
    
    const result = await sendEmailTemplateFn({
      to: emailData.to,
      templateId: emailData.templateId,
      variables: emailData.variables || {},
      cc: emailData.cc,
      bcc: emailData.bcc,
      siteUrl: window.location.origin
    });

    if (result.data?.success) {
      const duration = Date.now() - startTime;
      analytics.trackFirebaseOperation('email_send_template', true, duration);
      
      logger.info('✅ Email sent successfully', {
        templateId: emailData.templateId,
        messageId: result.data.messageId,
        provider: result.data.provider,
        duration: `${duration}ms`
      });
      
      return {
        success: true,
        messageId: result.data.messageId,
        templateId: emailData.templateId,
        provider: result.data.provider,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(result.data?.message || 'Failed to send email');
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    analytics.trackFirebaseOperation('email_send_template', false, duration);
    
    logger.error('❌ Email send failed', {
      templateId: emailData.templateId,
      to: emailData.to,
      error: error.message,
      code: error.code,
      duration: `${duration}ms`
    });

    // Handle Firebase function errors
    let userFriendlyMessage = 'Failed to send email';
    
    if (error.code === 'unauthenticated') {
      userFriendlyMessage = 'You must be authenticated to send emails';
    } else if (error.code === 'invalid-argument') {
      userFriendlyMessage = 'Invalid email data provided';
    } else if (error.code === 'not-found') {
      userFriendlyMessage = `Email template not found: ${emailData.templateId}`;
    } else if (error.code === 'failed-precondition') {
      userFriendlyMessage = 'Email configuration not found. Please contact administrator.';
    } else if (error.code === 'unavailable') {
      userFriendlyMessage = 'Email service temporarily unavailable. Please try again later.';
    } else if (error.message) {
      userFriendlyMessage = error.message;
    }

    return {
      success: false,
      error: userFriendlyMessage,
      code: error.code,
      templateId: emailData.templateId,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test email template
 * @param {string} testEmail - Email to send test to
 * @param {string} templateId - Template ID to test
 * @returns {Promise<Object>} Result object
 */
export const testEmailTemplate = async (testEmail, templateId = 'welcome_signup_default') => {
  try {
    logger.info('🧪 Testing email template', { testEmail, templateId });

    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../other/config');
    
    const testEmailFn = httpsCallable(functions, 'testEmailTemplate');
    
    const result = await testEmailFn({
      testEmail,
      templateId
    });

    if (result.data?.success) {
      logger.info('✅ Email test successful', {
        templateId,
        messageId: result.data.messageId
      });
      
      return { success: true, result: result.data };
    } else {
      throw new Error(result.data?.message || 'Test failed');
    }

  } catch (error) {
    logger.error('❌ Email test failed', {
      templateId,
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
};

// Backward compatibility - redirect to consolidated notification service
export const sendWelcomeEmail = async (email, role, displayName = null, userId = null, lang = 'en') => {
  try {
    logger.info('📧 Sending welcome email via consolidated service', { email, role, displayName, userId, lang });
    
    // Import consolidated service dynamically to avoid circular dependencies
    const { sendUserWelcomeEmail } = await import('./notificationService');
    
    const result = await sendUserWelcomeEmail({
      email,
      role,
      displayName,
      userId,
      lang
    });
    
    return result;
  } catch (error) {
    logger.error('❌ Exception sending welcome email via consolidated service', { email, role, error: error.message });
    return { success: false, error: error.message };
  }
};

export const getEmailTemplates = async () => {
  try {
    logger.debug('Loading email templates');
    
    const templates = await emailDbService.getEmailTemplates();
    
    logger.info('Templates found:', templates.length);
    
    // Check which expected templates are missing
    const expected = [
      'activity_complete_default',
      'activity_default', 
      'activity_graded_default',
      'announcement_default',
      'chat_digest_default',
      'enrollment_default',
      'qr_code_student',
      'resource_default',
      'student_qr_code'
    ];
    
    const found = templates.map(t => t.id);
    const missing = expected.filter(id => !found.includes(id));
    
    if (missing.length > 0) {
      logger.warn('Missing templates:', missing);
    }
    
    // Check specifically for student_qr_code
    const studentQRTemplate = templates.find(t => t.id === 'student_qr_code');
    if (studentQRTemplate) {
      logger.debug('student_qr_code template found:', studentQRTemplate);
    } else {
      logger.warn('student_qr_code template NOT found!');
    }
    
    return { success: true, data: templates };
  } catch (error) {
    logger.error('Failed to get email templates:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email via Gmail direct function
 * Simple - no templates, no complexity
 */
export const sendViaGmailFallback = async (emailData) => {
  const { httpsCallable } = await import('firebase/functions');
  const { functions } = await import('../other/config');
  
  const sendGmailEmailFn = httpsCallable(functions, 'sendGmailEmail');
  
  const result = await sendGmailEmailFn({
    to: emailData.to,
    subject: emailData.subject || 'Welcome to QAF Learning Hub',
    html: emailData.html || '',
    text: emailData.text || ''
  });
  
  return {
    success: true,
    messageId: result.data?.messageId,
    provider: 'gmail_direct'
  };
};

// Default export for backward compatibility
export default {
  sendEmail,
  testEmailTemplate,
  sendWelcomeEmail,
  getEmailTemplates,
  sendViaGmailFallback
};

