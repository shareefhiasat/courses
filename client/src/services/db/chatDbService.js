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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../other/config';
import logger from '@utils/logger';

/**
 * Get chat room by ID
 * @param {string} roomId - Chat room ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getChatRoom = async (roomId) => {
  try {
    const docSnap = await getDoc(doc(db, 'chatRooms', roomId));
    if (docSnap.exists()) {
      return { success: true, data: { docId: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Chat room not found' };
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
    const docRef = doc(collection(db, 'chatRooms'));
    await setDoc(docRef, {
      ...roomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
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
    await updateDoc(doc(db, 'chatRooms', roomId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
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
    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const rooms = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
    return { success: true, data: rooms };
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
      collection(db, 'chatMessages'),
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
    const docRef = doc(collection(db, 'chatMessages'));
    await setDoc(docRef, {
      ...messageData,
      createdAt: serverTimestamp()
    });
    
    // Update room's last message and timestamp
    await updateChatRoom(messageData.roomId, {
      lastMessage: messageData.content,
      lastMessageBy: messageData.senderName,
      updatedAt: serverTimestamp()
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
    await deleteDoc(doc(db, 'chatMessages', messageId));
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
      collection(db, 'chatMessages'),
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
    const unsubscribe = onSnapshot(doc(db, 'chatRooms', roomId), (snapshot) => {
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
    const docSnap = await getDoc(doc(db, 'users', userId));
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
    await updateDoc(doc(db, 'users', userId), {
      messageColor: color
    });
    return { success: true };
  } catch (error) {
    logger.error('[ChatDbService] Error updating user message color:', error);
    return { success: false, error: error.message };
  }
};
