/**
 * Chat Service - Real PostgreSQL + WebSocket Implementation
 * 
 * Replaces Firebase stubs with actual backend API calls
 */

import { info, error, warn, debug } from '@services/utils/logger.js';
import chatSocket from '@services/realtime/chatSocket.js';
import { apiService as apiClient } from '@services/api/apiService.js';

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

  const deleteHandler = (data) => {
    if (data.roomId === roomId) {
      callback([{ id: data.id, _deleted: true }]);
    }
  };

  const updateHandler = (message) => {
    if (message.roomId === roomId) {
      callback([{ id: message.id, ...message, _updated: true }]);
    }
  };

  messageHandlers.add(handler);
  chatSocket.on('message', handler);
  chatSocket.on('message_deleted', deleteHandler);
  chatSocket.on('message_updated', updateHandler);

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
    chatSocket.off('message_deleted', deleteHandler);
    chatSocket.off('message_updated', updateHandler);
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
        docId: room.classId,
        name: room.class?.nameEn || 'Class',
        nameAr: room.class?.nameAr,
        code: room.class?.code,
        term: room.class?.term || '',
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
    const data = await apiClient.get('/chat/rooms');
    return { success: true, data: data.data || data };
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

    const data = await apiClient.get(`/chat/rooms/${roomId}/messages?${params}`);
    return { success: true, data: data.data || data };
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
    const data = await apiClient.post(`/chat/rooms/${roomId}/messages`, messageData);
    return { success: true, data: data.data || data };
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
    const resp = await apiClient.put(`/chat/messages/${messageId}`, data);
    return { success: true, data: resp.data || resp };
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
    const data = await apiClient.delete(`/chat/messages/${messageId}`);
    return { success: true, data: data.data || data };
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
    const data = await apiClient.post('/chat/dm', { recipientId });
    return { success: true, data: data.data || data };
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
    const data = await apiClient.post(`/chat/messages/${messageId}/reactions`, {
      reactionType,
      remove
    });
    return { success: true, data: data.data || data };
  } catch (err) {
    error(`[${serviceName}] Error toggling reaction:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Toggle star on a message
 * @param {number} messageId - Message ID
 * @returns {Promise<Object>} { success, data }
 */
export const toggleStarMessage = async (messageId) => {
  try {
    const data = await apiClient.post(`/chat/messages/${messageId}/star`);
    return { success: true, data: data.data || data };
  } catch (err) {
    error(`[${serviceName}] Error toggling star:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Toggle pin on a message (group chats only)
 * @param {number} messageId - Message ID
 * @returns {Promise<Object>} { success, data }
 */
export const togglePinMessage = async (messageId) => {
  try {
    const data = await apiClient.post(`/chat/messages/${messageId}/pin`);
    return { success: true, data: data.data || data };
  } catch (err) {
    error(`[${serviceName}] Error toggling pin:`, err);
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
    const data = await apiClient.post(`/chat/messages/${messageId}/vote`, {
      optionIndex
    });
    return { success: true, data: data.data || data };
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
    const data = await apiClient.get('/chat/users');
    return { success: true, data: data.data || data };
  } catch (err) {
    error(`[${serviceName}] Error getting available users:`, err);
    return { success: false, error: err.message, data: [] };
  }
};

/**
 * Leave a group chat room (remove self as participant)
 * @param {number} roomId - Group room ID
 * @param {number} userId - User ID to remove (self)
 * @returns {Promise<Object>} { success }
 */
export const leaveGroupRoom = async (roomId, userId) => {
  try {
    await apiClient.delete(`/chat/rooms/${roomId}/participants/${userId}`);
    return { success: true };
  } catch (err) {
    error(`[${serviceName}] Error leaving group:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Update group chat name (creator only)
 * @param {number} roomId - Group room ID
 * @param {string} name - New group name
 * @returns {Promise<Object>} { success, data }
 */
export const updateGroupRoom = async (roomId, name) => {
  try {
    const data = await apiClient.patch(`/chat/rooms/${roomId}`, { name });
    return { success: true, data: data.data || data };
  } catch (err) {
    error(`[${serviceName}] Error updating group:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Get group chat room stats (messages, media, documents, links)
 * @param {number} roomId - Group room ID
 * @returns {Promise<Object>} { success, data }
 */
export const getRoomStats = async (roomId) => {
  try {
    const data = await apiClient.get(`/chat/rooms/${roomId}/stats`);
    return { success: true, data: data.data || data };
  } catch (err) {
    error(`[${serviceName}] Error getting room stats:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Assign a new admin for a group chat (transfer creator role)
 * @param {number} roomId - Group room ID
 * @param {number} newAdminId - User ID of the new admin
 * @returns {Promise<Object>} { success, data }
 */
export const assignGroupAdmin = async (roomId, newAdminId) => {
  try {
    const data = await apiClient.patch(`/chat/rooms/${roomId}/assign-admin`, { newAdminId });
    return { success: true, data: data.data || data };
  } catch (err) {
    error(`[${serviceName}] Error assigning admin:`, err);
    return { success: false, error: err.message };
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

// ============================================================================
// COMPATIBILITY LAYER — Maps old Firebase-style API to new PostgreSQL API
// ============================================================================
// The old ChatPage.jsx calls chatService with Firebase-style signatures:
//   chatService.subscribeToMessages(chatType, chatId, callback)
//   chatService.sendMessage(messageData)  — single object with chatType/classId
//   chatService.subscribeToClasses(callback) — callback receives [{docId, name}]
//   etc.
//
// This wrapper translates those calls to the new REST API above.

// Cache room lookups to avoid redundant API calls
const roomCache = new Map(); // chatKey -> roomId
const roomCachePromise = new Map(); // chatKey -> Promise<roomId>

/**
 * Resolve a chatType + chatId to a numeric room ID via the backend
 */
export const resolveRoomId = async (chatType, chatId) => {
  const cacheKey = `${chatType}:${chatId}`;
  if (roomCache.has(cacheKey)) return roomCache.get(cacheKey);

  if (chatType === 'global' || chatId === 'global' || (chatType === 'global' && !chatId)) {
    // Find the global room
    const result = await getUserRooms();
    if (result.success) {
      const globalRoom = result.data.find(r => r.type === 'global');
      if (globalRoom) {
        roomCache.set(cacheKey, globalRoom.id);
        return globalRoom.id;
      }
    }
    return null;
  }

  if (chatType === 'class') {
    const result = await getUserRooms();
    if (result.success) {
      const classRoom = result.data.find(r => r.type === 'class' && r.classId == chatId);
      if (classRoom) {
        roomCache.set(cacheKey, classRoom.id);
        return classRoom.id;
      }
    }
    return null;
  }

  if (chatType === 'dm') {
    // chatId is the room ID for DMs
    const roomId = parseInt(chatId);
    roomCache.set(cacheKey, roomId);
    return roomId;
  }

  if (chatType === 'group') {
    // chatId is the room ID for groups
    const roomId = parseInt(chatId);
    roomCache.set(cacheKey, roomId);
    return roomId;
  }

  return null;
};

/**
 * Wrap a message object in a Firebase-style doc
 */
const wrapDoc = (msg) => {
  // Normalize createdAt: handle string, Date, or already-wrapped object
  const rawCreatedAt = msg.createdAt;
  const createdAtDate = rawCreatedAt instanceof Date
    ? rawCreatedAt
    : typeof rawCreatedAt === 'string' || typeof rawCreatedAt === 'number'
      ? new Date(rawCreatedAt)
      : rawCreatedAt?.toDate?.() || new Date();

  return ({
    id: String(msg.id),
    data: () => ({
      id: msg.id,
      text: msg.content,
      content: msg.content,
      senderId: msg.senderId,
      sender: msg.senderId,
      userId: msg.senderId,
      type: msg.type,
      messageType: msg.type,
      createdAt: {
        toDate: () => createdAtDate,
        toMillis: () => createdAtDate.getTime(),
        seconds: Math.floor(createdAtDate.getTime() / 1000),
        nanoseconds: 0
      },
    timestamp: msg.createdAt,
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    fileType: msg.fileType,
    filePath: msg.filePath,
    voiceUrl: msg.fileUrl,
    voicePath: msg.filePath,
    pollOptions: msg.pollOptions,
    pollVotes: msg.pollOptions ? Object.fromEntries(msg.pollOptions.map((o, i) => [i, o?.votes || []])) : undefined,
    reactions: msg.reactions || {},
    isEdited: msg.isEdited,
    isDeleted: msg.isDeleted,
    replyTo: msg.replyToId,
    roomId: msg.roomId,
    senderInfo: msg.sender,
    starredBy: msg.starredBy || [],
    pinnedById: msg.pinnedById ?? null
  })
  });
};

/**
 * COMPAT: Subscribe to messages (Firebase-style)
 * @param {string} chatType - 'global', 'class', 'dm'
 * @param {string} chatId - class ID, 'global', or DM room ID
 * @param {Function} callback - Receives array of docs [{id, data: () => {...}}]
 * @returns {Function} Unsubscribe function
 */
const compatSubscribeToMessages = (chatType, chatId, callback) => {
  let unsubscribed = false;
  let socketUnsub = null;
  let allDocs = [];

  (async () => {
    const roomId = await resolveRoomId(chatType, chatId);
    if (unsubscribed || !roomId) return;

    // Initial load
    const result = await getRoomMessages(roomId, { limit: 100 });
    if (unsubscribed) return;

    if (result.success) {
      allDocs = result.data.map(wrapDoc);
      callback(allDocs);
    }

    // Listen for real-time messages via WebSocket
    socketUnsub = chatSocket.on('message', (message) => {
      if (message.roomId === roomId) {
        const newDoc = wrapDoc(message);
        // Avoid duplicates
        if (!allDocs.find(d => d.id === newDoc.id)) {
          allDocs = [...allDocs, newDoc];
        }
        callback(allDocs);
      }
    });

    // Listen for message deletions
    const delUnsub = chatSocket.on('message_deleted', (data) => {
      const deletedId = String(data.id || data.messageId);
      allDocs = allDocs.filter(d => d.id !== deletedId);
      callback(allDocs);
    });

    // Listen for message edits/updates
    const editUnsub = chatSocket.on('message_updated', (data) => {
      const updatedId = String(data.id || data.messageId);
      allDocs = allDocs.map(d => {
        if (d.id !== updatedId) return d;
        const updated = wrapDoc({ ...d.data(), ...data });
        return updated;
      });
      callback(allDocs);
    });

    // Also listen for reaction updates
    const reactionUnsub = chatSocket.on('reaction', (data) => {
      const msgId = String(data.messageId || data.id);
      allDocs = allDocs.map(d => {
        if (d.id !== msgId) return d;
        const existing = d.data();
        return wrapDoc({ ...existing, reactions: data.reactions || existing.reactions });
      });
      callback(allDocs);
    });

    // Listen for poll vote updates
    const pollVoteUnsub = chatSocket.on('poll_vote', (data) => {
      const msgId = String(data.id || data.messageId);
      allDocs = allDocs.map(d => {
        if (d.id !== msgId) return d;
        const existing = d.data();
        return wrapDoc({ ...existing, ...data, pollVotes: data.pollVotes || existing.pollVotes, pollOptions: data.pollOptions || existing.pollOptions });
      });
      callback(allDocs);
    });
  })();

  return () => {
    unsubscribed = true;
    if (socketUnsub) socketUnsub();
    if (delUnsub) delUnsub();
    if (editUnsub) editUnsub();
    if (reactionUnsub) reactionUnsub();
    if (pollVoteUnsub) pollVoteUnsub();
  };
};

/**
 * COMPAT: Subscribe to classes (Firebase-style)
 * @param {Function} callback - Receives array of class objects [{docId, name, ...}]
 * @returns {Function} Unsubscribe function
 */
const compatSubscribeToClasses = (callback, seeAll = false, uid = null, classIds = null) => {
  let unsubscribed = false;

  (async () => {
    // If classIds are provided (from frontend's own API calls), use those directly
    if (classIds && classIds.size > 0) {
      const result = await getUserRooms();
      if (unsubscribed) return;

      // Build a map of classId -> roomId from chat rooms
      const roomMap = new Map();
      if (result.success) {
        result.data.filter(r => r.type === 'class').forEach(room => {
          roomMap.set(String(room.classId), room);
        });
      }

      // Return classes based on the provided IDs
      const classes = Array.from(classIds).map(classId => {
        const room = roomMap.get(String(classId));
        return {
          docId: String(classId),
          id: String(classId),
          name: room?.class?.nameEn || `Class ${classId}`,
          nameAr: room?.class?.nameAr,
          code: room?.class?.code,
          term: room?.class?.term || '',
          roomId: room?.id,
          enrollmentCount: room?.class?._count?.enrollments ?? 0
        };
      });
      callback(classes);
      return;
    }

    // Fallback: get classes from chat rooms
    const result = await getUserRooms();
    if (unsubscribed) return;

    if (result.success) {
      const classRooms = result.data.filter(r => r.type === 'class');
      const classes = classRooms.map(room => ({
        docId: String(room.classId),
        id: String(room.classId),
        name: room.class?.nameEn || 'Class',
        nameAr: room.class?.nameAr,
        code: room.class?.code,
        term: room.class?.term || '',
        roomId: room.id,
        enrollmentCount: room.class?._count?.enrollments ?? 0
      }));
      callback(classes);
    }
  })();

  return () => { unsubscribed = true; };
};

/**
 * COMPAT: Subscribe to DM rooms (Firebase-style)
 * @param {Function} callback - Receives Firebase-style snapshot with .forEach
 * @returns {Function} Unsubscribe function
 */
const compatSubscribeToDirectRooms = (callback) => {
  let unsubscribed = false;

  const emitRooms = (rooms) => {
    // Wrap in Firebase-style snapshot
    const snapshot = {
      forEach: (cb) => rooms.forEach(room => {
        const isGroup = room.type === 'group';
        const data = isGroup ? {
          id: room.id,
          type: 'group',
          name: room.name,
          createdBy: room.createdBy,
          participants: room.participants,
          creator: room.creator,
          roomId: room.id,
          lastMessage: null,
          createdAt: room.createdAt
        } : {
          id: room.id,
          participants: [room.participantA, room.participantB],
          participantA: room.participantA,
          participantB: room.participantB,
          userA: room.userA,
          userB: room.userB,
          type: 'dm',
          roomId: room.id,
          lastMessage: null,
          createdAt: room.createdAt
        };
        cb({ id: String(room.id), data: () => data });
      })
    };
    callback(snapshot);
  };

  (async () => {
    const result = await getUserRooms();
    if (unsubscribed) return;

    if (result.success) {
      const dmAndGroupRooms = result.data.filter(r => r.type === 'dm' || r.type === 'group');
      emitRooms(dmAndGroupRooms);
    }
  })();

  return () => { unsubscribed = true; };
};

/**
 * COMPAT: Send message (Firebase-style single object)
 * @param {Object} messageData - { text, chatType, classId, roomId, messageType, ... }
 * @returns {Promise<Object>}
 */
const compatSendMessage = async (messageData) => {
  const chatType = messageData.chatType || messageData.type || 'class';
  const chatId = messageData.classId || messageData.roomId || messageData.chatId;
  
  const roomId = await resolveRoomId(chatType, chatId);
  if (!roomId) {
    error('[chatService] Could not resolve room for sendMessage');
    return { success: false, error: 'Room not found' };
  }

  const payload = {
    type: messageData.messageType || messageData.type || 'text',
    content: messageData.text || messageData.content,
    fileUrl: messageData.fileUrl || messageData.voiceUrl,
    filePath: messageData.filePath || messageData.voicePath,
    fileName: messageData.fileName,
    fileType: messageData.fileType,
    fileSize: messageData.fileSize,
    pollOptions: messageData.pollOptions,
    replyToId: messageData.replyTo
  };

  const result = await sendMessage(roomId, payload);
  if (result.success && result.data) {
    const doc = wrapDoc(result.data);
    return { id: doc.id, ...doc.data(), success: true };
  }
  return result;
};

/**
 * COMPAT: Create DM room (Firebase-style)
 * @param {string} userUid - Current user UID
 * @param {string} otherUserId - Other user ID
 * @returns {Promise<string>} Room ID
 */
const compatCreateDMRoom = async (userUid, otherUserId) => {
  const numericId = typeof otherUserId === 'number' ? otherUserId : parseInt(otherUserId, 10);
  if (!numericId || isNaN(numericId)) {
    throw new Error('Invalid recipient ID: expected numeric DB user ID');
  }
  const result = await createDM(numericId);
  if (result.success) {
    return String(result.data.id);
  }
  throw new Error(result.error || 'Failed to create DM');
};

/**
 * COMPAT: Edit message (Firebase-style)
 * @param {string} messageId - Message ID
 * @param {string} content - New content
 * @returns {Promise<Object>}
 */
const compatEditMessage = async (messageId, content) => {
  return updateMessage(parseInt(messageId), { content });
};

/**
 * COMPAT: Delete message (Firebase-style)
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>}
 */
const compatDeleteMessage = async (messageId) => {
  return deleteMessage(parseInt(messageId));
};

/**
 * COMPAT: Add reaction (Firebase-style)
 * @param {string} messageId - Message ID
 * @param {string} userUid - User UID
 * @param {string} reaction - Reaction type
 * @returns {Promise<Object>}
 */
const compatAddReaction = async (messageId, userUid, reaction) => {
  return toggleReaction(parseInt(messageId), reaction, false);
};

/**
 * COMPAT: Remove reaction (Firebase-style)
 * @param {string} messageId - Message ID
 * @param {string} userUid - User UID
 * @returns {Promise<Object>}
 */
const compatRemoveReaction = async (messageId, userUid) => {
  return toggleReaction(parseInt(messageId), 'remove', true);
};

/**
 * COMPAT: Vote poll (Firebase-style)
 * @param {string} messageId - Message ID
 * @param {string} userUid - User UID
 * @param {number} optionIndex - Option index
 * @returns {Promise<Object>}
 */
const compatVotePoll = async (messageId, userUid, optionIndex) => {
  return votePoll(parseInt(messageId), optionIndex);
};

/**
 * COMPAT: Remove poll vote (Firebase-style)
 */
const compatRemovePollVote = async (messageId, userUid, optionIndex) => {
  // Our API toggles, so removing a vote = voting again (toggle off)
  // For simplicity, we just call votePoll which will remove if already voted
  return votePoll(parseInt(messageId), optionIndex);
};

/**
 * COMPAT: Create poll message (Firebase-style)
 * @param {Object} pollData - { chatType, classId, roomId, pollQuestion, pollOptions, ... }
 * @returns {Promise<Object>}
 */
const compatCreatePollMessage = async (pollData) => {
  const chatType = pollData.chatType || pollData.type || 'class';
  const chatId = pollData.classId || pollData.roomId || pollData.chatId;
  
  const roomId = await resolveRoomId(chatType, chatId);
  if (!roomId) {
    error('[chatService] Could not resolve room for poll');
    return { success: false, error: 'Room not found' };
  }

  const options = (pollData.pollOptions || []).map(text => ({ text, votes: [] }));
  return sendMessage(roomId, {
    type: 'poll',
    content: pollData.pollQuestion || pollData.question,
    pollOptions: options
  });
};

/**
 * COMPAT: Get class name
 * @param {string} classId - Class ID
 * @returns {Promise<string>} Class name
 */
const compatGetClassName = async (classId) => {
  const result = await getUserRooms();
  if (result.success) {
    const room = result.data.find(r => r.type === 'class' && String(r.classId) === String(classId));
    if (room && room.class) {
      return room.class.nameEn || room.class.nameAr;
    }
  }
  return null;
};

/**
 * COMPAT: Sync user enrollment (no-op, handled by backend)
 */
const compatSyncUserEnrollment = async (userUid, classId) => {
  return { success: true };
};

/**
 * COMPAT: Sync user enrollments (no-op, handled by backend)
 */
const compatSyncUserEnrollments = async (userUid, ids) => {
  return { success: true };
};

/**
 * COMPAT: Update user chat reads (stub - returns current timestamp)
 */
const compatUpdateUserChatReads = async (userUid, chatKey) => {
  return new Date().toISOString();
};

/**
 * COMPAT: Get user chat reads (stub)
 */
const compatGetUserChatReads = async (userUid) => {
  return {};
};

/**
 * COMPAT: Subscribe to unread counts (stub - returns 0)
 */
const compatSubscribeToUnreadCounts = (chatReads, callback) => {
  return () => {};
};

/**
 * COMPAT: Subscribe to class unread counts (stub)
 */
const compatSubscribeToClassUnreadCounts = (classKey, chatReads, callback) => {
  return () => {};
};

/**
 * COMPAT: Subscribe to DM unread counts (stub)
 */
const compatSubscribeToDMUnreadCounts = (room, chatReads, callback) => {
  return () => {};
};

/**
 * COMPAT: Subscribe to user message color (stub)
 */
const compatSubscribeToUserMessageColor = (userUid, callback) => {
  return () => {};
};

/**
 * COMPAT: Subscribe to user read receipts (stub)
 */
const compatSubscribeToUserReadReceiptsCompat = (recips, key, callback) => {
  return () => {};
};

/**
 * COMPAT: Toggle star room (localStorage-based)
 */
const compatToggleStarRoom = async (roomId, userUid) => {
  try {
    const key = `chat_starred_${userUid}`;
    const starred = JSON.parse(localStorage.getItem(key) || '[]');
    const idStr = String(roomId);
    const idx = starred.indexOf(idStr);
    if (idx >= 0) {
      starred.splice(idx, 1);
    } else {
      starred.push(idStr);
    }
    localStorage.setItem(key, JSON.stringify(starred));
    return { success: true, starred };
  } catch {
    return { success: false };
  }
};

/**
 * COMPAT: Clear chat messages (stub)
 */
const compatClearChatMessages = async (roomId, mode, userUid) => {
  return 0;
};

/**
 * COMPAT: Delete direct room (stub)
 */
const compatDeleteDirectRoom = async (roomId) => {
  return { success: true };
};

/**
 * COMPAT: Update last message after deletion (stub)
 */
const compatUpdateLastMessageAfterDeletion = async (msg) => {
  return { success: true };
};

// Named export for backward compatibility with ChatPage.jsx imports
export const chatService = {
  // New API
  initializeChatService,
  disconnectChatService,
  getUserRooms,
  getRoomMessages,
  sendMessage: compatSendMessage,
  updateMessage,
  deleteMessage: compatDeleteMessage,
  createDM,
  toggleReaction,
  toggleStarMessage,
  togglePinMessage,
  votePoll,
  getAvailableDMUsers,
  leaveGroupRoom,
  updateGroupRoom,
  getRoomStats,
  assignGroupAdmin,
  resolveRoomId,
  // Compatibility API (Firebase-style)
  subscribeToMessages: compatSubscribeToMessages,
  subscribeToClasses: compatSubscribeToClasses,
  subscribeToDirectRooms: compatSubscribeToDirectRooms,
  subscribeToUserReadReceipts: compatSubscribeToUserReadReceiptsCompat,
  subscribeToUnreadCounts: compatSubscribeToUnreadCounts,
  subscribeToClassUnreadCounts: compatSubscribeToClassUnreadCounts,
  subscribeToDMUnreadCounts: compatSubscribeToDMUnreadCounts,
  subscribeToUserMessageColor: compatSubscribeToUserMessageColor,
  updateUserChatReads: compatUpdateUserChatReads,
  getUserChatReads: compatGetUserChatReads,
  syncUserEnrollment: compatSyncUserEnrollment,
  syncUserEnrollments: compatSyncUserEnrollments,
  sendMessageDirect: sendMessage,
  editMessage: compatEditMessage,
  createDMRoom: compatCreateDMRoom,
  addReaction: compatAddReaction,
  removeReaction: compatRemoveReaction,
  votePoll: compatVotePoll,
  removePollVote: compatRemovePollVote,
  createPollMessage: compatCreatePollMessage,
  getClassName: compatGetClassName,
  toggleStarRoom: compatToggleStarRoom,
  clearChatMessages: compatClearChatMessages,
  deleteDirectRoom: compatDeleteDirectRoom,
  updateLastMessageAfterDeletion: compatUpdateLastMessageAfterDeletion
};

export default chatService;
