# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: drive-api.spec.js >> Smart Drive API - Folders >> TC-DRV-014: GET /drive/folders/tree
- Location: tests/e2e/specs/drive-api.spec.js:68:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  1   | /**
  2   |  * Smart Drive API Tests
  3   |  * Module: drive
  4   |  * Covers: TC-DRV-001 through TC-DRV-036
  5   |  */
  6   | import { test, expect } from '@playwright/test';
  7   | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  8   | import { sampleFolder, testTimestamp } from '../fixtures/test-data.js';
  9   | 
  10  | test.describe('Smart Drive API - Files', () => {
  11  |   let fileId;
  12  |   let folderId;
  13  | 
  14  |   test('TC-DRV-002: GET /drive/files list files', async () => {
  15  |     const res = await apiRequest('GET', '/drive/files');
  16  |     expect(res.status).toBe(200);
  17  |     expect(res.data).toBeTruthy();
  18  |     if (res.data.data?.length > 0) fileId = res.data.data[0].id;
  19  |   });
  20  | 
  21  |   test('TC-DRV-003: GET /drive/files/search', async () => {
  22  |     const res = await apiRequest('GET', '/drive/files/search?q=test');
  23  |     expect(res.status).toBe(200);
  24  |     expect(res.data).toBeTruthy();
  25  |   });
  26  | 
  27  |   test('TC-DRV-004: GET /drive/files/:fileId', async () => {
  28  |     if (!fileId) test.skip(true, 'No files exist');
  29  |     const res = await apiRequest('GET', `/drive/files/${fileId}`);
  30  |     expect(res.status).toBe(200);
  31  |     expect(res.data).toBeTruthy();
  32  |   });
  33  | 
  34  |   test('TC-DRV-009: PATCH /drive/files/:fileId/star', async () => {
  35  |     if (!fileId) test.skip(true, 'No files exist');
  36  |     const res = await apiRequest('PATCH', `/drive/files/${fileId}/star`);
  37  |     expect([200, 204]).toContain(res.status);
  38  |   });
  39  | 
  40  |   test('TC-DRV-035: GET /drive/storage usage', async () => {
  41  |     const res = await apiRequest('GET', '/drive/storage');
  42  |     expect(res.status).toBe(200);
  43  |     expect(res.data).toBeTruthy();
  44  |   });
  45  | 
  46  |   test('TC-DRV-SEC: GET /drive/files without token returns 401', async () => {
  47  |     const res = await apiRequestNoAuth('GET', '/drive/files');
  48  |     expect(res.status).toBe(401);
  49  |   });
  50  | });
  51  | 
  52  | test.describe('Smart Drive API - Folders', () => {
  53  |   let folderId;
  54  | 
  55  |   test('TC-DRV-012: POST /drive/folders creates folder', async () => {
  56  |     const folder = { ...sampleFolder, name: `E2E-Folder-${testTimestamp()}` };
  57  |     const res = await apiRequest('POST', '/drive/folders', { body: folder });
  58  |     expect([200, 201]).toContain(res.status);
  59  |     if (res.data.data?.id) folderId = res.data.data.id;
  60  |   });
  61  | 
  62  |   test('TC-DRV-013: GET /drive/folders list children', async () => {
  63  |     const res = await apiRequest('GET', '/drive/folders');
  64  |     expect(res.status).toBe(200);
  65  |     expect(res.data).toBeTruthy();
  66  |   });
  67  | 
  68  |   test('TC-DRV-014: GET /drive/folders/tree', async () => {
  69  |     const res = await apiRequest('GET', '/drive/folders/tree');
> 70  |     expect(res.status).toBe(200);
      |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  71  |     expect(res.data).toBeTruthy();
  72  |   });
  73  | 
  74  |   test('TC-DRV-015: PATCH /drive/folders/:folderId updates', async () => {
  75  |     if (!folderId) test.skip(true, 'No folder to update');
  76  |     const res = await apiRequest('PATCH', `/drive/folders/${folderId}`, {
  77  |       body: { name: `Updated-${testTimestamp()}` },
  78  |     });
  79  |     expect([200, 400]).toContain(res.status);
  80  |   });
  81  | 
  82  |   test('TC-DRV-016: DELETE /drive/folders/:folderId/trash soft deletes', async () => {
  83  |     if (!folderId) test.skip(true, 'No folder to delete');
  84  |     const res = await apiRequest('DELETE', `/drive/folders/${folderId}/trash`);
  85  |     expect([200, 204]).toContain(res.status);
  86  |   });
  87  | });
  88  | 
  89  | test.describe('Smart Drive API - Sharing', () => {
  90  |   let fileId;
  91  | 
  92  |   test.beforeAll(async () => {
  93  |     const res = await apiRequest('GET', '/drive/files?limit=1');
  94  |     if (res.data.data?.length > 0) fileId = res.data.data[0].id;
  95  |   });
  96  | 
  97  |   test('TC-DRV-026: GET /drive/shared-with-me', async () => {
  98  |     const res = await apiRequest('GET', '/drive/shared-with-me');
  99  |     expect(res.status).toBe(200);
  100 |     expect(res.data).toBeTruthy();
  101 |   });
  102 | 
  103 |   test('TC-DRV-027: GET /drive/shared-by-me', async () => {
  104 |     const res = await apiRequest('GET', '/drive/shared-by-me');
  105 |     expect(res.status).toBe(200);
  106 |     expect(res.data).toBeTruthy();
  107 |   });
  108 | 
  109 |   test('TC-DRV-023: POST /drive/shares create share', async () => {
  110 |     if (!fileId) test.skip(true, 'No file to share');
  111 |     const res = await apiRequest('POST', '/drive/shares', {
  112 |       body: { fileId, sharedWithUserId: 1, permission: 'view' },
  113 |     });
  114 |     expect([200, 201, 400]).toContain(res.status);
  115 |   });
  116 | 
  117 |   test('TC-DRV-024: GET /drive/files/:fileId/shares list shares', async () => {
  118 |     if (!fileId) test.skip(true, 'No file available');
  119 |     const res = await apiRequest('GET', `/drive/files/${fileId}/shares`);
  120 |     expect(res.status).toBe(200);
  121 |     expect(res.data).toBeTruthy();
  122 |   });
  123 | 
  124 |   test('TC-DRV-028: POST /drive/public-links create public link', async () => {
  125 |     if (!fileId) test.skip(true, 'No file for public link');
  126 |     const res = await apiRequest('POST', '/drive/public-links', {
  127 |       body: { fileId, permission: 'view' },
  128 |     });
  129 |     expect([200, 201, 400]).toContain(res.status);
  130 |   });
  131 | });
  132 | 
  133 | test.describe('Smart Drive API - Comments & Activities', () => {
  134 |   let fileId;
  135 | 
  136 |   test.beforeAll(async () => {
  137 |     const res = await apiRequest('GET', '/drive/files?limit=1');
  138 |     if (res.data.data?.length > 0) fileId = res.data.data[0].id;
  139 |   });
  140 | 
  141 |   test('TC-DRV-031: POST /drive/files/:fileId/comments', async () => {
  142 |     if (!fileId) test.skip(true, 'No file available');
  143 |     const res = await apiRequest('POST', `/drive/files/${fileId}/comments`, {
  144 |       body: { text: `E2E comment ${testTimestamp()}` },
  145 |     });
  146 |     expect([200, 201]).toContain(res.status);
  147 |   });
  148 | 
  149 |   test('TC-DRV-032: GET /drive/files/:fileId/comments', async () => {
  150 |     if (!fileId) test.skip(true, 'No file available');
  151 |     const res = await apiRequest('GET', `/drive/files/${fileId}/comments`);
  152 |     expect(res.status).toBe(200);
  153 |     expect(res.data).toBeTruthy();
  154 |   });
  155 | 
  156 |   test('TC-DRV-034: GET /drive/files/:fileId/activities', async () => {
  157 |     if (!fileId) test.skip(true, 'No file available');
  158 |     const res = await apiRequest('GET', `/drive/files/${fileId}/activities`);
  159 |     expect(res.status).toBe(200);
  160 |     expect(res.data).toBeTruthy();
  161 |   });
  162 | });
  163 | 
```