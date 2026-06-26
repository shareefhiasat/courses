# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: penalties-api.spec.js >> Penalties API >> TC-PEN-004: GET /penalties/class/:classId
- Location: tests/e2e/specs/penalties-api.spec.js:33:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  1  | /**
  2  |  * Penalties API Tests
  3  |  * Module: penalties
  4  |  * Covers: TC-PEN-001 through TC-PEN-007
  5  |  */
  6  | import { test, expect } from '@playwright/test';
  7  | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  8  | import { samplePenalty, testTimestamp } from '../fixtures/test-data.js';
  9  | 
  10 | test.describe('Penalties API', () => {
  11 |   test('TC-PEN-001: GET /penalties returns list', async () => {
  12 |     const res = await apiRequest('GET', '/penalties');
  13 |     expect(res.status).toBe(200);
  14 |     expect(res.data.success).toBe(true);
  15 |     expect(res.data.data).toBeInstanceOf(Array);
  16 |   });
  17 | 
  18 |   test('TC-PEN-002: GET /penalties/:id returns details', async () => {
  19 |     const listRes = await apiRequest('GET', '/penalties?limit=1');
  20 |     if (!listRes.data?.data?.length) test.skip(true, 'No penalties exist');
  21 |     const id = listRes.data.data[0].id;
  22 |     const res = await apiRequest('GET', `/penalties/${id}`);
  23 |     expect(res.status).toBe(200);
  24 |     expect(res.data.data.id).toBe(id);
  25 |   });
  26 | 
  27 |   test('TC-PEN-003: GET /penalties/student/:studentId', async () => {
  28 |     const res = await apiRequest('GET', '/penalties/student/1');
  29 |     expect(res.status).toBe(200);
  30 |     expect(res.data.success).toBe(true);
  31 |   });
  32 | 
  33 |   test('TC-PEN-004: GET /penalties/class/:classId', async () => {
  34 |     const res = await apiRequest('GET', '/penalties/class/1');
> 35 |     expect(res.status).toBe(200);
     |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  36 |     expect(res.data.success).toBe(true);
  37 |   });
  38 | 
  39 |   test('TC-PEN-005: POST /penalties creates penalty', async () => {
  40 |     const pen = { ...samplePenalty, descriptionEn: `E2E-PEN-${testTimestamp()}` };
  41 |     const res = await apiRequest('POST', '/penalties', { body: pen });
  42 |     expect([200, 201]).toContain(res.status);
  43 |     expect(res.data.success).toBe(true);
  44 |   });
  45 | 
  46 |   test('TC-PEN-006: PUT /penalties/:id updates', async () => {
  47 |     const listRes = await apiRequest('GET', '/penalties?limit=1');
  48 |     if (!listRes.data?.data?.length) test.skip(true, 'No penalties exist');
  49 |     const id = listRes.data.data[0].id;
  50 |     const res = await apiRequest('PUT', `/penalties/${id}`, {
  51 |       body: { points: 10 },
  52 |     });
  53 |     expect([200, 400]).toContain(res.status);
  54 |   });
  55 | 
  56 |   test('TC-PEN-007: DELETE /penalties/:id removes', async () => {
  57 |     const pen = { ...samplePenalty, descriptionEn: `E2E-DEL-P-${testTimestamp()}` };
  58 |     const createRes = await apiRequest('POST', '/penalties', { body: pen });
  59 |     if (!createRes.data?.data?.id) test.skip(true, 'Could not create penalty');
  60 |     const id = createRes.data.data.id;
  61 |     const res = await apiRequest('DELETE', `/penalties/${id}`);
  62 |     expect([200, 204]).toContain(res.status);
  63 |   });
  64 | 
  65 |   test('TC-PEN-SEC: GET /penalties without token returns 401', async () => {
  66 |     const res = await apiRequestNoAuth('GET', '/penalties');
  67 |     expect(res.status).toBe(401);
  68 |   });
  69 | });
  70 | 
```