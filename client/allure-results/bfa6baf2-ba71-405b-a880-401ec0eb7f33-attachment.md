# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat-api.spec.js >> Chat API >> TC-CHAT-015: GET /chat/users returns available users
- Location: tests/e2e/specs/chat-api.spec.js:105:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  7   | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  8   | import { sampleChatMessage, testTimestamp } from '../fixtures/test-data.js';
  9   | 
  10  | test.describe('Chat API', () => {
  11  |   let roomId;
  12  |   let messageId;
  13  | 
  14  |   test('TC-CHAT-001: GET /chat/rooms returns rooms for user', async () => {
  15  |     const res = await apiRequest('GET', '/chat/rooms');
  16  |     expect(res.status).toBe(200);
  17  |     expect(res.data.success).toBe(true);
  18  |     expect(res.data.data).toBeInstanceOf(Array);
  19  |     if (res.data.data.length > 0) roomId = res.data.data[0].id;
  20  |   });
  21  | 
  22  |   test('TC-CHAT-002: GET /chat/rooms returns global room', async () => {
  23  |     const res = await apiRequest('GET', '/chat/rooms');
  24  |     const globalRoom = res.data.data?.find(r => r.type === 'global');
  25  |     expect(globalRoom).toBeTruthy();
  26  |   });
  27  | 
  28  |   test('TC-CHAT-003: GET /chat/rooms returns class rooms for staff', async () => {
  29  |     const res = await apiRequest('GET', '/chat/rooms', { role: 'superAdmin' });
  30  |     const classRooms = res.data.data?.filter(r => r.type === 'class');
  31  |     expect(classRooms).toBeDefined();
  32  |   });
  33  | 
  34  |   test('TC-CHAT-004: GET /chat/rooms returns only enrolled class rooms for students', async () => {
  35  |     const res = await apiRequest('GET', '/chat/rooms', { role: 'student' });
  36  |     const classRooms = res.data.data?.filter(r => r.type === 'class') || [];
  37  |     const dmRooms = res.data.data?.filter(r => r.type === 'dm') || [];
  38  |     const globalRoom = res.data.data?.find(r => r.type === 'global');
  39  |     expect(globalRoom).toBeTruthy();
  40  |   });
  41  | 
  42  |   test('TC-CHAT-005: GET /chat/rooms/:roomId/messages returns messages', async () => {
  43  |     if (!roomId) {
  44  |       const roomsRes = await apiRequest('GET', '/chat/rooms');
  45  |       if (!roomsRes.data.data?.length) test.skip(true, 'No chat rooms exist');
  46  |       roomId = roomsRes.data.data[0].id;
  47  |     }
  48  |     const res = await apiRequest('GET', `/chat/rooms/${roomId}/messages`);
  49  |     expect(res.status).toBe(200);
  50  |     expect(res.data.success).toBe(true);
  51  |     if (res.data.data?.length > 0) messageId = res.data.data[0].id;
  52  |   });
  53  | 
  54  |   test('TC-CHAT-006: GET /chat/rooms/:roomId/messages paginated', async () => {
  55  |     if (!roomId) test.skip(true, 'No room available');
  56  |     const res = await apiRequest('GET', `/chat/rooms/${roomId}/messages?page=1&limit=10`);
  57  |     expect(res.status).toBe(200);
  58  |     expect(res.data.success).toBe(true);
  59  |   });
  60  | 
  61  |   test('TC-CHAT-007: POST /chat/rooms/:roomId/messages sends text', async () => {
  62  |     if (!roomId) test.skip(true, 'No room available');
  63  |     const res = await apiRequest('POST', `/chat/rooms/${roomId}/messages`, {
  64  |       body: { content: `E2E test message ${testTimestamp()}`, type: 'text' },
  65  |     });
  66  |     expect([200, 201]).toContain(res.status);
  67  |     expect(res.data.success).toBe(true);
  68  |     if (res.data.data?.id) messageId = res.data.data.id;
  69  |   });
  70  | 
  71  |   test('TC-CHAT-010: PUT /chat/messages/:messageId edits message', async () => {
  72  |     if (!messageId) test.skip(true, 'No message to edit');
  73  |     const res = await apiRequest('PUT', `/chat/messages/${messageId}`, {
  74  |       body: { content: `Edited ${testTimestamp()}` },
  75  |     });
  76  |     expect([200, 403]).toContain(res.status);
  77  |   });
  78  | 
  79  |   test('TC-CHAT-011: DELETE /chat/messages/:messageId soft-deletes', async () => {
  80  |     if (!roomId) test.skip(true, 'No room available');
  81  |     const sendRes = await apiRequest('POST', `/chat/rooms/${roomId}/messages`, {
  82  |       body: { content: `Delete me ${testTimestamp()}`, type: 'text' },
  83  |     });
  84  |     if (!sendRes.data.data?.id) test.skip(true, 'Could not send message');
  85  |     const id = sendRes.data.data.id;
  86  |     const res = await apiRequest('DELETE', `/chat/messages/${id}`);
  87  |     expect([200, 204]).toContain(res.status);
  88  |   });
  89  | 
  90  |   test('TC-CHAT-012: POST /chat/dm creates DM room', async () => {
  91  |     const res = await apiRequest('POST', '/chat/dm', {
  92  |       body: { targetUserId: 1 },
  93  |     });
  94  |     expect([200, 201, 400]).toContain(res.status);
  95  |   });
  96  | 
  97  |   test('TC-CHAT-013: POST /chat/messages/:messageId/reactions toggles', async () => {
  98  |     if (!messageId) test.skip(true, 'No message available');
  99  |     const res = await apiRequest('POST', `/chat/messages/${messageId}/reactions`, {
  100 |       body: { emoji: '👍' },
  101 |     });
  102 |     expect([200, 201]).toContain(res.status);
  103 |   });
  104 | 
  105 |   test('TC-CHAT-015: GET /chat/users returns available users', async () => {
  106 |     const res = await apiRequest('GET', '/chat/users');
> 107 |     expect(res.status).toBe(200);
      |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  108 |     expect(res.data.success).toBe(true);
  109 |     expect(res.data.data).toBeInstanceOf(Array);
  110 |   });
  111 | 
  112 |   test('TC-CHAT-SEC: GET /chat/rooms without token returns 401', async () => {
  113 |     const res = await apiRequestNoAuth('GET', '/chat/rooms');
  114 |     expect(res.status).toBe(401);
  115 |   });
  116 | });
  117 | 
```