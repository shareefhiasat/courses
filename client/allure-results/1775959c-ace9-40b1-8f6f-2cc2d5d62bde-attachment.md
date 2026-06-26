# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: attendance-api.spec.js >> Attendance API >> TC-ATT-004: POST /attendance creates record
- Location: tests/e2e/specs/attendance-api.spec.js:39:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 400
Received array: [200, 201]
```

# Test source

```ts
  1  | /**
  2  |  * Attendance API Tests
  3  |  * Module: attendance
  4  |  * Covers: TC-ATT-001 through TC-ATT-006
  5  |  *
  6  |  * Business Context:
  7  |  * Attendance is a core daily operation for instructors and HR.
  8  |  * Students are marked present/absent/late per class session.
  9  |  * HR uses attendance for compliance reporting.
  10 |  * High priority for military training compliance.
  11 |  */
  12 | import { test, expect } from '@playwright/test';
  13 | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  14 | import { sampleAttendance, testTimestamp } from '../fixtures/test-data.js';
  15 | 
  16 | test.describe('Attendance API', () => {
  17 |   test('TC-ATT-001: GET /attendance returns list', async () => {
  18 |     const res = await apiRequest('GET', '/attendance');
  19 |     expect(res.status).toBe(200);
  20 |     expect(res.data.success).toBe(true);
  21 |     expect(res.data.data).toBeInstanceOf(Array);
  22 |   });
  23 | 
  24 |   test('TC-ATT-002: GET /attendance/stats returns class stats', async () => {
  25 |     const res = await apiRequest('GET', '/attendance/stats?classId=1');
  26 |     expect(res.status).toBe(200);
  27 |     expect(res.data.success).toBe(true);
  28 |   });
  29 | 
  30 |   test('TC-ATT-003: GET /attendance/:id returns details', async () => {
  31 |     const listRes = await apiRequest('GET', '/attendance?limit=1');
  32 |     if (listRes.data.data.length === 0) test.skip(true, 'No attendance records exist');
  33 |     const id = listRes.data.data[0].id;
  34 |     const res = await apiRequest('GET', `/attendance/${id}`);
  35 |     expect(res.status).toBe(200);
  36 |     expect(res.data.data.id).toBe(id);
  37 |   });
  38 | 
  39 |   test('TC-ATT-004: POST /attendance creates record', async () => {
  40 |     const att = { ...sampleAttendance, date: new Date().toISOString().split('T')[0] };
  41 |     const res = await apiRequest('POST', '/attendance', { body: att });
> 42 |     expect([200, 201]).toContain(res.status);
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  43 |     expect(res.data.success).toBe(true);
  44 |   });
  45 | 
  46 |   test('TC-ATT-005: PUT /attendance/:id updates record', async () => {
  47 |     const listRes = await apiRequest('GET', '/attendance?limit=1');
  48 |     if (listRes.data.data.length === 0) test.skip(true, 'No attendance records exist');
  49 |     const id = listRes.data.data[0].id;
  50 |     const res = await apiRequest('PUT', `/attendance/${id}`, {
  51 |       body: { status: 'late' },
  52 |     });
  53 |     expect([200, 400]).toContain(res.status);
  54 |   });
  55 | 
  56 |   test('TC-ATT-006: DELETE /attendance/:id removes record', async () => {
  57 |     const att = { ...sampleAttendance, date: new Date().toISOString().split('T')[0] };
  58 |     const createRes = await apiRequest('POST', '/attendance', { body: att });
  59 |     if (!createRes.data.data?.id) test.skip(true, 'Could not create attendance record');
  60 |     const id = createRes.data.data.id;
  61 |     const res = await apiRequest('DELETE', `/attendance/${id}`);
  62 |     expect([200, 204]).toContain(res.status);
  63 |   });
  64 | 
  65 |   // RBAC: Instructor can mark attendance
  66 |   test('TC-ATT-RBAC-INSTR: Instructor can create attendance', async () => {
  67 |     const att = { ...sampleAttendance, date: new Date().toISOString().split('T')[0] };
  68 |     const res = await apiRequest('POST', '/attendance', { body: att, role: 'instructor' });
  69 |     expect([200, 201, 403]).toContain(res.status);
  70 |   });
  71 | 
  72 |   // RBAC: Student cannot mark attendance
  73 |   test('TC-ATT-RBAC-STUDENT: Student cannot create attendance', async () => {
  74 |     const att = { ...sampleAttendance, date: new Date().toISOString().split('T')[0] };
  75 |     const res = await apiRequest('POST', '/attendance', { body: att, role: 'student' });
  76 |     expect([403, 401]).toContain(res.status);
  77 |   });
  78 | 
  79 |   // RBAC: HR can view all attendance
  80 |   test('TC-ATT-RBAC-HR: HR can list attendance', async () => {
  81 |     const res = await apiRequest('GET', '/attendance', { role: 'instructor' });
  82 |     expect([200, 403]).toContain(res.status);
  83 |   });
  84 | 
  85 |   test('TC-ATT-SEC: GET /attendance without token returns 401', async () => {
  86 |     const res = await apiRequestNoAuth('GET', '/attendance');
  87 |     expect(res.status).toBe(401);
  88 |   });
  89 | });
  90 | 
```