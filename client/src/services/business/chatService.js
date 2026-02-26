import logger from '@utils/logger';
import { where, orderBy } from 'firebase/firestore';
import { 
  getChatRoom as getChatRoomFromDb,
  createChatRoom as createChatRoomToDb,
  updateChatRoom as updateChatRoomInDb,
  getChatRoomsByUser as getChatRoomsByUserFromDb,
  getChatMessages as getChatMessagesFromDb,
  sendChatMessage as sendChatMessageToDb,
  deleteChatMessage as deleteChatMessageFromDb,
  subscribeToChatMessages as subscribeToChatMessagesFromDb,
  subscribeToChatRoom as subscribeToChatRoomFromDb,
  getUserMessageColor as getUserMessageColorFromDb,
  updateUserMessageColor as updateUserMessageColorInDb,
  subscribeToUserMessageColor as subscribeToUserMessageColorFromDb,
  updateChatMessage as updateChatMessageFromDb,
  getChatMessage as getChatMessageFromDb,
  subscribeToUserForReadReceipts as subscribeToUserForReadReceiptsFromDb,
  getMessagesByClassId as getMessagesByClassIdFromDb,
  getMessagesByRoomId as getMessagesByRoomIdFromDb,
  updateClassDocument as updateClassDocumentFromDb,
  updateDirectRoomDocument as updateDirectRoomDocumentFromDb,
  updateMessageReaction as updateMessageReactionFromDb,
  removeMessageReaction as removeMessageReactionFromDb,
  getDirectRoom as getDirectRoomFromDb,
  updateDirectRoom as updateDirectRoomFromDb,
  deleteDirectRoom as deleteDirectRoomFromDb,
  getClass as getClassFromDb,
  subscribeToClasses as subscribeToClassesFromDb,
  subscribeToMessagesWithQuery as subscribeToMessagesWithQueryFromDb,
  createMessage as createMessageFromDb,
  createDirectRoom as createDirectRoomFromDb,
  updateUserDocument as updateUserDocumentFromDb,
  getMessagesByQuery as getMessagesByQueryFromDb,
  deleteMessagesByQuery as deleteMessagesByQueryFromDb,
  getEnrollmentsByUserId as getEnrollmentsByUserIdFromDb,
  updatePollVote as updatePollVoteFromDb,
  removePollVote as removePollVoteFromDb,
  updateRoomStar as updateRoomStarFromDb,
  updateUserEnrolledClasses as updateUserEnrolledClassesFromDb,
  addPollVote as addPollVoteFromDb,
  subscribeToDirectRooms as subscribeToDirectRoomsFromDb
} from '../db/chatDbService';

