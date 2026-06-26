# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow-api.spec.js >> Workflow Definitions & Instances API >> TC-WF-022: GET /workflows/instances
- Location: tests/e2e/specs/workflow-api.spec.js:98:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 400
```

# Test source

```ts
  1   | /**
  2   |  * Workflow Documents API Tests
  3   |  * Module: workflow
  4   |  * Covers: TC-WF-001 through TC-WF-025
  5   |  */
  6   | import { test, expect } from '@playwright/test';
  7   | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  8   | import { sampleWorkflowDocument, testTimestamp } from '../fixtures/test-data.js';
  9   | 
  10  | test.describe('Workflow Documents API', () => {
  11  |   let documentId;
  12  | 
  13  |   test('TC-WF-001: POST /workflow-documents creates document', async () => {
  14  |     const doc = { ...sampleWorkflowDocument, title: `E2E-WF-${testTimestamp()}` };
  15  |     const res = await apiRequest('POST', '/workflow-documents', { body: doc });
  16  |     expect([200, 201]).toContain(res.status);
  17  |     if (res.data.data?.id) documentId = res.data.data.id;
  18  |   });
  19  | 
  20  |   test('TC-WF-002: GET /workflow-documents list', async () => {
  21  |     const res = await apiRequest('GET', '/workflow-documents');
  22  |     expect(res.status).toBe(200);
  23  |     expect(res.data).toBeTruthy();
  24  |     if (res.data.data?.length > 0 && !documentId) documentId = res.data.data[0].id;
  25  |   });
  26  | 
  27  |   test('TC-WF-003: GET /workflow-documents/:id', async () => {
  28  |     if (!documentId) test.skip(true, 'No workflow document exists');
  29  |     const res = await apiRequest('GET', `/workflow-documents/${documentId}`);
  30  |     expect(res.status).toBe(200);
  31  |     expect(res.data).toBeTruthy();
  32  |   });
  33  | 
  34  |   test('TC-WF-005: PATCH /workflow-documents/:id/status', async () => {
  35  |     if (!documentId) test.skip(true, 'No workflow document exists');
  36  |     const res = await apiRequest('PATCH', `/workflow-documents/${documentId}/status`, {
  37  |       body: { status: 'submitted' },
  38  |     });
  39  |     expect([200, 400]).toContain(res.status);
  40  |   });
  41  | 
  42  |   test('TC-WF-006: GET /workflow-documents/:id/comments', async () => {
  43  |     if (!documentId) test.skip(true, 'No workflow document exists');
  44  |     const res = await apiRequest('GET', `/workflow-documents/${documentId}/comments`);
  45  |     expect(res.status).toBe(200);
  46  |     expect(res.data).toBeTruthy();
  47  |   });
  48  | 
  49  |   test('TC-WF-007: POST /workflow-documents/:id/comments', async () => {
  50  |     if (!documentId) test.skip(true, 'No workflow document exists');
  51  |     const res = await apiRequest('POST', `/workflow-documents/${documentId}/comments`, {
  52  |       body: { text: `E2E comment ${testTimestamp()}` },
  53  |     });
  54  |     expect([200, 201]).toContain(res.status);
  55  |   });
  56  | 
  57  |   test('TC-WF-015: GET /workflow-documents/compliance', async () => {
  58  |     const res = await apiRequest('GET', '/workflow-documents/compliance');
  59  |     expect(res.status).toBe(200);
  60  |     expect(res.data).toBeTruthy();
  61  |   });
  62  | 
  63  |   test('TC-WF-016: GET /workflow-documents/analytics', async () => {
  64  |     const res = await apiRequest('GET', '/workflow-documents/analytics');
  65  |     expect(res.status).toBe(200);
  66  |     expect(res.data).toBeTruthy();
  67  |   });
  68  | 
  69  |   test('TC-WF-004: DELETE /workflow-documents/:id', async () => {
  70  |     const doc = { ...sampleWorkflowDocument, title: `E2E-DEL-WF-${testTimestamp()}` };
  71  |     const createRes = await apiRequest('POST', '/workflow-documents', { body: doc });
  72  |     if (!createRes.data.data?.id) test.skip(true, 'Could not create workflow document');
  73  |     const id = createRes.data.data.id;
  74  |     const res = await apiRequest('DELETE', `/workflow-documents/${id}`);
  75  |     expect([200, 204]).toContain(res.status);
  76  |   });
  77  | 
  78  |   test('TC-WF-SEC: GET /workflow-documents without token returns 401', async () => {
  79  |     const res = await apiRequestNoAuth('GET', '/workflow-documents');
  80  |     expect(res.status).toBe(401);
  81  |   });
  82  | });
  83  | 
  84  | test.describe('Workflow Definitions & Instances API', () => {
  85  |   test('TC-WF-020: POST /workflows/definitions', async () => {
  86  |     const res = await apiRequest('POST', '/workflows/definitions', {
  87  |       body: { name: `E2E-WF-DEF-${testTimestamp()}`, stages: [] },
  88  |     });
  89  |     expect([200, 201, 400]).toContain(res.status);
  90  |   });
  91  | 
  92  |   test('TC-WF-021: GET /workflows/definitions', async () => {
  93  |     const res = await apiRequest('GET', '/workflows/definitions');
  94  |     expect(res.status).toBe(200);
  95  |     expect(res.data).toBeTruthy();
  96  |   });
  97  | 
  98  |   test('TC-WF-022: GET /workflows/instances', async () => {
  99  |     const res = await apiRequest('GET', '/workflows/instances');
> 100 |     expect(res.status).toBe(200);
      |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  101 |     expect(res.data).toBeTruthy();
  102 |   });
  103 | 
  104 |   test('TC-WF-023: GET /workflows/my-tasks', async () => {
  105 |     const res = await apiRequest('GET', '/workflows/my-tasks');
  106 |     expect(res.status).toBe(200);
  107 |     expect(res.data).toBeTruthy();
  108 |   });
  109 | 
  110 |   test('TC-WF-SEC2: GET /workflows/definitions without token returns 401', async () => {
  111 |     const res = await apiRequestNoAuth('GET', '/workflows/definitions');
  112 |     expect(res.status).toBe(401);
  113 |   });
  114 | });
  115 | 
```