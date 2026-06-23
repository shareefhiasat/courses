/**
 * In-App Notification Adapter
 * 
 * This adapter handles in-app notifications by:
 * 1. Writing to the Notification table
 * 2. Writing a delivery record with status 'delivered'
 * 3. Emitting a WebSocket event to online recipients
 */

import { PrismaClient } from '@prisma/client';
import { CHANNELS, DELIVERY_STATUS } from '../constants.js';
import { mapNotification } from '../mapper.js';
import log from '../logger.js';

const prisma = new PrismaClient();

// WebSocket emitter - will be set by the main gateway
let wsEmitter = null;

/**
 * Set the WebSocket emitter
 * @param {Function} emitter - Function to emit WS events (userId, event, data)
 */
export const setWSEmitter = (emitter) => {
  wsEmitter = emitter;
};

/**
 * Send in-app notification
 * @param {Object} notification - Notification object
 * @param {Object} recipient - Recipient object
 * @param {Object} rendered - Rendered template data
 * @returns {Promise<Object>} Delivery result
 */
export const send = async (notification, recipient, rendered) => {
  try {
    // Deduplicate: if groupKey exists, check for a recent duplicate within 5 minutes
    const groupKey = rendered.groupKey || null;
    if (groupKey) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existing = await prisma.notification.findFirst({
        where: {
          userId: recipient.userId,
          groupKey,
          createdAt: { gte: fiveMinutesAgo },
        },
        select: { id: true },
      });
      if (existing) {
        log.info('Duplicate notification skipped', { userId: recipient.userId, groupKey });
        return {
          channel: CHANNELS.IN_APP,
          status: DELIVERY_STATUS.DELIVERED,
          notificationId: existing.id,
          deliveryId: null,
          deduplicated: true,
        };
      }
    }

    // Create notification record
    const createdNotification = await prisma.notification.create({
      data: {
        userId: recipient.userId,
        category: notification.category,
        event: notification.event,
        priority: notification.priority,
        titleEn: rendered.titleEn,
        titleAr: rendered.titleAr,
        bodyEn: rendered.bodyEn,
        bodyAr: rendered.bodyAr,
        link: rendered.link,
        metadata: notification.metadata || {},
        groupKey: rendered.groupKey || null,
        createdById: notification.createdById || null
      }
    });
    
    // Create delivery record
    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: createdNotification.id,
        channel: CHANNELS.IN_APP,
        status: DELIVERY_STATUS.DELIVERED,
        sentAt: new Date()
      }
    });
    
    // Emit WebSocket event if emitter is available
    if (wsEmitter) {
      try {
        wsEmitter(recipient.userId, 'notification:new', mapNotification(createdNotification));
        log.info('WS event emitted', { userId: recipient.userId, notificationId: createdNotification.id });
      } catch (wsError) {
        log.warn('Failed to emit WS event', { userId: recipient.userId, error: wsError.message });
      }
    }
    
    log.info('In-app notification delivered', {
      notificationId: createdNotification.id,
      userId: recipient.userId,
      event: notification.event
    });
    
    return {
      channel: CHANNELS.IN_APP,
      status: DELIVERY_STATUS.DELIVERED,
      notificationId: createdNotification.id,
      deliveryId: delivery.id
    };
  } catch (error) {
    log.error('Failed to deliver in-app notification', {
      userId: recipient.userId,
      event: notification.event,
      error: error.message
    });
    
    return {
      channel: CHANNELS.IN_APP,
      status: DELIVERY_STATUS.FAILED,
      error: error.message
    };
  }
};

export default {
  key: CHANNELS.IN_APP,
  name: 'In-App Notifications',
  send,
  setWSEmitter
};
