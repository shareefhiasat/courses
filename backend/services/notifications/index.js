/**
 * Notification Gateway - Main Entry Point
 * 
 * Unified notification system with adapter pattern for multiple channels.
 * Public API:
 * - emit(event, payload, actor, recipientCriteria)
 * - emitBulk(event, recipients, payload, actor)
 * 
 * Usage:
 *   import notificationGateway from '../services/notifications';
 *   await notificationGateway.emit('workflow.assigned', { workflowName, ... }, user, { userId: 123 });
 */

import prisma from '../../db/prismaClient.js';
import { EVENTS, CATEGORIES, PRIORITIES, getCategoryFromEvent, getPriorityFromEvent } from './constants.js';
import { registerAdapter, registerTemplate, getTemplate, getEnabledChannels, getAdapter } from './registry.js';
import { resolveRecipients } from './recipients.js';
import { registerAllTemplates } from './templates.js';
import inAppAdapter from './adapters/inApp.js';
import emailAdapter from './adapters/email.js';
import smsAdapter from './adapters/sms.js';
import log from './logger.js';


// Register built-in adapters
registerAdapter(inAppAdapter);
registerAdapter(emailAdapter);
registerAdapter(smsAdapter);

// Register all templates from the centralized templates file
registerAllTemplates(registerTemplate);

/**
 * Set WebSocket emitter for real-time delivery
 * @param {Function} emitter - Function to emit WS events (userId, event, data)
 */
export const setWSEmitter = (emitter) => {
  inAppAdapter.setWSEmitter(emitter);
  log.info('WebSocket emitter configured');
};

/**
 * Emit a notification to recipients
 * @param {string} event - Event name (e.g., 'workflow.assigned')
 * @param {Object} payload - Event payload
 * @param {Object} actor - Actor who triggered the notification (user object)
 * @param {Object} recipientCriteria - Recipient criteria (userId, userIds, role, classId, subjectId, programId)
 * @returns {Promise<Object>} Result with notification details
 */
export const emit = async (event, payload, actor, recipientCriteria) => {
  try {
    log.info('Emitting notification', { event, recipientCriteria });
    
    // Validate event
    const template = getTemplate(event);
    if (!template) {
      log.warn('Template not found', { event });
      return { success: false, error: 'Template not found' };
    }
    
    // Resolve recipients
    const recipients = await resolveRecipients(recipientCriteria);
    if (recipients.length === 0) {
      log.warn('No recipients resolved', { event, recipientCriteria });
      return { success: false, error: 'No recipients' };
    }
    
    // Get notification details
    const category = template.category || getCategoryFromEvent(event);
    const priority = template.defaultPriority || getPriorityFromEvent(event);
    
    // Process each recipient
    const results = [];
    for (const recipient of recipients) {
      // Get user preferences
      const userPrefs = await prisma.notificationPreference.findUnique({
        where: { userId: recipient.userId }
      });
      
      // Determine enabled channels
      const enabledChannels = getEnabledChannels(userPrefs, category);
      
      // Render template for recipient's language
      const lang = recipient.preferredLang || 'en';
      const rendered = template.render(payload, lang);
      
      // Deliver via each enabled channel
      const deliveries = [];
      let notificationId = null;
      
      for (const channel of enabledChannels) {
        const adapter = getAdapter(channel);
        if (!adapter) {
          log.warn('Adapter not found', { channel });
          continue;
        }
        
        try {
          // For in-app channel, capture the notificationId
          const notificationData = { event, category, priority, metadata: payload, createdById: actor?.id };
          if (notificationId) {
            notificationData.notificationId = notificationId;
          }
          
          const result = await adapter.send(notificationData, recipient, rendered, template);
          
          // Capture notificationId from in-app adapter result
          if (result.notificationId && !notificationId) {
            notificationId = result.notificationId;
          }
          
          deliveries.push(result);
        } catch (error) {
          log.error('Adapter send failed', { channel, error: error.message });
          deliveries.push({ channel, status: 'failed', error: error.message });
        }
      }
      
      results.push({
        userId: recipient.userId,
        deliveries
      });
    }
    
    log.info('Notification emitted', { event, recipientCount: recipients.length });
    return { success: true, results };
  } catch (error) {
    log.error('Failed to emit notification', { event, error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Emit a notification to specific users (bulk)
 * @param {string} event - Event name
 * @param {Array<number>} userIds - Array of user IDs
 * @param {Object} payload - Event payload
 * @param {Object} actor - Actor who triggered the notification
 * @returns {Promise<Object>} Result with notification details
 */
export const emitBulk = async (event, userIds, payload, actor) => {
  return await emit(event, payload, actor, { userIds });
};

/**
 * Initialize the notification gateway
 * @param {Object} options - Initialization options
 * @param {Function} options.wsEmitter - WebSocket emitter function
 */
export const initialize = async (options = {}) => {
  if (options.wsEmitter) {
    setWSEmitter(options.wsEmitter);
  }
  
  log.info('Notification gateway initialized');
};

export default {
  emit,
  emitBulk,
  setWSEmitter,
  initialize,
  EVENTS,
  CATEGORIES,
  PRIORITIES
};
