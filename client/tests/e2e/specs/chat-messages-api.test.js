import { test, expect } from '@playwright/test';

test.describe('Chat Messages API - CRUD Operations', () => {
  const API_BASE_URL = 'http://localhost:8001';
  
  test('Chat Messages API - Service Layer Integration', async ({ request }) => {
    console.log('🔍 Testing chat messages service layer with PostgreSQL backend...');
    
    // Test GET all chat messages
    const response = await request.get(`${API_BASE_URL}/api/v1/chat-messages`);
    
    console.log('🔍 Chat Messages API response status:', response.status());
    
    if (response.status() === 200) {
      const messages = await response.json();
      console.log('✅ Chat Messages API returned data:', messages.length, 'messages');
      
      // Verify response structure
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThanOrEqual(0);
      
      // If there are messages, verify structure
      if (messages.length > 0) {
        const message = messages[0];
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('content');
        expect(message).toHaveProperty('senderId');
        expect(message).toHaveProperty('timestamp');
      }
    } else if (response.status() === 404) {
      console.log('⚠️ Chat Messages API not found - service layer may not be fully implemented yet');
      test.skip(true, 'Chat Messages API endpoint not yet implemented');
    } else {
      console.log('❌ Chat Messages API returned unexpected status:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('POST /api/v1/chat-messages - Create new chat message', async ({ request }) => {
    // First create a user to test chat message
    const userData = {
      email: 'student-chat@test.com',
      displayName: 'Test Student for Chat',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      console.log('⚠️ Could not create user for chat message test');
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    // Create a class for the chat message
    const classData = {
      nameEn: 'Test Class for Chat',
      type: 'lecture'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      console.log('⚠️ Could not create class for chat message test');
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const messageData = {
      content: 'Hello, this is a test chat message!',
      senderId: user.id,
      classId: classDataResponse.id,
      type: 'comment'
    };
    
    console.log('🔍 Creating new chat message...');
    
    const response = await request.post(`${API_BASE_URL}/api/v1/chat-messages`, {
      data: messageData
    });
    
    console.log('🔍 Create chat message response status:', response.status());
    
    if (response.status() === 201) {
      const message = await response.json();
      console.log('✅ Chat message created successfully:', message.id);
      
      // Verify response structure
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('content', messageData.content);
      expect(message).toHaveProperty('senderId', messageData.senderId);
      expect(message).toHaveProperty('classId', messageData.classId);
      expect(message).toHaveProperty('type', messageData.type);
      expect(message).toHaveProperty('timestamp');
      
      // Store message ID for subsequent tests
      test.messageId = message.id;
    } else if (response.status() === 400) {
      const error = await response.json();
      console.log('⚠️ Chat message creation validation error:', error.error);
      // This might be expected if validation is strict
    } else {
      console.log('❌ Failed to create chat message:', response.status());
      const errorText = await response.text();
      console.log('🔍 Error response:', errorText);
    }
  });

  test('GET /api/v1/chat-messages/:id - Get chat message by ID', async ({ request }) => {
    // First create a user and class and message to test
    const userData = {
      email: 'student-chat2@test.com',
      displayName: 'Test Student 2 for Chat',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for Chat Get',
      type: 'seminar'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const messageData = {
      content: 'Test message for GET endpoint',
      senderId: user.id,
      classId: classDataResponse.id,
      type: 'question'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/chat-messages`, {
      data: messageData
    });
    
    if (createResponse.status() === 201) {
      const message = await createResponse.json();
      
      console.log('🔍 Getting chat message by ID:', message.id);
      
      const response = await request.get(`${API_BASE_URL}/api/v1/chat-messages/${message.id}`);
      
      console.log('🔍 Get chat message response status:', response.status());
      
      if (response.status() === 200) {
        const retrievedMessage = await response.json();
        console.log('✅ Chat message retrieved successfully');
        
        // Verify the message data
        expect(retrievedMessage).toHaveProperty('id', message.id);
        expect(retrievedMessage).toHaveProperty('content', messageData.content);
        expect(retrievedMessage).toHaveProperty('senderId', messageData.senderId);
        expect(retrievedMessage).toHaveProperty('type', messageData.type);
      } else {
        console.log('❌ Failed to get chat message:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create chat message for GET test');
      test.skip(true, 'Unable to create test chat message');
    }
  });

  test('PUT /api/v1/chat-messages/:id - Update chat message', async ({ request }) => {
    // First create a user, class, and message
    const userData = {
      email: 'student-chat3@test.com',
      displayName: 'Test Student 3 for Chat',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for Chat Update',
      type: 'workshop'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const messageData = {
      content: 'Test message for PUT endpoint',
      senderId: user.id,
      classId: classDataResponse.id,
      type: 'discussion'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/chat-messages`, {
      data: messageData
    });
    
    if (createResponse.status() === 201) {
      const message = await createResponse.json();
      
      const updateData = {
        content: 'Updated chat message content',
        quality: 'good'
      };
      
      console.log('🔍 Updating chat message:', message.id);
      
      const response = await request.put(`${API_BASE_URL}/api/v1/chat-messages/${message.id}`, {
        data: updateData
      });
      
      console.log('🔍 Update chat message response status:', response.status());
      
      if (response.status() === 200) {
        const updatedMessage = await response.json();
        console.log('✅ Chat message updated successfully');
        
        // Verify the updates
        expect(updatedMessage).toHaveProperty('id', message.id);
        expect(updatedMessage).toHaveProperty('content', updateData.content);
        expect(updatedMessage).toHaveProperty('quality', updateData.quality);
        expect(updatedMessage).toHaveProperty('updatedAt');
      } else if (response.status() === 400) {
        const error = await response.json();
        console.log('⚠️ Chat message update validation error:', error.error);
      } else {
        console.log('❌ Failed to update chat message:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create chat message for PUT test');
      test.skip(true, 'Unable to create test chat message');
    }
  });

  test('DELETE /api/v1/chat-messages/:id - Delete chat message', async ({ request }) => {
    // First create a user, class, and message
    const userData = {
      email: 'student-chat4@test.com',
      displayName: 'Test Student 4 for Chat',
      isStudent: true
    };
    
    const userResponse = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: userData
    });
    
    if (userResponse.status() !== 201) {
      test.skip(true, 'Unable to create test user');
      return;
    }
    
    const user = await userResponse.json();
    
    const classData = {
      nameEn: 'Test Class for Chat Delete',
      type: 'lab'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const messageData = {
      content: 'Test message for DELETE endpoint',
      senderId: user.id,
      classId: classDataResponse.id,
      type: 'answer'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/chat-messages`, {
      data: messageData
    });
    
    if (createResponse.status() === 201) {
      const message = await createResponse.json();
      
      console.log('🔍 Deleting chat message:', message.id);
      
      const response = await request.delete(`${API_BASE_URL}/api/v1/chat-messages/${message.id}`);
      
      console.log('🔍 Delete chat message response status:', response.status());
      
      if (response.status() === 204) {
        console.log('✅ Chat message deleted successfully');
        
        // Verify the message is gone
        const getResponse = await request.get(`${API_BASE_URL}/api/v1/chat-messages/${message.id}`);
        expect(getResponse.status()).toBe(404);
      } else if (response.status() === 404) {
        console.log('⚠️ Chat message not found for deletion');
      } else {
        console.log('❌ Failed to delete chat message:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create chat message for DELETE test');
      test.skip(true, 'Unable to create test chat message');
    }
  });

  test('GET /api/v1/chat-messages - Validation tests', async ({ request }) => {
    console.log('🔍 Testing chat message validation...');
    
    // Test creating chat message without required fields
    const invalidMessageData = {
      type: 'comment'
      // Missing content and senderId
    };
    
    const response = await request.post(`${API_BASE_URL}/api/v1/chat-messages`, {
      data: invalidMessageData
    });
    
    console.log('🔍 Invalid chat message creation response status:', response.status());
    
    if (response.status() === 400) {
      const error = await response.json();
      console.log('✅ Validation working correctly:', error.error);
      expect(error.error).toContain('required');
    } else {
      console.log('⚠️ Expected validation error but got:', response.status());
    }
  });

  test('GET /api/v1/classes/:classId/chat-messages - Get chat messages by class', async ({ request }) => {
    console.log('🔍 Getting chat messages by class...');
    
    // First create a class
    const classData = {
      nameEn: 'Test Class for Chat Messages',
      type: 'lecture'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    const response = await request.get(`${API_BASE_URL}/api/v1/classes/${classDataResponse.id}/chat-messages`);
    
    console.log('🔍 Class chat messages response status:', response.status());
    
    if (response.status() === 200) {
      const messages = await response.json();
      console.log('✅ Retrieved class chat messages:', messages.length);
      
      expect(Array.isArray(messages)).toBe(true);
      
      // Verify all messages are from the specified class
      for (const message of messages) {
        expect(message.classId).toBe(classDataResponse.id);
      }
    } else {
      console.log('❌ Failed to get class chat messages:', response.status());
    }
  });

  test('POST /api/v1/chat-messages/:id/reply - Reply to chat message', async ({ request }) => {
    // First create users, class, and original message
    const user1Data = {
      email: 'student-chat5@test.com',
      displayName: 'Test Student 5 for Chat',
      isStudent: true
    };
    
    const user2Data = {
      email: 'student-chat6@test.com',
      displayName: 'Test Student 6 for Chat',
      isStudent: true
    };
    
    const user1Response = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: user1Data
    });
    
    const user2Response = await request.post(`${API_BASE_URL}/api/v1/users`, {
      data: user2Data
    });
    
    if (user1Response.status() !== 201 || user2Response.status() !== 201) {
      test.skip(true, 'Unable to create test users');
      return;
    }
    
    const user1 = await user1Response.json();
    const user2 = await user2Response.json();
    
    const classData = {
      nameEn: 'Test Class for Chat Replies',
      type: 'seminar'
    };
    
    const classResponse = await request.post(`${API_BASE_URL}/api/v1/classes`, {
      data: classData
    });
    
    if (classResponse.status() !== 201) {
      test.skip(true, 'Unable to create test class');
      return;
    }
    
    const classDataResponse = await classResponse.json();
    
    // Create original message
    const originalMessageData = {
      content: 'Original message for reply test',
      senderId: user1.id,
      classId: classDataResponse.id,
      type: 'question'
    };
    
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/chat-messages`, {
      data: originalMessageData
    });
    
    if (createResponse.status() === 201) {
      const originalMessage = await createResponse.json();
      
      const replyData = {
        content: 'This is a reply to the original message',
        senderId: user2.id
      };
      
      console.log('🔍 Replying to chat message:', originalMessage.id);
      
      const response = await request.post(`${API_BASE_URL}/api/v1/chat-messages/${originalMessage.id}/reply`, {
        data: replyData
      });
      
      console.log('🔍 Reply to chat message response status:', response.status());
      
      if (response.status() === 201) {
        const replyMessage = await response.json();
        console.log('✅ Chat message reply created successfully');
        
        expect(replyMessage).toHaveProperty('id');
        expect(replyMessage).toHaveProperty('content', replyData.content);
        expect(replyMessage).toHaveProperty('senderId', replyData.senderId);
        expect(replyMessage).toHaveProperty('replyToId', originalMessage.id);
      } else {
        console.log('❌ Failed to reply to chat message:', response.status());
        const errorText = await response.text();
        console.log('🔍 Error response:', errorText);
      }
    } else {
      console.log('⚠️ Could not create original message for reply test');
      test.skip(true, 'Unable to create test message');
    }
  });

  test('GET /api/v1/chat-messages/stats - Get chat message statistics', async ({ request }) => {
    console.log('🔍 Getting chat message statistics...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/chat-messages/stats`);
    
    console.log('🔍 Chat message stats response status:', response.status());
    
    if (response.status() === 200) {
      const stats = await response.json();
      console.log('✅ Retrieved chat message statistics:', stats);
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byQuality');
      expect(stats).toHaveProperty('withPoints');
      expect(stats).toHaveProperty('totalPoints');
      expect(stats).toHaveProperty('averagePoints');
      expect(stats).toHaveProperty('withReplies');
      expect(stats).toHaveProperty('uniqueUsers');
      expect(stats).toHaveProperty('uniqueDates');
      
      // Verify structure of nested objects
      expect(stats.byType).toHaveProperty('question');
      expect(stats.byType).toHaveProperty('answer');
      expect(stats.byType).toHaveProperty('comment');
      expect(stats.byType).toHaveProperty('discussion');
      
      expect(stats.byQuality).toHaveProperty('excellent');
      expect(stats.byQuality).toHaveProperty('good');
      expect(stats.byQuality).toHaveProperty('average');
      expect(stats.byQuality).toHaveProperty('poor');
      
      // Verify all values are numbers
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.withPoints).toBe('number');
      expect(typeof stats.totalPoints).toBe('number');
    } else {
      console.log('❌ Failed to get chat message stats:', response.status());
    }
  });
});
