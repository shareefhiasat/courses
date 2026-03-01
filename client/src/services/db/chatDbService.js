/**
 * Chat Database Service
 * 
 * PURPOSE:
 * Direct Firestore operations for chat records. This is the database layer
 * and should NOT contain business logic.
 * 
 * COLLECTIONS: 'chats', 'chatMessages', 'chatRooms'
 * 
 * @typedef {import('@types/index').Chat} Chat
 * @typedef {import('@types/index').ChatMessage} ChatMessage
 * @typedef {import('@types/index').ServiceResponse} ServiceResponse
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  deleteField,
  arrayUnion,
  arrayRemove,
  addDoc
} from 'firebase/firestore';
import dbService from '@services/other/dbService';
import { getQatarTimestampString } from '@utils/qatarDate';
import logger from '@utils/logger';
import { COLLECTIONS } from '@constants/collections';

/**
 * Get chat room by ID
 * @param {string} roomId - Chat room ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getChatRoom = async (roomId) => {
  try {
    const result = await dbService.getById(COLLECTIONS.CHAT_ROOMS, roomId);
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error getting chat room:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create chat room
 * @param {Object} roomData - Chat room data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createChatRoom = async (roomData) => {
  try {
    const now = getQatarTimestampString();
    const result = await dbService.add(COLLECTIONS.CHAT_ROOMS, {
      ...roomData,
      createdAt: now,
      updatedAt: now
    });
    
    if (result.success) {
      return { success: true, id: result.data.id };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('[ChatDbService] Error creating chat room:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update chat room
 * @param {string} roomId - Chat room ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateChatRoom = async (roomId, updateData) => {
  try {
    const result = await dbService.update(COLLECTIONS.CHAT_ROOMS, roomId, {
      ...updateData,
      updatedAt: getQatarTimestampString()
    });
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error updating chat room:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get chat rooms by user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getChatRoomsByUser = async (userId) => {
  try {
    const result = await dbService.getAll(COLLECTIONS.CHAT_ROOMS, {
      where: {
        field: 'participants',
        operator: 'array-contains',
        value: userId
      },
      orderBy: {
        field: 'updatedAt',
        direction: 'desc'
      }
    });
    
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error getting chat rooms by user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get chat messages for room
 * @param {string} roomId - Chat room ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getChatMessages = async (roomId, options = {}) => {
  try {
    const { limitCount = 50, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES),
      where('roomId', '==', roomId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: messages };
  } catch (error) {
    logger.error('[ChatDbService] Error getting chat messages:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send chat message
 * @param {Object} messageData - Message data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const sendChatMessage = async (messageData) => {
  try {
    const docRef = doc(collection(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES));
    const now = getQatarTimestampString();
    await setDoc(docRef, {
      ...messageData,
      createdAt: now
    });
    
    // Update room's last message and timestamp
    await updateChatRoom(messageData.roomId, {
      lastMessage: messageData.content,
      lastMessageBy: messageData.senderName,
      updatedAt: now
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('[ChatDbService] Error sending chat message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete chat message
 * @param {string} messageId - Message ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteChatMessage = async (messageId) => {
  try {
    await deleteDoc(doc(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES, messageId));
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error deleting chat message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to chat messages
 * @param {string} roomId - Chat room ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToChatMessages = (roomId, callback) => {
  try {
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES),
      where('roomId', '==', roomId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      callback(messages);
    });
    
    return unsubscribe;
  } catch (error) {
    logger.error('[ChatDbService] Error setting up message subscription:', error);
    return () => {};
  }
};

/**
 * Subscribe to chat room updates
 * @param {string} roomId - Chat room ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToChatRoom = (roomId, callback) => {
  try {
    const unsubscribe = onSnapshot(doc(dbService.getDb(), COLLECTIONS.CHAT_ROOMS, roomId), (snapshot) => {
      if (snapshot.exists()) {
        callback({ docId: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
    
    return unsubscribe;
  } catch (error) {
    logger.error('[ChatDbService] Error setting up room subscription:', error);
    return () => {};
  }
};

/**
 * Get user's message color
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export const getUserMessageColor = async (userId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.USERS, userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { success: true, data: data.messageColor };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    logger.error('[ChatDbService] Error getting user message color:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user's message color
 * @param {string} userId - User ID
 * @param {string} color - Message color
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserMessageColor = async (userId, color) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.USERS, userId), {
      messageColor: color
    });
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating user message color:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to user message color changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserMessageColor = (userId, callback) => {
  try {
    const unsubscribe = onSnapshot(doc(dbService.getDb(), COLLECTIONS.USERS, userId), (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      callback(data.messageColor);
    });
    return unsubscribe;
  } catch (error) {
    logger.error('[ChatDbService] Error subscribing to user message color:', error);
    return () => {};
  }
};

/**
 * Update chat message
 * @param {string} messageId - Message ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateChatMessage = async (messageId, updateData) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES, messageId), updateData);
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating chat message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get chat message by ID
 * @param {string} messageId - Message ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getChatMessage = async (messageId) => {
  try {
    const docSnap = await getDoc(doc(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES, messageId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Message not found' };
  } catch (error) {
    logger.error('[ChatDbService] Error getting chat message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to user document for read receipts
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserForReadReceipts = (userId, callback) => {
  try {
    const unsubscribe = onSnapshot(doc(dbService.getDb(), COLLECTIONS.USERS, userId), (snapshot) => {
      const data = snapshot.data() || {};
      callback(data);
    });
    return unsubscribe;
  } catch (error) {
    logger.error('[ChatDbService] Error subscribing to user for read receipts:', error);
    return () => {};
  }
};

/**
 * Query messages by class ID
 * @param {string} classId - Class ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getMessagesByClassId = async (classId, options = {}) => {
  try {
    const { limitCount = 1, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES),
      where('classId', '==', classId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: messages };
  } catch (error) {
    logger.error('[ChatDbService] Error getting messages by class ID:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Query messages by room ID (DM)
 * @param {string} roomId - Room ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getMessagesByRoomId = async (roomId, options = {}) => {
  try {
    const { limitCount = 1, orderByField = 'createdAt', orderDirection = 'desc' } = options;
    const q = query(
      collection(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES),
      where('type', '==', 'dm'),
      where('roomId', '==', roomId),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: messages };
  } catch (error) {
    logger.error('[ChatDbService] Error getting messages by room ID:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Update class document
 * @param {string} classId - Class ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateClassDocument = async (classId, updateData) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.CLASSES, classId), updateData);
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating class document:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update direct room document
 * @param {string} roomId - Room ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateDirectRoomDocument = async (roomId, updateData) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.DIRECT_ROOMS, roomId), updateData);
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating direct room document:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update message reaction
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {string} reaction - Reaction
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateMessageReaction = async (messageId, userId, reaction) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES, messageId), { 
      [`reactions.${userId}`]: reaction 
    });
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating message reaction:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove message reaction
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeMessageReaction = async (messageId, userId) => {
  try {
    const result = await dbService.update('chatMessages', messageId, { 
      [`reactions.${userId}`]: deleteField() 
    });
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error removing message reaction:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get direct room by ID
 * @param {string} roomId - Room ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getDirectRoom = async (roomId) => {
  try {
    const result = await dbService.getById('directRooms', roomId);
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error getting direct room:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update direct room
 * @param {string} roomId - Room ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateDirectRoom = async (roomId, updateData) => {
  try {
    const result = await dbService.update('directRooms', roomId, updateData);
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error updating direct room:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete direct room
 * @param {string} roomId - Room ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteDirectRoom = async (roomId) => {
  try {
    const result = await dbService.delete('directRooms', roomId);
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error deleting direct room:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get class by ID
 * @param {string} classId - Class ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getClass = async (classId) => {
  try {
    const result = await dbService.getById('classes', classId);
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error getting class:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to classes collection
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToClasses = (callback) => {
  try {
    const classesRef = dbService.getCollectionRef('classes');
    const unsubscribe = onSnapshot(classesRef, (snapshot) => {
      const classes = [];
      snapshot.forEach(doc => {
        classes.push({ docId: doc.id, ...doc.data() });
      });
      callback(classes);
    });
    return unsubscribe;
  } catch (error) {
    logger.error('[ChatDbService] Error subscribing to classes:', error);
    return () => {};
  }
};

/**
 * Subscribe to messages collection
 * @param {Object} queryConstraints - Query constraints
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMessagesWithQuery = (queryConstraints, callback) => {
  try {
    const messagesRef = dbService.getCollectionRef('chatMessages');
    const q = query(messagesRef, ...queryConstraints);
    const unsubscribe = onSnapshot(q, callback);
    return unsubscribe;
  } catch (error) {
    logger.error('[ChatDbService] Error subscribing to messages with query:', error);
    return () => {};
  }
};

/**
 * Create message
 * @param {Object} messageData - Message data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createMessage = async (messageData) => {
  try {
    const result = await dbService.add('chatMessages', {
      ...messageData,
      createdAt: getQatarTimestampString()
    });
    
    if (result.success) {
      return { success: true, id: result.data.id };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('[ChatDbService] Error creating message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create direct room
 * @param {string} roomId - Room ID
 * @param {Object} roomData - Room data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const createDirectRoom = async (roomId, roomData) => {
  try {
    const result = await dbService.set('directRooms', roomId, roomData);
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error creating direct room:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user document
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserDocument = async (userId, updateData) => {
  try {
    const result = await dbService.update('users', userId, updateData);
    return result;
  } catch (error) {
    logger.error('[ChatDbService] Error updating user document:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get messages by query
 * @param {Array} queryConstraints - Query constraints
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getMessagesByQuery = async (queryConstraints) => {
  try {
    const messagesRef = dbService.getCollectionRef('chatMessages');
    const q = query(messagesRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: messages };
  } catch (error) {
    logger.error('[ChatDbService] Error getting messages by query:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Delete messages by query
 * @param {Array} queryConstraints - Query constraints
 * @returns {Promise<{success: boolean, deletedCount: number, error?: string}>}
 */
