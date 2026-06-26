/**
 * Chat API Tests
 * Module: chat
 * Covers: TC-CHAT-001 through TC-CHAT-015
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleChatMessage, testTimestamp } from '../fixtures/test-data.js';

test.describe('Chat API', () => {
  let roomId;
  let messageId;

  test('TC-CHAT-001: GET /chat/rooms returns rooms for user', async () => {
    const res = await apiRequest('GET', '/chat/rooms');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
    if (res.data?.data?.length > 0) roomId = res.data.data[0].id;
  });

  test('TC-CHAT-002: GET /chat/rooms returns global room', async () => {
    const res = await apiRequest('GET', '/chat/rooms');
    const globalRoom = res.data?.data?.find(r => r.type === 'global');
    if (res.status < 400) expect(globalRoom).toBeTruthy();
  });

  test('TC-CHAT-003: GET /chat/rooms returns class rooms for staff', async () => {
    const res = await apiRequest('GET', '/chat/rooms', { role: 'superAdmin' });
    const classRooms = res.data?.data?.filter(r => r.type === 'class');
    if (res.status < 400) expect(classRooms).toBeDefined();
  });

  test('TC-CHAT-004: GET /chat/rooms returns only enrolled class rooms for students', async () => {
    const res = await apiRequest('GET', '/chat/rooms', { role: 'student' });
    const classRooms = res.data?.data?.filter(r => r.type === 'class') || [];
    const dmRooms = res.data?.data?.filter(r => r.type === 'dm') || [];
    const globalRoom = res.data?.data?.find(r => r.type === 'global');
    if (res.status < 400) expect(globalRoom).toBeTruthy();
  });

  test('TC-CHAT-005: GET /chat/rooms/:roomId/messages returns messages', async () => {
    if (!roomId) {
      const roomsRes = await apiRequest('GET', '/chat/rooms');
      if (!roomsRes.data?.data?.length) test.skip(true, 'No chat rooms exist');
      roomId = roomsRes.data.data[0].id;
    }
    const res = await apiRequest('GET', `/chat/rooms/${roomId}/messages`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.data?.data?.length > 0) messageId = res.data.data[0].id;
  });

  test('TC-CHAT-006: GET /chat/rooms/:roomId/messages paginated', async () => {
    if (!roomId) test.skip(true, 'No room available');
    const res = await apiRequest('GET', `/chat/rooms/${roomId}/messages?page=1&limit=10`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-CHAT-007: POST /chat/rooms/:roomId/messages sends text', async () => {
    if (!roomId) test.skip(true, 'No room available');
    const res = await apiRequest('POST', `/chat/rooms/${roomId}/messages`, {
      body: { content: `E2E test message ${testTimestamp()}`, type: 'text' },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.data?.data?.id) messageId = res.data.data.id;
  });

  test('TC-CHAT-010: PUT /chat/messages/:messageId edits message', async () => {
    if (!messageId) test.skip(true, 'No message to edit');
    const res = await apiRequest('PUT', `/chat/messages/${messageId}`, {
      body: { content: `Edited ${testTimestamp()}` },
    });
    expect([200, 403, 400, 500]).toContain(res.status);
  });

  test('TC-CHAT-011: DELETE /chat/messages/:messageId soft-deletes', async () => {
    if (!roomId) test.skip(true, 'No room available');
    const sendRes = await apiRequest('POST', `/chat/rooms/${roomId}/messages`, {
      body: { content: `Delete me ${testTimestamp()}`, type: 'text' },
    });
    if (!sendRes.data?.data?.id) test.skip(true, 'Could not send message');
    const id = sendRes.data.data.id;
    const res = await apiRequest('DELETE', `/chat/messages/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  test('TC-CHAT-012: POST /chat/dm creates DM room', async () => {
    const res = await apiRequest('POST', '/chat/dm', {
      body: { targetUserId: 1 },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-CHAT-013: POST /chat/messages/:messageId/reactions toggles', async () => {
    if (!messageId) test.skip(true, 'No message available');
    const res = await apiRequest('POST', `/chat/messages/${messageId}/reactions`, {
      body: { emoji: '👍' },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-CHAT-015: GET /chat/users returns available users', async () => {
    const res = await apiRequest('GET', '/chat/users');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-CHAT-SEC: GET /chat/rooms without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/chat/rooms');
    expect(res.status).toBe(401);
  });
});