// Chat Service - Centralized chat operations
export const chatService = {
  // User operations
  async getUserMessageColor(userId) {
    try {
      const result = await getUserMessageColorFromDb(userId);
      return result.success ? result.data : null;
    } catch (error) {
      logger.error('Error getting user message color:', error);
      return null;
    }
  },

  subscribeToUserMessageColor(userId, callback) {
    return subscribeToUserMessageColorFromDb(userId, callback);
  },

  async getUserChatReads(userId) {
    try {
      // Use user service to get user data
      const { getUserById } = await import('./userService');
      const result = await getUserById(userId);
      const data = result.success && result.data ? result.data : {};
      return data.chatReads || {};
    } catch (error) {
      logger.error('Error getting user chat reads:', error);
      return {};
    }
  },

  async updateUserChatReads(userId, chatKey) {
    try {
      // Use user service to update user data
      const { updateUser } = await import('./userService');
      const result = await updateUser(userId, { 
        chatReads: { 
          [chatKey]: new Date().toISOString()
        } 
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return new Date();
    } catch (error) {
      logger.error('Error updating user chat reads:', error);
      // Don't log activity here to avoid circular dependency and user ID issues
      throw error;
    }
  },

  subscribeToUserReadReceipts(userIds, chatKey, callback) {
    const unsubscribers = [];
    
    userIds.forEach(uid => {
      const unsub = subscribeToUserForReadReceiptsFromDb(uid, (data) => {
        const readAt = data.chatReads?.[chatKey];
        const date = readAt?.toDate?.() || 
                    (typeof readAt === 'string' ? new Date(readAt) : 
                    (readAt?.seconds ? new Date(readAt.seconds * 1000) : null));
        
        callback(uid, date);
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  },

  // Message operations
  async editMessage(messageId, content) {
    try {
      const result = await updateChatMessageFromDb(messageId, {
        content: content,
        messageType: 'text'
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Get updated message data
      const messageResult = await getChatMessageFromDb(messageId);
      if (!messageResult.success) return null;
      
      const message = messageResult.data;
      
      // Update last message in related collection if this was the latest
      await this.updateLastMessageIfNeeded(message, content);
      
      return message;
    } catch (error) {
      logger.error('Error editing message:', error);
      throw error;
    }
  },

  async updateLastMessageIfNeeded(message, content) {
    try {
      if (message.type === 'class' && message.classId) {
        const result = await getMessagesByClassIdFromDb(message.classId, { limitCount: 1 });
        
        if (result.success && result.data.length > 0 && result.data[0].docId === message.docId) {
          await updateClassDocumentFromDb(message.classId, {
            lastMessage: content
          });
        }
      } else if (message.type === 'dm' && message.roomId) {
        const result = await getMessagesByRoomIdFromDb(message.roomId, { limitCount: 1 });
        
        if (result.success && result.data.length > 0 && result.data[0].docId === message.docId) {
          await updateDirectRoomDocumentFromDb(message.roomId, {
            lastMessage: content
          });
        }
      }
    } catch (error) {
      logger.error('Error updating last message:', error);
    }
  },

  async addReaction(messageId, userId, reaction) {
    try {
      const result = await updateMessageReactionFromDb(messageId, userId, reaction);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error adding reaction:', error);
      throw error;
    }
  },

  async removeReaction(messageId, userId) {
    try {
      const result = await removeMessageReactionFromDb(messageId, userId);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error removing reaction:', error);
      throw error;
    }
  },

  async deleteMessage(messageId) {
    try {
      // Get message data first to check for files to delete
      const messageResult = await getChatMessageFromDb(messageId);
      
      if (messageResult.success) {
        const message = messageResult.data;
        
        // Delete associated files (note: this still needs storage service)
        // For now, we'll keep the storage deletion logic as it requires storage imports
        if (message.voicePath || message.filePath) {
          logger.warn('[ChatService] File deletion from storage not implemented in this refactor');
        }
      }
      
      // Delete the message
      const result = await deleteChatMessageFromDb(messageId);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  },

  async updateLastMessageAfterDeletion(message) {
    try {
      if (message.type === 'class' && message.classId) {
        const result = await getMessagesByClassIdFromDb(message.classId, { limitCount: 1 });
        
        if (result.success && result.data.length === 0) {
          // No messages left, clear lastMessage
          await updateClassDocumentFromDb(message.classId, {
            lastMessage: '',
            lastMessageAt: null
          });
        } else if (result.success && result.data.length > 0) {
          // Update to the new last message
          const lastMsg = result.data[0];
          const preview = lastMsg.messageType === 'text' ? lastMsg.content
            : (lastMsg.messageType === 'voice' ? '[Voice Message]'
              : (lastMsg.messageType === 'file' ? `[File: ${lastMsg.fileName}]` : 'Message'));
          await updateClassDocumentFromDb(message.classId, {
            lastMessage: preview,
            lastMessageAt: lastMsg.createdAt
          });
        }
      } else if (message.type === 'dm' && message.roomId) {
        const result = await getMessagesByRoomIdFromDb(message.roomId, { limitCount: 1 });
        
        if (result.success && result.data.length === 0) {
          await updateDirectRoomDocumentFromDb(message.roomId, {
            lastMessage: '',
            lastMessageAt: null
          });
        } else if (result.success && result.data.length > 0) {
          const lastMsg = result.data[0];
          const preview = lastMsg.messageType === 'text' ? lastMsg.content
            : (lastMsg.messageType === 'voice' ? '[Voice Message]'
              : (lastMsg.messageType === 'file' ? `[File: ${lastMsg.fileName}]` : 'Message'));
          await updateDirectRoomDocumentFromDb(message.roomId, {
            lastMessage: preview,
            lastMessageAt: lastMsg.createdAt
          });
        }
      }
    } catch (error) {
      logger.error('Error updating last message after deletion:', error);
      throw error;
    }
  },

  // Direct room operations
  async toggleStarRoom(roomId, userId) {
    try {
      const roomResult = await getDirectRoomFromDb(roomId);
      
      if (!roomResult.success) {
        throw new Error('Room not found');
      }
      
      const room = roomResult.data;
      const starred = (room.starBy || []).includes(userId);
      
      const result = await updateRoomStarFromDb(roomId, userId, !starred);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return !starred;
    } catch (error) {
      logger.error('Error toggling room star:', error);
      throw error;
    }
  },

  async clearChatMessages(roomId, mode = 'all', userId = null) {
    try {
      const constraints = [where('type', '==', 'dm'), where('roomId', '==', roomId)];
      if (mode === 'mine' && userId) {
        constraints.push(where('senderId', '==', userId));
      }

      const result = await deleteMessagesByQueryFromDb(constraints);
      if (!result.success) {
        throw new Error(result.error);
      }

      if (mode === 'all' || result.deletedCount > 0) {
        await updateDirectRoomDocumentFromDb(roomId, {
          lastMessage: '',
          lastMessageAt: null
        });
      }

      return result.deletedCount;
    } catch (error) {
      logger.error('Error clearing chat messages:', error);
      throw error;
    }
  },

  async deleteDirectRoom(roomId) {
    try {
      await deleteMessagesByQueryFromDb([where('type', '==', 'dm'), where('roomId', '==', roomId)]);
      const result = await deleteDirectRoomFromDb(roomId);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error deleting direct room:', error);
      throw error;
    }
  },

  // Class operations
  subscribeToClasses(callback, isAdmin = false, userId = null, enrolledClassIds = new Set()) {
    return subscribeToClassesFromDb((classes) => {
      if (isAdmin) {
        // Admin: subscribe to all classes
        callback(classes);
      } else {
        // Non-admin: subscribe to all classes and filter on client side
        const filtered = [];
        classes.forEach(d => {
          const data = d;
          if (enrolledClassIds.has(data.docId)) {
            filtered.push(data);
          }
        });
        callback(filtered);
      }
    });
  },

  async syncUserEnrollments(userId, classIds) {
    try {
      for (const id of Array.from(classIds)) {
        const result = await updateUserEnrolledClassesFromDb(userId, id, true);
        if (!result.success) {
          logger.error('Error syncing user enrollment:', result.error);
        }
      }
    } catch (error) {
      logger.error('Error syncing user enrollments:', error);
      throw error;
    }
  },

  // Sync single enrollment for a user
  async syncUserEnrollment(userId, classId) {
    try {
      const result = await updateUserEnrolledClassesFromDb(userId, classId, true);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error syncing user enrollment:', error);
      throw error;
    }
  },

  async getClassName(classId) {
    try {
      const result = await getClassFromDb(classId);
      if (result.success) {
        return result.data.name || '';
      }
      return '';
    } catch (error) {
      logger.error('Error getting class name:', error);
      return '';
    }
  },

  // Unread count operations
  subscribeToUnreadCounts(chatReads, callback) {
    const unsubscribers = [];

    const makeUnsub = (key, constraints, readAt) => {
      const unsub = subscribeToMessagesWithQueryFromDb(constraints, (snap) => {
        let count = 0;
        snap.forEach(d => {
          const msg = d.data();
          const msgTime = msg.createdAt?.toDate?.() || (msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000) : null);
          if (msgTime && (!readAt || msgTime > readAt)) {
            count++;
          }
        });
        callback(key, count);
      });
      unsubscribers.push(unsub);
    };

    const globalReadAt = chatReads['global'];
    makeUnsub('global', [where('type', '==', 'global')], globalReadAt);

    Object.keys(chatReads).forEach(key => {
      if (key.startsWith('class:')) {
        const classId = key.slice(6);
        makeUnsub(classId, [where('classId', '==', classId)], chatReads[key]);
      }
    });

    return () => unsubscribers.forEach(u => u && u());
  },

  subscribeToClassUnreadCounts(classId, chatReads, callback) {
    const readAt = chatReads[classId] || chatReads[`class:${classId}`];
    return subscribeToMessagesWithQueryFromDb([
      where('classId', '==', classId)
    ], (snap) => {
      let count = 0;
      snap.forEach(d => {
        const msg = d.data();
        const msgTime = msg.createdAt?.toDate?.() || (msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000) : null);
        if (msgTime && (!readAt || msgTime > readAt)) {
          count++;
        }
      });
      callback(classId, count);
    });
  },

  subscribeToDMUnreadCounts(room, chatReads, callback) {
    const dmKey = `dm:${room.id}`;
    const readAt = chatReads[dmKey];
    return subscribeToMessagesWithQueryFromDb([
      where('type', '==', 'dm'),
      where('roomId', '==', room.id)
    ], (snap) => {
      let count = 0;
      snap.forEach(d => {
        const msg = d.data();
        const msgTime = msg.createdAt?.toDate?.() || (msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000) : null);
        if (msgTime && (!readAt || msgTime > readAt)) {
          count++;
        }
      });
      callback(room.id, count);
    });
  },

  // Message subscription
  subscribeToMessages(chatType, chatId, callback) {
    if (chatType === 'global') {
      return subscribeToMessagesWithQueryFromDb([
        where('type', '==', 'global'), 
        orderBy('createdAt', 'asc')
      ], callback);
    } else if (chatType === 'class') {
      return subscribeToMessagesWithQueryFromDb([
        where('classId', '==', chatId), 
        orderBy('createdAt', 'asc')
      ], callback);
    } else if (chatType === 'dm') {
      return subscribeToMessagesWithQueryFromDb([
        where('type', '==', 'dm'), 
        where('roomId', '==', chatId), 
        orderBy('createdAt', 'asc')
      ], callback);
    }
    
    return () => {};
  },

  // Send message with automatic last message updates
  async sendMessage(messageData) {
    try {
      const added = await createMessageFromDb(messageData);
      if (!added.success) {
        throw new Error(added.error);
      }

      const preview = messageData.messageType === 'text' ? messageData.content
        : (messageData.messageType === 'voice' ? '[Voice Message]'
          : (messageData.messageType === 'file' ? '[File: ' + messageData.fileName + ']' : 'Message'));

      if (messageData.type === 'dm' && messageData.roomId) {
        await updateDirectRoomDocumentFromDb(messageData.roomId, {
          lastMessage: preview,
          lastMessageAt: messageData.createdAt || new Date()
        });
      } else if (messageData.type === 'class' && messageData.classId) {
        await updateClassDocumentFromDb(messageData.classId, {
          lastMessage: preview,
          lastMessageAt: messageData.createdAt || new Date()
        });
      }

      return added.id;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  },

  // Create or open a DM room with another user
  async createDMRoom(userId1, userId2) {
    try {
      const roomId = [userId1, userId2].sort().join('_');
      const result = await createDirectRoomFromDb(roomId, {
        participants: [userId1, userId2],
        createdAt: new Date(),
        lastMessage: null
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return roomId;
    } catch (error) {
      logger.error('Error creating DM room:', error);
      throw error;
    }
  },

  // Get user enrollments for status check
  async getUserEnrollments(userId) {
    try {
      const result = await getEnrollmentsByUserIdFromDb(userId);
      return result.success ? result.data : [];
    } catch (error) {
      logger.error('Error getting user enrollments:', error);
      return [];
    }
  },

  // Create a poll message
  async createPollMessage(pollData) {
    try {
      const added = await createMessageFromDb(pollData);
      if (!added.success) {
        throw new Error(added.error);
      }
      return added.id;
    } catch (error) {
      logger.error('Error creating poll message:', error);
      throw error;
    }
  },

  // Vote in a poll
  async votePoll(messageId, userId, optionIndex) {
    try {
      const result = await addPollVoteFromDb(messageId, userId, optionIndex);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error voting in poll:', error);
      throw error;
    }
  },

  // Remove vote from a poll option
  async removePollVote(messageId, userId, optionIndex) {
    try {
      const result = await removePollVoteFromDb(messageId, userId, optionIndex);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error removing poll vote:', error);
      throw error;
    }
  },

  // Direct rooms subscription
  subscribeToDirectRooms(callback) {
    return subscribeToDirectRoomsFromDb(callback);
  }
};

