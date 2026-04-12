/**
 * Unit Tests for Chat Message Business Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as chatMessageService from '../src/services/business/chatMessageBusinessService.js';

// Mock the API service
vi.mock('../src/services/api/chat-messages-api.js', () => ({
  chatMessages: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getByClass: vi.fn(),
    getByActivity: vi.fn(),
    getByUser: vi.fn(),
    getStats: vi.fn()
  }
}));

// Mock the logger
vi.mock('../src/services/utils/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}));

describe('Chat Message Business Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllChatMessages', () => {
    it('should return all chat messages successfully', async () => {
      const mockMessages = [
        { id: '1', content: 'Hello', type: 'comment', status: 'active' },
        { id: '2', content: 'World', type: 'question', status: 'active' }
      ];
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getAll.mockResolvedValue({ success: true, data: mockMessages });
      
      const result = await chatMessageService.getAllChatMessages();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);
      expect(result.total).toBe(2);
    });

    it('should handle API errors gracefully', async () => {
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getAll.mockRejectedValue(new Error('API Error'));
      
      const result = await chatMessageService.getAllChatMessages();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load chat messages');
      expect(result.data).toEqual([]);
    });
  });

  describe('getChatMessageById', () => {
    it('should return chat message by ID successfully', async () => {
      const mockMessage = { id: '1', content: 'Hello', type: 'comment', status: 'active' };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ success: true, data: mockMessage });
      
      const result = await chatMessageService.getChatMessageById('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessage);
    });

    it('should handle not found chat message', async () => {
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ success: false, error: 'Chat message not found' });
      
      const result = await chatMessageService.getChatMessageById('999');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chat message not found');
      expect(result.data).toBeNull();
    });
  });

  describe('createChatMessage', () => {
    it('should create chat message successfully with valid data', async () => {
      const messageData = {
        content: 'Hello world',
        senderId: 'user1',
        type: 'comment'
      };
      
      const mockCreatedMessage = { 
        id: '1', 
        ...messageData, 
        quality: null,
        points: 0,
        metadata: {}
      };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.create.mockResolvedValue({ success: true, data: mockCreatedMessage });
      
      const result = await chatMessageService.createChatMessage(messageData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedMessage);
      expect(result.message).toBe('Chat message created successfully');
    });

    it('should reject message without content', async () => {
      const messageData = {
        senderId: 'user1',
        type: 'comment'
      };
      
      const result = await chatMessageService.createChatMessage(messageData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Message content is required');
      expect(result.data).toBeNull();
    });

    it('should reject message without sender', async () => {
      const messageData = {
        content: 'Hello world',
        type: 'comment'
      };
      
      const result = await chatMessageService.createChatMessage(messageData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Message sender is required');
      expect(result.data).toBeNull();
    });

    it('should reject invalid message type', async () => {
      const messageData = {
        content: 'Hello world',
        senderId: 'user1',
        type: 'invalid'
      };
      
      const result = await chatMessageService.createChatMessage(messageData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid message type. Must be one of: question, answer, comment, discussion');
      expect(result.data).toBeNull();
    });

    it('should reject invalid quality', async () => {
      const messageData = {
        content: 'Hello world',
        senderId: 'user1',
        quality: 'invalid'
      };
      
      const result = await chatMessageService.createChatMessage(messageData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid message quality. Must be one of: excellent, good, average, poor');
      expect(result.data).toBeNull();
    });

    it('should reject negative points', async () => {
      const messageData = {
        content: 'Hello world',
        senderId: 'user1',
        points: -5
      };
      
      const result = await chatMessageService.createChatMessage(messageData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Points must be a non-negative number');
      expect(result.data).toBeNull();
    });

    it('should reject reply to non-existent message', async () => {
      const messageData = {
        content: 'Reply',
        senderId: 'user1',
        replyToId: 'nonexistent'
      };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ success: false, error: 'Chat message not found' });
      
      const result = await chatMessageService.createChatMessage(messageData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Reply to message not found');
      expect(result.data).toBeNull();
    });

    it('should reject reply to own message', async () => {
      const messageData = {
        content: 'Reply',
        senderId: 'user1',
        replyToId: 'message1'
      };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { id: 'message1', senderId: 'user1' } 
      });
      
      const result = await chatMessageService.createChatMessage(messageData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot reply to your own message');
      expect(result.data).toBeNull();
    });
  });

  describe('updateChatMessage', () => {
    it('should update chat message successfully', async () => {
      const updateData = {
        content: 'Updated message',
        quality: 'good'
      };
      
      const mockUpdatedMessage = { 
        id: '1', 
        ...updateData, 
        updatedAt: new Date().toISOString() 
      };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { 
          id: '1', 
          senderId: 'user1', 
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          replies: []
        } 
      });
      chatMessages.update.mockResolvedValue({ success: true, data: mockUpdatedMessage });
      
      const result = await chatMessageService.updateChatMessage('1', updateData, { id: 'user1' });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedMessage);
      expect(result.message).toBe('Chat message updated successfully');
    });

    it('should reject update without ID', async () => {
      const updateData = { content: 'Updated message' };
      
      const result = await chatMessageService.updateChatMessage('', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chat message ID is required');
      expect(result.data).toBeNull();
    });

    it('should reject update of non-existent message', async () => {
      const updateData = { content: 'Updated message' };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ success: false, error: 'Chat message not found' });
      
      const result = await chatMessageService.updateChatMessage('999', updateData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chat message not found');
      expect(result.data).toBeNull();
    });

    it('should reject update of old message', async () => {
      const updateData = { content: 'Updated message' };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { 
          id: '1', 
          senderId: 'user1', 
          createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
          replies: []
        } 
      });
      
      const result = await chatMessageService.updateChatMessage('1', updateData, { id: 'user1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot edit messages older than 15 minutes');
      expect(result.data).toBeNull();
    });

    it('should reject update by non-sender', async () => {
      const updateData = { content: 'Updated message' };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { 
          id: '1', 
          senderId: 'user1', 
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          replies: []
        } 
      });
      
      const result = await chatMessageService.updateChatMessage('1', updateData, { id: 'user2' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Only the message sender can edit their own messages');
      expect(result.data).toBeNull();
    });

    it('should reject update of message with replies', async () => {
      const updateData = { content: 'Updated message' };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { 
          id: '1', 
          senderId: 'user1', 
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          replies: [{ id: 'reply1' }]
        } 
      });
      
      const result = await chatMessageService.updateChatMessage('1', updateData, { id: 'user1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot edit message that has replies');
      expect(result.data).toBeNull();
    });
  });

  describe('deleteChatMessage', () => {
    it('should delete chat message successfully', async () => {
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { 
          id: '1', 
          senderId: 'user1', 
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
        } 
      });
      chatMessages.delete.mockResolvedValue({ success: true });
      
      const result = await chatMessageService.deleteChatMessage('1', { id: 'user1' });
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Chat message deleted successfully');
    });

    it('should reject delete without ID', async () => {
      const result = await chatMessageService.deleteChatMessage('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chat message ID is required');
      expect(result.data).toBeNull();
    });

    it('should reject delete of non-existent message', async () => {
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ success: false, error: 'Chat message not found' });
      
      const result = await chatMessageService.deleteChatMessage('999');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Chat message not found');
      expect(result.data).toBeNull();
    });

    it('should reject delete by non-sender (non-admin)', async () => {
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { 
          id: '1', 
          senderId: 'user1', 
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        } 
      });
      
      const result = await chatMessageService.deleteChatMessage('1', { id: 'user2' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Only the message sender or admin can delete messages');
      expect(result.data).toBeNull();
    });

    it('should allow admin to delete any message', async () => {
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { 
          id: '1', 
          senderId: 'user1', 
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        } 
      });
      chatMessages.delete.mockResolvedValue({ success: true });
      
      const result = await chatMessageService.deleteChatMessage('1', { id: 'admin', role: 'admin' });
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Chat message deleted successfully');
    });

    it('should reject delete of old message (non-admin)', async () => {
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ 
        success: true, 
        data: { 
          id: '1', 
          senderId: 'user1', 
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        } 
      });
      
      const result = await chatMessageService.deleteChatMessage('1', { id: 'user1' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete messages older than 1 hour');
      expect(result.data).toBeNull();
    });
  });

  describe('getChatMessagesByClass', () => {
    it('should return messages for a specific class', async () => {
      const mockMessages = [
        { id: '1', classId: 'class1', content: 'Message 1' },
        { id: '2', classId: 'class1', content: 'Message 2' }
      ];
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getByClass.mockResolvedValue({ success: true, data: mockMessages });
      
      const result = await chatMessageService.getChatMessagesByClass('class1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);
      expect(result.total).toBe(2);
    });

    it('should reject without class ID', async () => {
      const result = await chatMessageService.getChatMessagesByClass('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class ID is required');
      expect(result.data).toEqual([]);
    });
  });

  describe('replyToMessage', () => {
    it('should create reply successfully', async () => {
      const replyData = {
        content: 'Reply message',
        senderId: 'user2'
      };
      
      const mockOriginalMessage = { 
        id: 'message1', 
        classId: 'class1',
        activityId: 'activity1'
      };
      
      const mockReply = { 
        id: 'reply1', 
        ...replyData, 
        replyToId: 'message1',
        classId: 'class1',
        activityId: 'activity1'
      };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ success: true, data: mockOriginalMessage });
      chatMessages.create.mockResolvedValue({ success: true, data: mockReply });
      
      const result = await chatMessageService.replyToMessage('message1', replyData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReply);
      expect(result.message).toBe('Reply created successfully');
    });

    it('should reject reply to non-existent message', async () => {
      const replyData = {
        content: 'Reply message',
        senderId: 'user2'
      };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getById.mockResolvedValue({ success: false, error: 'Chat message not found' });
      
      const result = await chatMessageService.replyToMessage('nonexistent', replyData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Original message not found');
      expect(result.data).toBeNull();
    });
  });

  describe('getChatMessageStats', () => {
    it('should return chat message statistics', async () => {
      const mockStats = {
        total: 10,
        byType: {
          question: 3,
          answer: 2,
          comment: 4,
          discussion: 1
        },
        byQuality: {
          excellent: 2,
          good: 3,
          average: 3,
          poor: 2
        },
        withPoints: 5,
        totalPoints: 25,
        averagePoints: 5,
        withReplies: 3,
        uniqueUsers: 8,
        uniqueDates: 5
      };
      
      const { chatMessages } = await import('../src/services/api/chat-messages-api.js');
      chatMessages.getStats.mockResolvedValue({ success: true, data: mockStats });
      
      const result = await chatMessageService.getChatMessageStats();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });
  });
});
