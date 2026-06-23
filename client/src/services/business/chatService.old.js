import { info, error, warn, debug } from '@services/utils/logger.js';

const serviceName = 'chatService';

/**
 * Chat Service - Stub Implementation
 * 
 * This is a placeholder implementation. The actual chat functionality
 * should be implemented with proper backend integration.
 */

// User enrollment sync
export const syncUserEnrollment = async (uid, classId) => {
  info(`${serviceName}:syncUserEnrollment`, { uid, classId });
  return { success: true };
};

export const syncUserEnrollments = async (uid, classIds) => {
  info(`${serviceName}:syncUserEnrollments`, { uid, classIds });
  return { success: true };
};

// Message subscriptions
export const subscribeToMessages = (chatType, chatId, callback) => {
  info(`${serviceName}:subscribeToMessages`, { chatType, chatId });
  // Return unsubscribe function
  return () => {};
};

export const subscribeToUserMessageColor = (uid, callback) => {
  info(`${serviceName}:subscribeToUserMessageColor`, { uid });
  return () => {};
};

export const subscribeToUserReadReceipts = (recipients, chatKey, callback) => {
  info(`${serviceName}:subscribeToUserReadReceipts`, { recipients, chatKey });
  return () => {};
};

export const subscribeToUnreadCounts = (chatReads, callback) => {
  info(`${serviceName}:subscribeToUnreadCounts`);
  return () => {};
};

export const subscribeToClassUnreadCounts = (classKey, chatReads, callback) => {
  info(`${serviceName}:subscribeToClassUnreadCounts`, { classKey });
  return () => {};
};

export const subscribeToDMUnreadCounts = (room, chatReads, callback) => {
  info(`${serviceName}:subscribeToDMUnreadCounts`, { room });
  return () => {};
};

export const subscribeToClasses = (callback) => {
  info(`${serviceName}:subscribeToClasses`);
  return () => {};
};

export const subscribeToDirectRooms = (callback) => {
  info(`${serviceName}:subscribeToDirectRooms`);
  return () => {};
};

// Read status
export const updateUserChatReads = async (uid, chatKey) => {
  info(`${serviceName}:updateUserChatReads`, { uid, chatKey });
  return { success: true, timestamp: new Date().toISOString() };
};

export const getUserChatReads = async (uid) => {
  info(`${serviceName}:getUserChatReads`, { uid });
  return {};
};

// Class info
export const getClassName = async (dest) => {
  info(`${serviceName}:getClassName`, { dest });
  return dest;
};

// Polls
export const removePollVote = async (messageId, uid, optionIndex) => {
  info(`${serviceName}:removePollVote`, { messageId, uid, optionIndex });
  return { success: true };
};

export const votePoll = async (messageId, uid, optionIndex) => {
  info(`${serviceName}:votePoll`, { messageId, uid, optionIndex });
  return { success: true };
};

export const createPollMessage = async (pollData) => {
  info(`${serviceName}:createPollMessage`, pollData);
  return { success: true, id: Date.now().toString() };
};

// Reactions
export const removeReaction = async (messageId, uid) => {
  info(`${serviceName}:removeReaction`, { messageId, uid });
  return { success: true };
};

export const addReaction = async (messageId, uid, reaction) => {
  info(`${serviceName}:addReaction`, { messageId, uid, reaction });
  return { success: true };
};

// Export as chatService object for named import
export const chatService = {
  syncUserEnrollment,
  syncUserEnrollments,
  subscribeToMessages,
  subscribeToUserMessageColor,
  subscribeToUserReadReceipts,
  subscribeToUnreadCounts,
  subscribeToClassUnreadCounts,
  subscribeToDMUnreadCounts,
  subscribeToClasses,
  subscribeToDirectRooms,
  updateUserChatReads,
  getUserChatReads,
  getClassName,
  removePollVote,
  votePoll,
  createPollMessage,
  removeReaction,
  addReaction,
};

export default chatService;