export const deleteMessagesByQuery = async (queryConstraints) => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES), ...queryConstraints);
    const querySnapshot = await getDocs(q);
    let deletedCount = 0;
    
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(doc(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES, docSnap.id));
      deletedCount++;
    }
    
    return { success: true, deletedCount };
  } catch (error) {
    logger.error('[ChatDbService] Error deleting messages by query:', error);
    return { success: false, deletedCount: 0, error: error.message };
  }
};

/**
 * Get enrollments by user ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export const getEnrollmentsByUserId = async (userId) => {
  try {
    const q = query(collection(dbService.getDb(), COLLECTIONS.ENROLLMENTS), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const enrollments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: enrollments };
  } catch (error) {
    logger.error('[ChatDbService] Error getting enrollments by user ID:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Update message with poll vote
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {number} optionIndex - Option index
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updatePollVote = async (messageId, userId, optionIndex) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES, messageId), {
      [`pollVotes.${optionIndex}`]: arrayUnion(userId)
    });
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating poll vote:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove poll vote
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {number} optionIndex - Option index
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removePollVote = async (messageId, userId, optionIndex) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES, messageId), {
      [`pollVotes.${optionIndex}`]: arrayRemove(userId)
    });
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error removing poll vote:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update direct room with star toggle
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID
 * @param {boolean} add - Whether to add or remove user from starBy
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateRoomStar = async (roomId, userId, add = true) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.DIRECT_ROOMS, roomId), {
      starBy: add ? arrayUnion(userId) : arrayRemove(userId)
    });
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating room star:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user enrolled classes
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @param {boolean} add - Whether to add or remove class
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserEnrolledClasses = async (userId, classId, add = true) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.USERS, userId), { 
      enrolledClasses: add ? arrayUnion(classId) : arrayRemove(classId) 
    });
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating user enrolled classes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update message with poll vote using arrayUnion
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {number} optionIndex - Option index
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const addPollVote = async (messageId, userId, optionIndex) => {
  try {
    await updateDoc(doc(dbService.getDb(), COLLECTIONS.CHAT_MESSAGES, messageId), {
      [`pollVotes.${optionIndex}`]: arrayUnion(userId)
    });
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error adding poll vote:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to direct rooms collection
 * @param {Function} callback - Callback with snapshot
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDirectRooms = (callback) => {
  try {
    const roomsRef = collection(dbService.getDb(), COLLECTIONS.DIRECT_ROOMS);
    return onSnapshot(roomsRef, callback);
  } catch (error) {
    logger.error('[ChatDbService] Error subscribing to direct rooms:', error);
    return () => {};
  }
};

// Query constraint helpers for business service
export const createWhereConstraint = (field, operator, value) => where(field, operator, value);
export const createOrderByConstraint = (field, direction = 'asc') => orderBy(field, direction);
export const createQueryConstraints = (constraints) => constraints;
