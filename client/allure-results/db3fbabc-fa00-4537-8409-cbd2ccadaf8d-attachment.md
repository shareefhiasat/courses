# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subjects-api.spec.js >> Subjects API >> TC-SUBJ-012: DELETE /subjects with dependencies returns 400
- Location: tests/e2e/specs/subjects-api.spec.js:91:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 404
Received array: [200, 204, 400]
```

# Test source

```ts
  1   | /**
  2   |  * Subjects API Tests
  3   |  * Module: subjects
  4   |  * Covers: TC-SUBJ-001 through TC-SUBJ-012
  5   |  */
  6   | import { test, expect } from '@playwright/test';
  7   | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  8   | import { sampleSubject, testTimestamp } from '../fixtures/test-data.js';
  9   | 
  10  | test.describe('Subjects API', () => {
  11  |   test('TC-SUBJ-001: GET /subjects returns paginated list', async () => {
  12  |     const res = await apiRequest('GET', '/subjects');
  13  |     expect(res.status).toBe(200);
  14  |     expect(res.data.success).toBe(true);
  15  |     expect(res.data.data).toBeInstanceOf(Array);
  16  |   });
  17  | 
  18  |   test('TC-SUBJ-002: GET /subjects with programId filter', async () => {
  19  |     const res = await apiRequest('GET', '/subjects?programId=1');
  20  |     expect(res.status).toBe(200);
  21  |     expect(res.data.success).toBe(true);
  22  |   });
  23  | 
  24  |   test('TC-SUBJ-003: GET /subjects with search query', async () => {
  25  |     const res = await apiRequest('GET', '/subjects?search=test');
  26  |     expect(res.status).toBe(200);
  27  |     expect(res.data.success).toBe(true);
  28  |   });
  29  | 
  30  |   test('TC-SUBJ-004: GET /subjects/:id returns details', async () => {
  31  |     const listRes = await apiRequest('GET', '/subjects?limit=1');
  32  |     if (!listRes.data?.data?.length) test.skip(true, 'No subjects exist');
  33  |     const id = listRes.data.data[0].id;
  34  |     const res = await apiRequest('GET', `/subjects/${id}`);
  35  |     expect(res.status).toBe(200);
  36  |     expect(res.data.data.id).toBe(id);
  37  |   });
  38  | 
  39  |   test('TC-SUBJ-005: GET /subjects/program/:programId returns filtered list', async () => {
  40  |     const res = await apiRequest('GET', '/subjects/program/1');
  41  |     expect(res.status).toBe(200);
  42  |     expect(res.data.success).toBe(true);
  43  |     expect(res.data.data).toBeInstanceOf(Array);
  44  |   });
  45  | 
  46  |   test('TC-SUBJ-006: GET /subjects/subject-types returns types', async () => {
  47  |     const res = await apiRequest('GET', '/subjects/subject-types');
  48  |     expect(res.status).toBe(200);
  49  |     expect(res.data.success).toBe(true);
  50  |     expect(res.data.data).toBeInstanceOf(Array);
  51  |   });
  52  | 
  53  |   test('TC-SUBJ-007: GET /subjects/requirement-types returns types', async () => {
  54  |     const res = await apiRequest('GET', '/subjects/requirement-types');
  55  |     expect(res.status).toBe(200);
  56  |     expect(res.data.success).toBe(true);
  57  |     expect(res.data.data).toBeInstanceOf(Array);
  58  |   });
  59  | 
  60  |   test('TC-SUBJ-008: POST /subjects creates with valid data', async () => {
  61  |     const subj = { ...sampleSubject, code: `E2E-SUBJ-${testTimestamp()}` };
  62  |     const res = await apiRequest('POST', '/subjects', { body: subj });
  63  |     expect([200, 201]).toContain(res.status);
  64  |     expect(res.data.success).toBe(true);
  65  |   });
  66  | 
  67  |   test('TC-SUBJ-009: POST /subjects with missing required fields returns 400', async () => {
  68  |     const res = await apiRequest('POST', '/subjects', { body: {} });
  69  |     expect([400, 500]).toContain(res.status);
  70  |   });
  71  | 
  72  |   test('TC-SUBJ-010: PUT /subjects/:id updates subject', async () => {
  73  |     const listRes = await apiRequest('GET', '/subjects?limit=1');
  74  |     if (!listRes.data?.data?.length) test.skip(true, 'No subjects exist');
  75  |     const id = listRes.data.data[0].id;
  76  |     const res = await apiRequest('PUT', `/subjects/${id}`, {
  77  |       body: { nameEn: `Updated ${testTimestamp()}` },
  78  |     });
  79  |     expect([200, 400]).toContain(res.status);
  80  |   });
  81  | 
  82  |   test('TC-SUBJ-011: DELETE /subjects/:id removes subject', async () => {
  83  |     const subj = { ...sampleSubject, code: `E2E-DEL-S-${testTimestamp()}` };
  84  |     const createRes = await apiRequest('POST', '/subjects', { body: subj });
  85  |     if (!createRes.data?.data?.id) test.skip(true, 'Could not create subject');
  86  |     const id = createRes.data.data.id;
  87  |     const res = await apiRequest('DELETE', `/subjects/${id}`);
  88  |     expect([200, 204]).toContain(res.status);
  89  |   });
  90  | 
  91  |   test('TC-SUBJ-012: DELETE /subjects with dependencies returns 400', async () => {
  92  |     const listRes = await apiRequest('GET', '/subjects?limit=1');
  93  |     if (!listRes.data?.data?.length) test.skip(true, 'No subjects exist');
  94  |     const id = listRes.data.data[0].id;
  95  |     const res = await apiRequest('DELETE', `/subjects/${id}`);
> 96  |     expect([200, 204, 400]).toContain(res.status);
      |                             ^ Error: expect(received).toContain(expected) // indexOf
  97  |   });
  98  | 
  99  |   test('TC-SUBJ-SEC: GET /subjects without token returns 401', async () => {
  100 |     const res = await apiRequestNoAuth('GET', '/subjects');
  101 |     expect(res.status).toBe(401);
  102 |   });
  103 | });
  104 | 
```