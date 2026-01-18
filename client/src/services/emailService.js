/**
 * Email service with QStash integration for bulk sending
 * Configurable through environment variables
 */

import logger from '../utils/logger';
import analytics from '../utils/analytics';

class EmailService {
  constructor() {
    this.qstashEnabled = import.meta.env.VITE_QSTASH_ENABLED !== 'false';
    this.qstashUrl = import.meta.env.VITE_QSTASH_URL;
    this.qstashToken = import.meta.env.VITE_QSTASH_TOKEN;
    this.currentSigningKey = import.meta.env.VITE_QSTASH_CURRENT_SIGNING_KEY;
    this.nextSigningKey = import.meta.env.VITE_QSTASH_NEXT_SIGNING_KEY;
    this.fallbackEnabled = import.meta.env.VITE_EMAIL_FALLBACK_ENABLED !== 'false';
    this.maxBatchSize = parseInt(import.meta.env.VITE_QSTASH_MAX_BATCH_SIZE) || 100;
    this.retryAttempts = parseInt(import.meta.env.VITE_QSTASH_RETRY_ATTEMPTS) || 3;
    
    this.initialize();
  }

  initialize() {
    if (this.qstashEnabled && (!this.qstashUrl || !this.qstashToken)) {
      logger.warn('QStash enabled but missing configuration');
      this.qstashEnabled = false;
    }

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
      if (this.qstashEnabled) {
        return await this.sendViaQStash(emailData);
      } else {
        return await this.sendViaFallback(emailData);
      }
    } catch (error) {
      analytics.trackEmailOperation('send_single', 1, false, { error: error.message });
      logger.error('Failed to send single email:', error);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      analytics.trackFirebaseOperation('email_send_single', true, duration);
    }
  }

  /**
   * Send bulk emails
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
   * Send via QStash
   */
  async sendViaQStash(emailData) {
    const payload = {
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || '',
      from: emailData.from || import.meta.env.VITE_DEFAULT_FROM_EMAIL,
      replyTo: emailData.replyTo || import.meta.env.VITE_DEFAULT_REPLY_TO,
      priority: emailData.priority || 'normal',
      headers: emailData.headers || {},
    };

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
        const delay = parseInt(import.meta.env.VITE_QSTASH_BATCH_DELAY) || 1000;
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
    // Import the existing email service
    const { sendEmail } = await import('../firebase/firestore');
    
    const result = await sendEmail(emailData);
    
    logger.info('Email sent via fallback:', { to: emailData.to });
    
    return {
      success: true,
      messageId: result.messageId,
      provider: 'fallback',
      timestamp: new Date().toISOString(),
    };
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

// Create singleton instance
const emailService = new EmailService();

export default emailService;
