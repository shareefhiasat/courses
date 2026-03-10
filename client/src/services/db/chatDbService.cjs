/**
 * Chat Database Service - MongoDB/Prisma
 *
 * PURPOSE:
 * Handles all database operations for chat using Prisma with MongoDB
 * This is the database layer that directly interacts with MongoDB
 *
 * COLLECTION: chats (via Prisma Chat model)
 *
 * @typedef {import('@types/index').Chat} Chat
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

const { PrismaClient } = require('@prisma/client');
const { logger, logDbOperation } = require('@services/utils/logger');

console.log('[ChatDbService] Initializing Prisma Client...');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

prisma.$connect()
  .then(() => {
    console.log('[ChatDbService] ✅ Prisma connected successfully');
    logger.info('Prisma connected successfully', { service: 'ChatDbService' });
  })
  .catch((err) => {
    console.error('[ChatDbService] ❌ Prisma connection failed:', err);
    logger.error('Prisma connection failed', {
      service: 'ChatDbService',
      error: err.message,
      stack: err.stack
    });
  });

/**
 * Get all chat messages
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getChats = async (options = {}) => {
  const startTime = Date.now();
  try {
    const { senderId, receiverId, classId, type, limitCount = 200 } = options;

    logger.info('Getting chat messages', {
      service: 'ChatDbService',
      operation: 'getChats',
      filters: { senderId, receiverId, classId, type, limitCount }
    });

    const where = {};
    if (senderId) where.senderId = senderId;
    if (receiverId) where.receiverId = receiverId;
    if (classId) where.classId = classId;
    if (type) where.type = type;

    const chats = await prisma.chat.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limitCount,
      include: {
        sender: true,
        receiver: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'chat', where, chats, duration);

    console.log(`[ChatDbService] ✅ Retrieved ${chats.length} chat messages in ${duration}ms`);
    return { success: true, data: chats };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting chat messages', {
      service: 'ChatDbService',
      operation: 'getChats',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    console.error('[ChatDbService] ❌ Error getting chat messages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get chat by ID
 * @param {string} chatId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getChatById = async (chatId) => {
  const startTime = Date.now();
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        sender: true,
        receiver: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findUnique', 'chat', { id: chatId }, chat, duration);

    if (!chat) return { success: false, error: 'Chat message not found' };
    return { success: true, data: chat };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting chat by ID', {
      service: 'ChatDbService',
      operation: 'getChatById',
      chatId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Create chat message
 * @param {Object} chatData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const create = async (chatData) => {
  const startTime = Date.now();
  try {
    const chat = await prisma.chat.create({
      data: {
        ...chatData,
        timestamp: new Date()
      },
      include: {
        sender: true,
        receiver: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('create', 'chat', chatData, chat, duration);

    return { success: true, data: chat };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating chat message', {
      service: 'ChatDbService',
      operation: 'create',
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Update chat message
 * @param {string} chatId
 * @param {Object} updateData
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const update = async (chatId, updateData) => {
  const startTime = Date.now();
  try {
    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: updateData,
      include: {
        sender: true,
        receiver: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('update', 'chat', { id: chatId, ...updateData }, chat, duration);

    return { success: true, data: chat };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating chat message', {
      service: 'ChatDbService',
      operation: 'update',
      chatId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Delete chat message
 * @param {string} chatId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
const deleteChat = async (chatId) => {
  const startTime = Date.now();
  try {
    const chat = await prisma.chat.delete({
      where: { id: chatId }
    });

    const duration = Date.now() - startTime;
    logDbOperation('delete', 'chat', { id: chatId }, chat, duration);

    return { success: true, message: 'Chat message deleted successfully' };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error deleting chat message', {
      service: 'ChatDbService',
      operation: 'deleteChat',
      chatId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get conversation between two users
 * @param {string} userId1
 * @param {string} userId2
 * @param {Object} options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
const getConversation = async (userId1, userId2, options = {}) => {
  const startTime = Date.now();
  try {
    const { limitCount = 100, before } = options;

    const where = {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    };

    if (before) {
      where.timestamp = { lt: new Date(before) };
    }

    const chats = await prisma.chat.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limitCount,
      include: {
        sender: true,
        receiver: true,
        class: true
      }
    });

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'chat', where, chats, duration);

    return { success: true, data: chats.reverse() }; // Reverse to show oldest first
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting conversation', {
      service: 'ChatDbService',
      operation: 'getConversation',
      userId1,
      userId2,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get user chat statistics
 * @param {string} userId
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
const getUserStats = async (userId) => {
  const startTime = Date.now();
  try {
    const sentMessages = await prisma.chat.findMany({
      where: { senderId: userId },
      include: {
        receiver: true,
        class: true
      }
    });

    const receivedMessages = await prisma.chat.findMany({
      where: { receiverId: userId },
      include: {
        sender: true,
        class: true
      }
    });

    // Calculate statistics
    const stats = {
      sent: sentMessages.length,
      received: receivedMessages.length,
      total: sentMessages.length + receivedMessages.length,
      recentConversations: sentMessages
        .concat(receivedMessages)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20),
      topContacts: sentMessages
        .reduce((acc, msg) => {
          const contactId = msg.receiverId;
          acc[contactId] = (acc[contactId] || 0) + 1;
          return acc;
        }, {})
    };

    const duration = Date.now() - startTime;
    logDbOperation('findMany', 'chat', { userId }, sentMessages.concat(receivedMessages), duration);

    return { success: true, data: stats };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error getting user chat statistics', {
      service: 'ChatDbService',
      operation: 'getUserStats',
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message };
  }
};

process.on('SIGINT', async () => {
  console.log('[ChatDbService] 🔄 Shutting down Prisma connection...');
  await prisma.$disconnect();
  console.log('[ChatDbService] ✅ Prisma disconnected');
  process.exit(0);
});

module.exports = {
  getChats,
  getChatById,
  create,
  update,
  deleteChat,
  getConversation,
  getUserStats
};
