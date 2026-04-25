/**
 * Email Adapter
 * 
 * Handles email notifications using Nodemailer with SMTP.
 * Supports HTML/text rendering and retry logic.
 */

import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { CHANNELS, DELIVERY_STATUS } from '../constants.js';
import log from '../logger.js';

const prisma = new PrismaClient();

// Transporter instance (lazy-loaded)
let transporter = null;

/**
 * Get or create nodemailer transporter
 * @returns {Object} Nodemailer transporter
 */
const getTransporter = () => {
  if (transporter) {
    return transporter;
  }
  
  // Check for SMTP configuration
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };
  
  // Fallback to Gmail if SMTP not configured
  if (!smtpConfig.host && process.env.GMAIL_USER && process.env.GMAIL_PASSWORD) {
    smtpConfig.host = 'smtp.gmail.com';
    smtpConfig.port = 587;
    smtpConfig.secure = false;
    smtpConfig.auth = {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD
    };
  }
  
  if (!smtpConfig.host || !smtpConfig.auth.user) {
    log.warn('SMTP not configured, email adapter will be disabled');
    return null;
  }
  
  transporter = nodemailer.createTransport(smtpConfig);
  log.info('Email transporter configured', { host: smtpConfig.host });
  
  return transporter;
};

/**
 * Send email notification
 * @param {Object} notification - Notification object (must have notificationId from in-app adapter)
 * @param {Object} recipient - Recipient object
 * @param {Object} rendered - Rendered template data
 * @param {Object} template - Template with renderEmail method
 * @returns {Promise<Object>} Delivery result
 */
export const send = async (notification, recipient, rendered, template) => {
  const notificationId = notification.notificationId;
  
  try {
    const transporter = getTransporter();
    if (!transporter) {
      log.warn('Email transporter not available, skipping email');
      
      // Create delivery record for skipped email
      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: CHANNELS.EMAIL,
          status: DELIVERY_STATUS.SKIPPED,
          error: 'SMTP not configured'
        }
      });
      
      return {
        channel: CHANNELS.EMAIL,
        status: DELIVERY_STATUS.SKIPPED,
        error: 'SMTP not configured'
      };
    }
    
    // Create queued delivery record
    await prisma.notificationDelivery.create({
      data: {
        notificationId,
        channel: CHANNELS.EMAIL,
        status: DELIVERY_STATUS.QUEUED
      }
    });
    
    // Render email content
    const emailContent = template.renderEmail(notification.metadata, recipient.preferredLang || 'en');
    
    // Build email options
    const mailOptions = {
      from: `"${process.env.SMTP_SENDER_NAME || 'Military LMS'}" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
      to: recipient.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };
    
    // Send email with retry logic
    const maxRetries = 3;
    let lastError = null;
    let success = false;
    let messageId = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const info = await transporter.sendMail(mailOptions);
        messageId = info.messageId;
        success = true;
        
        log.info('Email sent successfully', {
          to: recipient.email,
          messageId,
          attempt
        });
        break;
      } catch (error) {
        lastError = error;
        log.warn('Email send failed, retrying', {
          to: recipient.email,
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
          channel: CHANNELS.EMAIL
        },
        data: {
          status: DELIVERY_STATUS.DELIVERED,
          providerMsgId: messageId,
          sentAt: new Date(),
          attempts: { increment: 1 }
        }
      });
      
      return {
        channel: CHANNELS.EMAIL,
        status: DELIVERY_STATUS.DELIVERED,
        providerMsgId: messageId,
        attempts: 1
      };
    } else {
      // All retries failed
      log.error('Email send failed after retries', {
        to: recipient.email,
        error: lastError.message
      });
      
      await prisma.notificationDelivery.updateMany({
        where: {
          notificationId,
          channel: CHANNELS.EMAIL
        },
        data: {
          status: DELIVERY_STATUS.FAILED,
          error: lastError.message,
          attempts: maxRetries
        }
      });
      
      return {
        channel: CHANNELS.EMAIL,
        status: DELIVERY_STATUS.FAILED,
        error: lastError.message,
        attempts: maxRetries
      };
    }
  } catch (error) {
    log.error('Failed to send email notification', {
      userId: recipient.userId,
      event: notification.event,
      error: error.message
    });
    
    // Create failed delivery record if not exists
    try {
      await prisma.notificationDelivery.create({
        data: {
          notificationId,
          channel: CHANNELS.EMAIL,
          status: DELIVERY_STATUS.FAILED,
          error: error.message
        }
      });
    } catch (createError) {
      // Ignore if already exists
    }
    
    return {
      channel: CHANNELS.EMAIL,
      status: DELIVERY_STATUS.FAILED,
      error: error.message
    };
  }
};

export default {
  key: CHANNELS.EMAIL,
  name: 'Email Notifications',
  send
};
