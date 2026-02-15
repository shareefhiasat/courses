import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../other/config';
import logger from '@utils/logger';
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
  updateUserMessageColor as updateUserMessageColorInDb
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
    return onSnapshot(doc(db, 'users', userId), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      callback(data.messageColor);
    });
  },

  async getUserChatReads(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const data = userDoc.data() || {};
      return data.chatReads || {};
    } catch (error) {
      logger.error('Error getting user chat reads:', error);
      return {};
    }
  },

  async updateUserChatReads(userId, chatKey) {
    try {
      await setDoc(doc(db, 'users', userId), { 
        chatReads: { 
          [chatKey]: serverTimestamp() 
        } 
      }, { merge: true });
      return new Date();
    } catch (error) {
      logger.error('Error updating user chat reads:', error);
      throw error;
    }
  },

  subscribeToUserReadReceipts(userIds, chatKey, callback) {
    const unsubscribers = [];
    
    userIds.forEach(uid => {
      const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
        const data = snap.data() || {};
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
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        content: content,
        messageType: 'text'
      });
      
      // Get updated message data
      const snap = await getDoc(messageRef);
      if (!snap.exists()) return null;
      
      const message = snap.data();
      
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
      const msgsRef = collection(db, 'messages');
      
      if (message.type === 'class' && message.classId) {
        const q = query(msgsRef, 
          where('classId', '==', message.classId), 
          orderBy('createdAt', 'desc'));
        const qs = await getDocs(q);
        
        if (!qs.empty && qs.docs[0].id === message.id) {
          await updateDoc(doc(db, 'classes', message.classId), {
            lastMessage: content
          });
        }
      } else if (message.type === 'dm' && message.roomId) {
        const q = query(msgsRef, 
          where('type', '==', 'dm'), 
          where('roomId', '==', message.roomId), 
          orderBy('createdAt', 'desc'));
        const qs = await getDocs(q);
        
        if (!qs.empty && qs.docs[0].id === message.id) {
          await updateDoc(doc(db, 'directRooms', message.roomId), {
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
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { 
        [`reactions.${userId}`]: reaction 
      });
    } catch (error) {
      logger.error('Error adding reaction:', error);
      throw error;
    }
  },

  async removeReaction(messageId, userId) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { 
        [`reactions.${userId}`]: deleteField() 
      });
    } catch (error) {
      logger.error('Error removing reaction:', error);
      throw error;
    }
  },

  async deleteMessage(messageId) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const snap = await getDoc(messageRef);
      
      if (snap.exists()) {
        const message = snap.data();
        
        // Delete associated files
        if (message.voicePath) {
          try {
            await deleteObject(ref(storage, message.voicePath));
          } catch (error) {
            logger.error('Error deleting voice file:', error);
          }
        }
        
        if (message.filePath) {
          try {
            await deleteObject(ref(storage, message.filePath));
          } catch (error) {
            logger.error('Error deleting file attachment:', error);
          }
        }
      }
      
      await deleteDoc(messageRef);
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  },

  async updateLastMessageAfterDeletion(message) {
    try {
      const msgsRef = collection(db, 'messages');
      
      if (message.type === 'class' && message.classId) {
        const q = query(msgsRef, where('classId', '==', message.classId), orderBy('createdAt', 'desc'));
        const qs = await getDocs(q);
        
        if (qs.empty) {
          // No messages left, clear lastMessage
          await updateDoc(doc(db, 'classes', message.classId), {
            lastMessage: '',
            lastMessageAt: null
          });
        } else {
          // Update to the new last message
          const lastMsg = qs.docs[0].data();
          const preview = lastMsg.messageType === 'text' ? lastMsg.content
            : (lastMsg.messageType === 'voice' ? '[Voice Message]'
              : (lastMsg.messageType === 'file' ? `[File: ${lastMsg.fileName}]` : 'Message'));
          await updateDoc(doc(db, 'classes', message.classId), {
            lastMessage: preview,
            lastMessageAt: lastMsg.createdAt
          });
        }
      } else if (message.type === 'dm' && message.roomId) {
        const q = query(msgsRef, where('type', '==', 'dm'), where('roomId', '==', message.roomId), orderBy('createdAt', 'desc'));
        const qs = await getDocs(q);
        
        if (qs.empty) {
          await updateDoc(doc(db, 'directRooms', message.roomId), {
            lastMessage: '',
            lastMessageAt: null
          });
        } else {
          const lastMsg = qs.docs[0].data();
          const preview = lastMsg.messageType === 'text' ? lastMsg.content
            : (lastMsg.messageType === 'voice' ? '[Voice Message]'
              : (lastMsg.messageType === 'file' ? `[File: ${lastMsg.fileName}]` : 'Message'));
          await updateDoc(doc(db, 'directRooms', message.roomId), {
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
      const roomRef = doc(db, 'directRooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }
      
      const room = roomSnap.data();
      const starred = (room.starBy || []).includes(userId);
      
      await updateDoc(roomRef, {
        starBy: starred ? arrayRemove(userId) : arrayUnion(userId)
      });
      
      return !starred;
    } catch (error) {
      logger.error('Error toggling room star:', error);
      throw error;
    }
  },

  async clearChatMessages(roomId, mode = 'all', userId = null) {
    try {
      const msgsRef = collection(db, 'messages');
      const q = query(msgsRef, 
        where('type', '==', 'dm'), 
        where('roomId', '==', roomId));
      const qs = await getDocs(q);
      
      let deletedCount = 0;
      
      for (const docSnap of qs.docs) {
        const message = docSnap.data();
        const shouldDelete = mode === 'all' || 
                           (mode === 'mine' && message.senderId === userId) ||
                           (mode === 'theirs' && message.senderId !== userId);
        
        if (shouldDelete) {
          // Delete associated files
          if (message.voicePath) {
            try {
              await deleteObject(ref(storage, message.voicePath));
            } catch (error) {
              logger.error('Error deleting voice file:', error);
            }
          }
          
          if (message.filePath) {
            try {
              await deleteObject(ref(storage, message.filePath));
            } catch (error) {
              logger.error('Error deleting file attachment:', error);
            }
          }
          
          await deleteDoc(doc(db, 'messages', docSnap.id));
          deletedCount++;
        }
      }
      
      // Update room metadata if all messages cleared
      if (mode === 'all' || deletedCount === qs.docs.length) {
        await updateDoc(doc(db, 'directRooms', roomId), {
          lastMessage: '',
          lastMessageAt: null
        });
      }
      
      return deletedCount;
    } catch (error) {
      logger.error('Error clearing chat messages:', error);
      throw error;
    }
  },

  async deleteDirectRoom(roomId) {
    try {
      // Delete all messages in the room
      const msgsRef = collection(db, 'messages');
      const q = query(msgsRef, 
        where('type', '==', 'dm'), 
        where('roomId', '==', roomId));
      const qs = await getDocs(q);
      
      for (const docSnap of qs.docs) {
        const message = docSnap.data();
        
        // Delete associated files
        if (message.voicePath) {
          try {
            await deleteObject(ref(storage, message.voicePath));
          } catch (error) {
            logger.error('Error deleting voice file:', error);
          }
        }
        
        if (message.filePath) {
          try {
            await deleteObject(ref(storage, message.filePath));
          } catch (error) {
            logger.error('Error deleting file attachment:', error);
          }
        }
        
        await deleteDoc(doc(db, 'messages', docSnap.id));
      }
      
      // Delete the room itself
      await deleteDoc(doc(db, 'directRooms', roomId));
    } catch (error) {
      logger.error('Error deleting direct room:', error);
      throw error;
    }
  },

  // Class operations
  subscribeToClasses(callback, isAdmin = false, userId = null, enrolledClassIds = new Set()) {
    const classesRef = collection(db, 'classes');
    
    if (isAdmin) {
      // Admin: subscribe to all classes
      return onSnapshot(classesRef, (snap) => {
        const all = [];
        snap.forEach(d => all.push({ docId: d.id, ...d.data() }));
        callback(all);
      });
    } else {
      // Non-admin: subscribe to all classes and filter on client side
      return onSnapshot(classesRef, (snap) => {
        const all = [];
        snap.forEach(d => {
          const data = { docId: d.id, ...d.data() };
          if (enrolledClassIds.has(d.id)) {
            all.push(data);
          }
        });
        callback(all);
      });
    }
  },

  async syncUserEnrollments(userId, classIds) {
    try {
      for (const id of Array.from(classIds)) {
        await updateDoc(doc(db, 'users', userId), { 
          enrolledClasses: arrayUnion(id) 
        });
      }
    } catch (error) {
      logger.error('Error syncing user enrollments:', error);
      throw error;
    }
  },

  // Sync single enrollment for a user
  async syncUserEnrollment(userId, classId) {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        enrolledClasses: arrayUnion(classId) 
      });
    } catch (error) {
      logger.error('Error syncing user enrollment:', error);
      throw error;
    }
  },

  async getClassName(classId) {
    try {
      const classSnap = await getDoc(doc(db, 'classes', classId));
      if (classSnap.exists()) {
        return classSnap.data().name || '';
      }
      return '';
    } catch (error) {
      logger.error('Error getting class name:', error);
      return '';
    }
  },

  // Unread count operations
  subscribeToUnreadCounts(chatReads, callback) {
    const msgsRef = collection(db, 'messages');
    
    // Global messages
    const globalKey = 'global';
    const globalReadAt = chatReads[globalKey];
    const globalQ = query(msgsRef, where('type', '==', 'global'));
    const globalUnsub = onSnapshot(globalQ, (snap) => {
      let count = 0;
      snap.forEach(d => {
        const msg = d.data();
        const msgTime = msg.createdAt?.toDate?.() || (msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000) : null);
        if (msgTime && (!globalReadAt || msgTime > globalReadAt)) {
          count++;
        }
      });
      callback(globalKey, count);
    });
    
    return globalUnsub;
  },

  subscribeToClassUnreadCounts(classId, chatReads, callback) {
    const msgsRef = collection(db, 'messages');
    const classKey = classId;
    const readAt = chatReads[classKey] || chatReads[`class:${classId}`];
    const cq = query(msgsRef, where('classId', '==', classId));
    
    return onSnapshot(cq, (snap) => {
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
    const msgsRef = collection(db, 'messages');
    const dmKey = `dm:${room.id}`;
    const readAt = chatReads[dmKey];
    const dq = query(msgsRef, where('type', '==', 'dm'), where('roomId', '==', room.id));
    
    return onSnapshot(dq, (snap) => {
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
    const msgsRef = collection(db, 'messages');
    
    if (chatType === 'global') {
      const q = query(msgsRef, where('type', '==', 'global'), orderBy('createdAt', 'asc'));
      return onSnapshot(q, callback);
    } else if (chatType === 'class') {
      const q = query(msgsRef, where('classId', '==', chatId), orderBy('createdAt', 'asc'));
      return onSnapshot(q, callback);
    } else if (chatType === 'dm') {
      const q = query(msgsRef, where('type', '==', 'dm'), where('roomId', '==', chatId), orderBy('createdAt', 'asc'));
      return onSnapshot(q, callback);
    }
    
    return () => {};
  },

  // Send message with automatic last message updates
  async sendMessage(messageData) {
    try {
      const added = await addDoc(collection(db, 'messages'), messageData);
      
      // Update last message in related collection
      if (messageData.type === 'dm' && messageData.roomId) {
        const preview = messageData.messageType === 'text' ? messageData.content
          : (messageData.messageType === 'voice' ? '[Voice Message]'
            : (messageData.messageType === 'file' ? '[File: ' + messageData.fileName + ']' : 'Message'));
        await setDoc(doc(db, 'directRooms', messageData.roomId), {
          lastMessage: preview,
          lastMessageAt: serverTimestamp(),
        }, { merge: true });
      } else if (messageData.type === 'class' && messageData.classId) {
        const preview = messageData.messageType === 'text' ? messageData.content
          : (messageData.messageType === 'voice' ? '[Voice Message]'
            : (messageData.messageType === 'file' ? '[File: ' + messageData.fileName + ']' : 'Message'));
        await updateDoc(doc(db, 'classes', messageData.classId), {
          lastMessage: preview,
          lastMessageAt: serverTimestamp()
        });
      }
      
      return added;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  },

  // Create or open a DM room with another user
  async createDMRoom(userId1, userId2) {
    try {
      const roomId = [userId1, userId2].sort().join('_');
      const roomRef = doc(db, 'directRooms', roomId);
      
      // Create/merge optimistically without reading first
      await setDoc(roomRef, {
        participants: [userId1, userId2],
        createdAt: serverTimestamp(),
        lastMessage: null
      }, { merge: true });
      
      return roomId;
    } catch (error) {
      logger.error('Error creating DM room:', error);
      throw error;
    }
  },

  // Get user enrollments for status check
  async getUserEnrollments(userId) {
    try {
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(enrollmentsRef, where('userId', '==', userId));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      logger.error('Error getting user enrollments:', error);
      return [];
    }
  },

  // Create a poll message
  async createPollMessage(pollData) {
    try {
      const added = await addDoc(collection(db, 'messages'), pollData);
      return added;
    } catch (error) {
      logger.error('Error creating poll message:', error);
      throw error;
    }
  },

  // Vote in a poll
  async votePoll(messageId, userId, optionIndex) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        [`pollVotes.${optionIndex}`]: arrayUnion(userId)
      });
    } catch (error) {
      logger.error('Error voting in poll:', error);
      throw error;
    }
  },

  // Remove vote from a poll option
  async removePollVote(messageId, userId, optionIndex) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        [`pollVotes.${optionIndex}`]: arrayRemove(userId)
      });
    } catch (error) {
      logger.error('Error removing poll vote:', error);
      throw error;
    }
  },

  // Direct rooms subscription
  subscribeToDirectRooms(callback) {
    const roomsRef = collection(db, 'directRooms');
    return onSnapshot(roomsRef, callback);
  }
};

