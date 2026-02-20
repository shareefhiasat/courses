/**
 * Email Business Service
 * 
 * PURPOSE:
 * Email service with QStash integration for bulk sending and Firebase
 * Cloud Functions as fallback. This service handles all email-related
 * business logic including template management, delivery tracking, and
 * error handling.
 * 
 * USAGE:
 * Import these functions in business services, UI components, or hooks.
 * This service abstracts the complexity of email delivery.
 * 
 * ARCHITECTURE:
 * - QStash for high-volume bulk email delivery
 * - Firebase Cloud Functions as fallback
 * - Template management and rendering
 * - Delivery tracking and analytics
 * - Error handling and retry logic
 * 
 * CONFIGURATION:
 * - QStash token and signing key
 * - Firebase functions configuration
 * - Email templates in Firestore
 * 
 * EXAMPLES:
 * ```javascript
 * // In business service:
 * import { sendEmail } from '@services/business/emailService';
 * 
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   template: 'welcome',
 *   data: { userName: 'John' }
 * });
 * 
 * if (result.success) {
 *   logger.info('Email sent successfully');
 * }
 * ```
 * 
 * @author Service Layer Architecture
 * @since v2.0.0
 */

import logger from '@utils/logger';
import analytics from '@utils/analytics';

class EmailService {
  constructor() {
    // QStash is server-side only - client should use Firebase functions
    this.qstashEnabled = false; // Always use server-side email service
    this.fallbackEnabled = true; // Use Firebase functions fallback
    
    // Email Configuration from environment variables
    this.defaultFromEmail = import.meta.env.VITE_DEFAULT_FROM_EMAIL || '';
    this.defaultReplyTo = import.meta.env.VITE_DEFAULT_REPLY_TO || '';
    this.testEmail = import.meta.env.VITE_TEST_EMAIL || '';
    
    // Note: SMTP credentials are handled server-side in Firebase functions
    // Client-side should NOT have access to SMTP passwords
    
    // Don't call initialize() here - it will be called lazily
  }

  initialize() {
    // Secure logging - no sensitive data exposed
    if (this.qstashEnabled && (!this.qstashUrl || !this.qstashToken)) {
      logger.warn('QStash enabled but missing configuration');
      this.qstashEnabled = false;
    }
    
    logger.info('EmailService initialized', {
      qstashEnabled: this.qstashEnabled,
      qstashUrl: this.qstashUrl,
      hasToken: !!this.qstashToken,
      fallbackEnabled: this.fallbackEnabled,
      defaultFromEmail: this.defaultFromEmail ? '[CONFIGURED]' : '[NOT_SET]'
    });

    if (this.qstashEnabled) {
      logger.info('QStash email service initialized');
    } else {
      logger.info('Using fallback email service');
    }
  }

  /**
   * Send single email
   */
  async sendSingleEmail(emailData) {
    const startTime = Date.now();
    
    try {
      logger.debug('Email service - qstashEnabled:', this.qstashEnabled);
      
      if (this.qstashEnabled) {
        logger.debug('Attempting QStash send');
        return await this.sendViaQStash(emailData);
      } else {
        logger.debug('Using fallback send');
        return await this.sendViaFallback(emailData);
      }
    } catch (error) {
      logger.debug('Email service error, falling back to Firebase functions:', error);
      analytics.trackEmailOperation('send_single', 1, false, { error: error.message });
      logger.error('Failed to send single email:', error);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      analytics.trackFirebaseOperation('email_send_single', true, duration);
    }
  }

  /**
   * Send bulk emails - with performance monitoring
   */
  async sendBulkEmails(emailDataList) {
    const startTime = Date.now();
    const recipientCount = emailDataList.length;
    
    try {
      if (this.qstashEnabled && recipientCount > this.maxBatchSize) {
        return await this.sendBulkViaQStash(emailDataList);
      } else {
        return await this.sendBulkViaFallback(emailDataList);
      }
    } catch (error) {
      analytics.trackEmailOperation('send_bulk', recipientCount, false, { error: error.message });
      logger.error('Failed to send bulk emails:', error);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      analytics.trackEmailOperation('send_bulk', recipientCount, true, { duration });
    }
  }

