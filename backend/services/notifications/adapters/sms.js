/**
 * SMS Adapter
 * 
 * Handles SMS notifications using Twilio or similar SMS provider.
 * Supports retry logic and delivery tracking.
 * 
 * Configuration:
 * - TWILIO_ACCOUNT_SID: Twilio account SID
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 * - TWILIO_PHONE_NUMBER: Twilio phone number
 * 
 * Alternative providers can be added by implementing the send function.
 */

import { PrismaClient } from '@prisma/client';
import { CHANNELS, DELIVERY_STATUS } from '../constants.js';
import log from '../logger.js';

const prisma = new PrismaClient();

/**
 * Send SMS notification
 * @param {Object} notification - Notification object (must have notificationId from in-app adapter)
 * @param {Object} recipient - Recipient object
 * @param {Object} rendered - Rendered template data
 * @param {Object} template - Template with renderSMS method
 * @returns {Promise<Object>} Delivery result
 */
export const send = async (notification, recipient, rendered, template) => {
  const notificationId = notification.notificationId;
  
  try {
    // Check for SMS configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!accountSid || !authToken || !fromNumber) {
      log.warn('SMS provider not configured, skipping SMS');
      
      // Create delivery record for skipped SMS
      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: CHANNELS.SMS,
          status: DELIVERY_STATUS.SKIPPED,
          error: 'SMS provider not configured'
        }
      });
      
      return {
        channel: CHANNELS.SMS,
        status: DELIVERY_STATUS.SKIPPED,
        error: 'SMS provider not configured'
      };
    }
    
    // Get recipient phone number
    const toNumber = recipient.phone || recipient.phoneNumber;
    if (!toNumber) {
      log.warn('Recipient has no phone number, skipping SMS', { userId: recipient.userId });
      
      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: CHANNELS.SMS,
          status: DELIVERY_STATUS.SKIPPED,
          error: 'No phone number for recipient'
        }
      });
      
      return {
        channel: CHANNELS.SMS,
        status: DELIVERY_STATUS.SKIPPED,
        error: 'No phone number for recipient'
      };
    }
    
    // Create queued delivery record
    await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel: CHANNELS.SMS,
        status: DELIVERY_STATUS.QUEUED
      }
    });
    
    // Render SMS content
    const smsContent = template.renderSMS 
      ? template.renderSMS(notification.metadata, recipient.preferredLang || 'en')
      : { body: rendered.bodyEn || rendered.bodyAr || rendered.bodyEn };
    
    // Build SMS options
    const smsOptions = {
      body: smsContent.body,
      from: fromNumber,
      to: toNumber
    };
    
    // Send SMS with retry logic
    const maxRetries = 3;
    let lastError = null;
    let success = false;
    let messageSid = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Dynamic import of Twilio SDK to avoid requiring it if not configured
        const twilio = await import('twilio');
        const client = twilio(accountSid, authToken);
        
        const message = await client.messages.create(smsOptions);
        messageSid = message.sid;
        success = true;
        
        log.info('SMS sent successfully', {
          to: toNumber,
          messageSid,
          attempt
        });
        break;
      } catch (error) {
        lastError = error;
        log.warn('SMS send failed, retrying', {
          to: toNumber,
          attempt,
          error: error.message
        });
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }
    
    // Update delivery record
    if (success) {
      await prisma.notificationDelivery.updateMany({
        where: {
          notificationId,
          channel: CHANNELS.SMS
        },
        data: {
          status: DELIVERY_STATUS.DELIVERED,
          providerMsgId: messageSid,
          sentAt: new Date(),
          attempts: { increment: 1 }
        }
      });
      
      return {
        channel: CHANNELS.SMS,
        status: DELIVERY_STATUS.DELIVERED,
        providerMsgId: messageSid,
        attempts: 1
      };
    } else {
      // All retries failed
      log.error('SMS send failed after retries', {
        to: toNumber,
        error: lastError.message
      });
      
      await prisma.notificationDelivery.updateMany({
        where: {
          notificationId,
          channel: CHANNELS.SMS
        },
        data: {
          status: DELIVERY_STATUS.FAILED,
          error: lastError.message,
          attempts: maxRetries
        }
      });
      
      return {
        channel: CHANNELS.SMS,
        status: DELIVERY_STATUS.FAILED,
        error: lastError.message,
        attempts: maxRetries
      };
    }
  } catch (error) {
    log.error('Failed to send SMS notification', {
      userId: recipient.userId,
      event: notification.event,
      error: error.message
    });
    
    // Create failed delivery record if not exists
    try {
      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: CHANNELS.SMS,
          status: DELIVERY_STATUS.FAILED,
          error: error.message
        }
      });
    } catch (createError) {
      // Ignore if already exists
    }
    
    return {
      channel: CHANNELS.SMS,
      status: DELIVERY_STATUS.FAILED,
      error: error.message
    };
  }
};

export default {
  key: CHANNELS.SMS,
  name: 'SMS Notifications',
  send
};
