# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: activities-api.spec.js >> Activities API >> TC-ACT-002: GET /activities/:id returns details
- Location: tests/e2e/specs/activities-api.spec.js:23:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Test source

```ts
  1  | /**
  2  |  * Activities API Tests
  3  |  * Module: activities
  4  |  * Covers: TC-ACT-001 through TC-ACT-008
  5  |  *
  6  |  * Business Context:
  7  |  * Activities are course assignments and tasks given to students.
  8  |  * Instructors create activities per class; students submit work.
  9  |  * Activities support file attachments and due dates.
  10 |  */
  11 | import { test, expect } from '@playwright/test';
  12 | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  13 | import { sampleActivity, testTimestamp } from '../fixtures/test-data.js';
  14 | 
  15 | test.describe('Activities API', () => {
  16 |   test('TC-ACT-001: GET /activities returns list', async () => {
  17 |     const res = await apiRequest('GET', '/activities');
  18 |     expect(res.status).toBe(200);
  19 |     expect(res.data.success).toBe(true);
  20 |     expect(res.data.data).toBeInstanceOf(Array);
  21 |   });
  22 | 
  23 |   test('TC-ACT-002: GET /activities/:id returns details', async () => {
  24 |     const listRes = await apiRequest('GET', '/activities?limit=1');
  25 |     if (!listRes.data?.data?.length) test.skip(true, 'No activities exist');
  26 |     const id = listRes.data.data[0].id;
  27 |     const res = await apiRequest('GET', `/activities/${id}`);
> 28 |     expect(res.status).toBe(200);
     |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  29 |     expect(res.data.data.id).toBe(id);
  30 |   });
  31 | 
  32 |   test('TC-ACT-003: GET /activities/class/:classId', async () => {
  33 |     const res = await apiRequest('GET', '/activities/class/1');
  34 |     expect(res.status).toBe(200);
  35 |     expect(res.data.success).toBe(true);
  36 |   });
  37 | 
  38 |   test('TC-ACT-004: POST /activities creates activity', async () => {
  39 |     const act = { ...sampleActivity, titleEn: `E2E-ACT-${testTimestamp()}` };
  40 |     const res = await apiRequest('POST', '/activities', { body: act });
  41 |     expect([200, 201]).toContain(res.status);
  42 |     expect(res.data.success).toBe(true);
  43 |   });
  44 | 
  45 |   test('TC-ACT-005: POST /activities with missing fields returns 400', async () => {
  46 |     const res = await apiRequest('POST', '/activities', { body: {} });
  47 |     expect([400, 500]).toContain(res.status);
  48 |   });
  49 | 
  50 |   test('TC-ACT-006: PUT /activities/:id updates activity', async () => {
  51 |     const listRes = await apiRequest('GET', '/activities?limit=1');
  52 |     if (!listRes.data?.data?.length) test.skip(true, 'No activities exist');
  53 |     const id = listRes.data.data[0].id;
  54 |     const res = await apiRequest('PUT', `/activities/${id}`, {
  55 |       body: { titleEn: `Updated ${testTimestamp()}` },
  56 |     });
  57 |     expect([200, 400]).toContain(res.status);
  58 |   });
  59 | 
  60 |   test('TC-ACT-007: DELETE /activities/:id removes activity', async () => {
  61 |     const act = { ...sampleActivity, titleEn: `E2E-DEL-A-${testTimestamp()}` };
  62 |     const createRes = await apiRequest('POST', '/activities', { body: act });
  63 |     if (!createRes.data?.data?.id) test.skip(true, 'Could not create activity');
  64 |     const id = createRes.data.data.id;
  65 |     const res = await apiRequest('DELETE', `/activities/${id}`);
  66 |     expect([200, 204]).toContain(res.status);
  67 |   });
  68 | 
  69 |   test('TC-ACT-008: DELETE /activities with submissions returns 400', async () => {
  70 |     const listRes = await apiRequest('GET', '/activities?limit=1');
  71 |     if (!listRes.data?.data?.length) test.skip(true, 'No activities exist');
  72 |     const id = listRes.data.data[0].id;
  73 |     const res = await apiRequest('DELETE', `/activities/${id}`);
  74 |     expect([200, 204, 400]).toContain(res.status);
  75 |   });
  76 | 
  77 |   // RBAC: Student cannot create activities
  78 |   test('TC-ACT-RBAC-STUDENT: Student cannot create activity', async () => {
  79 |     const res = await apiRequest('POST', '/activities', {
  80 |       body: sampleActivity,
  81 |       role: 'student',
  82 |     });
  83 |     expect([403, 401, 400]).toContain(res.status);
  84 |   });
  85 | 
  86 |   // RBAC: Instructor can create activities
  87 |   test('TC-ACT-RBAC-INSTR: Instructor can create activity', async () => {
  88 |     const act = { ...sampleActivity, titleEn: `E2E-INSTR-${testTimestamp()}` };
  89 |     const res = await apiRequest('POST', '/activities', { body: act, role: 'instructor' });
  90 |     expect([200, 201, 400, 403]).toContain(res.status);
  91 |   });
  92 | 
  93 |   test('TC-ACT-SEC: GET /activities without token returns 401', async () => {
  94 |     const res = await apiRequestNoAuth('GET', '/activities');
  95 |     expect(res.status).toBe(401);
  96 |   });
  97 | });
  98 | 
```