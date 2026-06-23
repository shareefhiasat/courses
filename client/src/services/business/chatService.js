/**
 * Chat Service - Real PostgreSQL + WebSocket Implementation
 * 
 * Replaces Firebase stubs with actual backend API calls
 */

import { info, error, warn, debug } from '@services/utils/logger.js';
import chatSocket from '@services/realtime/chatSocket.js';
import apiClient from '@services/api/apiClient.js';

const serviceName = 'chatService';

// WebSocket event handlers
const messageHandlers = new Set();
const roomHandlers = new Set();

/**
 * Initialize chat service with authentication token
 * @param {string} token - JWT token
 */
export const initializeChatService = (token) => {
  info(`[${serviceName}] Initializing with token`);
  chatSocket.connect(token);
};

/**
 * Disconnect chat service
 */
export const disconnectChatService = () => {
  info(`[${serviceName}] Disconnecting`);
  chatSocket.disconnect();
};

/**
 * Subscribe to messages in a room
 * @param {number} roomId - Room ID
 * @param {Function} callback - Callback function (messages) => void
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMessages = (roomId, callback) => {
  info(`[${serviceName}] Subscribing to room ${roomId}`);
  
  const handler = (message) => {
    if (message.roomId === roomId) {
      callback([message]); // Wrap in array for compatibility
    }
  };

  messageHandlers.add(handler);
  chatSocket.on('message', handler);

  // Initial load of messages
  getRoomMessages(roomId).then(messages => {
    if (messages.success) {
      callback(messages.data);
    }
  });

  // Return unsubscribe function
  return () => {
    messageHandlers.delete(handler);
    chatSocket.off('message', handler);
  };
};

/**
 * Subscribe to user's classes
 * @param {number} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToClasses = (userId, callback) => {
  info(`[${serviceName}] Subscribing to classes for user ${userId}`);
  
  // Load classes from rooms
  getUserRooms().then(result => {
    if (result.success) {
      const classRooms = result.data.filter(r => r.type === 'class');
      const classes = classRooms.map(room => ({
        id: room.classId,
        name: room.class?.nameEn || 'Class',
        nameAr: room.class?.nameAr,
        code: room.class?.code,
        roomId: room.id
      }));
      callback(classes);
    }
  });

  // No real-time updates for class list needed
  return () => {};
};

/**
 * Subscribe to direct message rooms
 * @param {number} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDirectRooms = (userId, callback) => {
  info(`[${serviceName}] Subscribing to DM rooms for user ${userId}`);
  
  // Load DM rooms
  getUserRooms().then(result => {
    if (result.success) {
      const dmRooms = result.data.filter(r => r.type === 'dm');
      callback(dmRooms);
    }
  });

  // Listen for new DM rooms (when new message arrives)
  const handler = (message) => {
    getUserRooms().then(result => {
      if (result.success) {
        const dmRooms = result.data.filter(r => r.type === 'dm');
        callback(dmRooms);
      }
    });
  };

  chatSocket.on('message', handler);

  return () => {
    chatSocket.off('message', handler);
  };
};

/**
 * Get user's chat rooms
 * @returns {Promise<Object>} { success, data }
 */
export const getUserRooms = async () => {
  try {
    const response = await apiClient.get('/chat/rooms');
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error getting rooms:`, err);
    return { success: false, error: err.message, data: [] };
  }
};

/**
 * Get messages for a room
 * @param {number} roomId - Room ID
 * @param {Object} options - { limit, before, after }
 * @returns {Promise<Object>} { success, data }
 */
export const getRoomMessages = async (roomId, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.before) params.append('before', options.before);
    if (options.after) params.append('after', options.after);

    const response = await apiClient.get(`/chat/rooms/${roomId}/messages?${params}`);
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error getting messages:`, err);
    return { success: false, error: err.message, data: [] };
  }
};

/**
 * Send a message
 * @param {number} roomId - Room ID
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} { success, data }
 */
export const sendMessage = async (roomId, messageData) => {
  try {
    const response = await apiClient.post(`/chat/rooms/${roomId}/messages`, messageData);
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error sending message:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Update a message
 * @param {number} messageId - Message ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} { success, data }
 */
export const updateMessage = async (messageId, data) => {
  try {
    const response = await apiClient.put(`/chat/messages/${messageId}`, data);
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error updating message:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Delete a message
 * @param {number} messageId - Message ID
 * @returns {Promise<Object>} { success }
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await apiClient.delete(`/chat/messages/${messageId}`);
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error deleting message:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Create or get DM room
 * @param {number} recipientId - Recipient user ID
 * @returns {Promise<Object>} { success, data }
 */
export const createDM = async (recipientId) => {
  try {
    const response = await apiClient.post('/chat/dm', { recipientId });
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error creating DM:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Toggle reaction on a message
 * @param {number} messageId - Message ID
 * @param {string} reactionType - Reaction type
 * @param {boolean} remove - Whether to remove the reaction
 * @returns {Promise<Object>} { success, data }
 */
export const toggleReaction = async (messageId, reactionType, remove = false) => {
  try {
    const response = await apiClient.post(`/chat/messages/${messageId}/reactions`, {
      reactionType,
      remove
    });
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error toggling reaction:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Vote on a poll
 * @param {number} messageId - Message ID
 * @param {number} optionIndex - Poll option index
 * @returns {Promise<Object>} { success, data }
 */
export const votePoll = async (messageId, optionIndex) => {
  try {
    const response = await apiClient.post(`/chat/messages/${messageId}/vote`, {
      optionIndex
    });
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error voting on poll:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Get users available for DM
 * @returns {Promise<Object>} { success, data }
 */
export const getAvailableDMUsers = async () => {
  try {
    const response = await apiClient.get('/chat/users');
    return { success: true, data: response.data.data };
  } catch (err) {
    error(`[${serviceName}] Error getting available users:`, err);
    return { success: false, error: err.message, data: [] };
  }
};

/**
 * Subscribe to user read receipts (stub for now)
 * @param {number} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserReadReceipts = (userId, callback) => {
  // TODO: Implement read receipts tracking
  callback({});
  return () => {};
};

/**
 * Update user chat reads (stub for now)
 * @param {number} userId - User ID
 * @param {string} chatId - Chat ID
 * @param {number} lastReadTimestamp - Last read timestamp
 * @returns {Promise<Object>}
 */
export const updateUserChatReads = async (userId, chatId, lastReadTimestamp) => {
  // TODO: Implement read tracking
  return { success: true };
};

/**
 * Create poll message
 * @param {number} roomId - Room ID
 * @param {string} question - Poll question
 * @param {Array<string>} options - Poll options
 * @returns {Promise<Object>}
 */
export const createPollMessage = async (roomId, question, options) => {
  const pollOptions = options.map(text => ({ text, votes: [] }));
  return sendMessage(roomId, {
    type: 'poll',
    content: question,
    pollOptions
  });
};

export default {
  initializeChatService,
  disconnectChatService,
  subscribeToMessages,
  subscribeToClasses,
  subscribeToDirectRooms,
  subscribeToUserReadReceipts,
  updateUserChatReads,
  getUserRooms,
  getRoomMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  createDM,
  toggleReaction,
  votePoll,
  getAvailableDMUsers,
  createPollMessage
};