  /**
   * Get email template by ID - with performance monitoring and memoization
   */
  async getEmailTemplate(templateId) {
    try {
      logger.debug('Fetching template from Firestore:', templateId);
      
      // Import Firebase functions dynamically
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../other/config');
      
      // Query for template by ID field
      const templatesRef = collection(db, 'emailTemplates');
      const q = query(templatesRef, where('id', '==', templateId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        logger.warn('Template not found:', templateId);
        return { success: false, error: 'Template not found' };
      }
      
      const templateDoc = querySnapshot.docs[0];
      const template = { id: templateDoc.id, ...templateDoc.data() };
      
      logger.debug('Template found:', template.name);
      return { success: true, template };
      
    } catch (error) {
      logger.error('Error fetching template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Replace template variables with actual values
   */
  replaceTemplateVariables(template, variables) {
    logger.debug('Replacing variables in template');
    
    let result = template;
    
    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    
    return result;
  }

  /**
   * Send via QStash
   */
  async sendViaQStash(emailData) {
    logger.debug('sendViaQStash called with:', { to: emailData.to, templateId: emailData.templateId });
    
    try {
      // Get template content if templateId is provided
      let html = emailData.html;
      let subject = emailData.subject;
      
      if (emailData.templateId && !html) {
        logger.debug('Fetching template for QStash:', emailData.templateId);
        const templateResult = await this.getEmailTemplate(emailData.templateId);
        
        if (templateResult.success && templateResult.template) {
          const template = templateResult.template;
          logger.debug('Template found for QStash:', template.name);
          
          // Replace variables in template
          html = this.replaceTemplateVariables(template.html, emailData.data || emailData.variables || {});
          subject = this.replaceTemplateVariables(template.subject, emailData.data || emailData.variables || {});
        } else {
          logger.warn('Template not found for QStash, using fallback');
          html = emailData.variables?.message || emailData.variables?.messageEn || '<p>Email message</p>';
          subject = emailData.variables?.title || emailData.variables?.titleEn || 'Email Notification';
        }
      }
      
      const payload = {
        to: emailData.to,
        subject: subject,
        html: html,
        text: emailData.text || html.replace(/<[^>]*>/g, ''),
        from: emailData.from || import.meta.env.VITE_DEFAULT_FROM_EMAIL,
        replyTo: emailData.replyTo || import.meta.env.VITE_DEFAULT_REPLY_TO,
        priority: emailData.priority || 'normal',
        headers: emailData.headers || {},
        // Include SMTP credentials for QStash to use
        smtp: {
          host: this.smtpHost,
          port: this.smtpPort,
          user: this.smtpUser,
          password: this.smtpPassword,
          secure: this.smtpSecure,
          senderName: this.smtpSenderName
        }
      };

      logger.debug('QStash payload prepared');

      const response = await fetch(this.qstashUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.qstashToken}`,
          'Content-Type': 'application/json',
          'Upstash-Delay': emailData.delay || '0s',
          'Upstash-Cron': emailData.cron || null,
          'Upstash-Retries': this.retryAttempts.toString(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`QStash API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.info('Email sent via QStash:', { messageId: result.messageId, to: emailData.to });
      
      return {
        success: true,
        messageId: result.messageId,
        provider: 'qstash',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('QStash failed:', error);
      throw error;
    }
  }

  /**
   * Send bulk via QStash (batch processing)
   */
  async sendBulkViaQStash(emailDataList) {
    const batches = this.createBatches(emailDataList, this.maxBatchSize);
    const results = [];
    
    logger.info(`Sending ${emailDataList.length} emails in ${batches.length} batches via QStash`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`Processing batch ${i + 1}/${batches.length} with ${batch.length} emails`);

      const batchPromises = batch.map(emailData => 
        this.sendViaQStash(emailData).catch(error => ({
          success: false,
          error: error.message,
          email: emailData.to,
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        const delay = 1000; // Fixed delay for client-side batching
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info(`Bulk email completed via QStash: ${successful} successful, ${failed} failed`);

    return {
      success: failed === 0,
      totalSent: successful,
      totalFailed: failed,
      results,
      provider: 'qstash',
    };
  }

  /**
   * Send via fallback (current Firebase/SMTP implementation)
   */
  async sendViaFallback(emailData) {
    // Direct Firebase/SMTP implementation
    try {
            
      // Import Firebase functions dynamically
      const { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { httpsCallable } = await import('firebase/functions');
      const { functions, db } = await import('../other/config');
      
      // Handle both notification gateway format and direct format
      let subject = emailData.subject || emailData.variables?.title || emailData.variables?.titleEn || 'Email Notification';
      const template = emailData.template || emailData.templateId || 'custom';
      const data = emailData.data || emailData.variables || {};
      
      // Fetch template for sending
      if (emailData.templateId) {
        const templateResult = await this.getEmailTemplate(emailData.templateId);
        
        if (templateResult.success && templateResult.template) {
          const templateData = templateResult.template;
          // Replace variables for final content
          const finalHtml = this.replaceTemplateVariables(templateData.html, data);
          const finalSubject = this.replaceTemplateVariables(templateData.subject, data);
          
          // Update subject with template subject
          subject = finalSubject;
        }
      }
      
      // Store email in Firestore for tracking
      const emailRef = await addDoc(collection(db, 'emails'), {
        to: emailData.to,
        subject: subject,
        template: template,
        data: data,
        status: 'pending',
        createdAt: serverTimestamp(),
        provider: 'fallback',
        // Add fields required for Firestore rules
        userId: emailData.userId || null,
        recipientEmail: emailData.to
      });

      // For QR code emails, use the dedicated QR function that works
      let result;
      if (emailData.templateId === 'qr_code_student') {
        const sendQREmailFn = httpsCallable(functions, 'sendQRCodeEmail');
        
        const qrPayload = {
          to: emailData.to,
          templateId: emailData.templateId,
          variables: data,
          messageId: emailRef.id
        };
        
        result = await sendQREmailFn(qrPayload);
      } else {
        // Use generic email function for other templates
        const sendEmailFn = httpsCallable(functions, 'sendEmail');
        
        const payload = {
          to: emailData.to,
          templateId: emailData.templateId,
          variables: data,
          messageId: emailRef.id
        };
        
        result = await sendEmailFn(payload);
      }

      // Update status
      await updateDoc(emailRef, {
        status: 'sent',
        messageId: result.data?.messageId,
        sentAt: serverTimestamp()
      });

      logger.info('Email sent via fallback:', { to: emailData.to, messageId: result.data?.messageId });
      
      return {
        success: true,
        messageId: result.data?.messageId,
        provider: 'fallback',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Fallback email failed:', error);
      throw error;
    }
  }

  /**
   * Send bulk via fallback
   */
  async sendBulkViaFallback(emailDataList) {
    const results = [];
    
    logger.info(`Sending ${emailDataList.length} emails via fallback service`);

    for (const emailData of emailDataList) {
      try {
        const result = await this.sendViaFallback(emailData);
        results.push(result);
        
        // Add small delay between emails to avoid overwhelming the service
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          email: emailData.to,
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info(`Bulk email completed via fallback: ${successful} successful, ${failed} failed`);

    return {
      success: failed === 0,
      totalSent: successful,
      totalFailed: failed,
      results,
      provider: 'fallback',
    };
  }

  /**
   * Create batches for bulk processing
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Schedule email for later delivery
   */
  async scheduleEmail(emailData, deliveryTime) {
    if (!this.qstashEnabled) {
      throw new Error('Email scheduling requires QStash to be enabled');
    }

    const delay = this.calculateDelay(deliveryTime);
    const scheduledEmail = {
      ...emailData,
      delay: `${delay}s`,
    };

    return await this.sendViaQStash(scheduledEmail);
  }

  /**
   * Schedule recurring emails
   */
  async scheduleRecurringEmail(emailData, cronExpression) {
    if (!this.qstashEnabled) {
      throw new Error('Recurring emails require QStash to be enabled');
    }

    const scheduledEmail = {
      ...emailData,
      cron: cronExpression,
    };

    return await this.sendViaQStash(scheduledEmail);
  }

  /**
   * Calculate delay for scheduled emails
   */
  calculateDelay(deliveryTime) {
    const now = new Date();
    const target = new Date(deliveryTime);
    const delayMs = target.getTime() - now.getTime();
    
    if (delayMs <= 0) {
      return 0;
    }
    
    return Math.floor(delayMs / 1000);
  }

  /**
   * Get email service status
   */
  getStatus() {
    return {
      qstashEnabled: this.qstashEnabled,
      fallbackEnabled: this.fallbackEnabled,
      maxBatchSize: this.maxBatchSize,
      retryAttempts: this.retryAttempts,
      configured: !!(this.qstashUrl && this.qstashToken) || this.fallbackEnabled,
    };
  }

  /**
   * Test email service configuration
   */
  async testConfiguration() {
    const testEmail = {
      to: import.meta.env.VITE_TEST_EMAIL || 'test@example.com',
      subject: 'QAF Courses - Email Service Test',
      html: '<p>This is a test email from QAF Courses email service.</p>',
      text: 'This is a test email from QAF Courses email service.',
    };

    try {
      const result = await this.sendSingleEmail(testEmail);
      logger.info('Email service test successful:', result);
      return { success: true, result };
    } catch (error) {
      logger.error('Email service test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance (lazy initialization)
let emailServiceInstance = null;

// Create singleton instance
const getEmailService = () => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
    emailServiceInstance.initialize(); // Initialize when first used
  }
  return emailServiceInstance;
};

// Named exports for backward compatibility
export const sendEmail = async (emailData) => {
  logger.debug('sendEmail called with:', { to: emailData.to, templateId: emailData.templateId });
  
  const service = getEmailService();
  return await service.sendSingleEmail(emailData);
};

export const getEmailTemplates = async () => {
  try {
    logger.debug('Loading email templates');
    
    // Import Firebase functions dynamically
    const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
    const { db } = await import('../other/config');
    
    const templatesRef = collection(db, 'emailTemplates');
    
    const q = query(templatesRef, orderBy('name', 'asc'));
    
    const querySnapshot = await getDocs(q);
    logger.debug('Query executed, docs count:', querySnapshot.docs.length);
    
    const templates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    });
    
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

export default getEmailService;

