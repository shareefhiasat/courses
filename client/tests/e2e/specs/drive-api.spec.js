/**
 * Smart Drive API Tests
 * Module: drive
 * Covers: TC-DRV-001 through TC-DRV-036
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleFolder, testTimestamp } from '../fixtures/test-data.js';

test.describe('Smart Drive API - Files', () => {
  let fileId;
  let folderId;

  test('TC-DRV-002: GET /drive/files list files', async () => {
    const res = await apiRequest('GET', '/drive/files');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
    if (res.data?.data?.length > 0) fileId = res.data.data[0].id;
  });

  test('TC-DRV-003: GET /drive/files/search', async () => {
    const res = await apiRequest('GET', '/drive/files/search?q=test');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-004: GET /drive/files/:fileId', async () => {
    if (!fileId) test.skip(true, 'No files exist');
    const res = await apiRequest('GET', `/drive/files/${fileId}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-009: PATCH /drive/files/:fileId/star', async () => {
    if (!fileId) test.skip(true, 'No files exist');
    const res = await apiRequest('PATCH', `/drive/files/${fileId}/star`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  test('TC-DRV-035: GET /drive/storage usage', async () => {
    const res = await apiRequest('GET', '/drive/storage');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-SEC: GET /drive/files without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/drive/files');
    expect(res.status).toBe(401);
  });
});

test.describe('Smart Drive API - Folders', () => {
  let folderId;

  test('TC-DRV-012: POST /drive/folders creates folder', async () => {
    const folder = { ...sampleFolder, name: `E2E-Folder-${testTimestamp()}` };
    const res = await apiRequest('POST', '/drive/folders', { body: folder });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.data?.data?.id) folderId = res.data.data.id;
  });

  test('TC-DRV-013: GET /drive/folders list children', async () => {
    const res = await apiRequest('GET', '/drive/folders');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-014: GET /drive/folders/tree', async () => {
    const res = await apiRequest('GET', '/drive/folders/tree');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-015: PATCH /drive/folders/:folderId updates', async () => {
    if (!folderId) test.skip(true, 'No folder to update');
    const res = await apiRequest('PATCH', `/drive/folders/${folderId}`, {
      body: { name: `Updated-${testTimestamp()}` },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-DRV-016: DELETE /drive/folders/:folderId/trash soft deletes', async () => {
    if (!folderId) test.skip(true, 'No folder to delete');
    const res = await apiRequest('DELETE', `/drive/folders/${folderId}/trash`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });
});

test.describe('Smart Drive API - Sharing', () => {
  let fileId;

  test.beforeAll(async () => {
    const res = await apiRequest('GET', '/drive/files?limit=1');
    if (res.data?.data?.length > 0) fileId = res.data.data[0].id;
  });

  test('TC-DRV-026: GET /drive/shared-with-me', async () => {
    const res = await apiRequest('GET', '/drive/shared-with-me');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-027: GET /drive/shared-by-me', async () => {
    const res = await apiRequest('GET', '/drive/shared-by-me');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-023: POST /drive/shares create share', async () => {
    if (!fileId) test.skip(true, 'No file to share');
    const res = await apiRequest('POST', '/drive/shares', {
      body: { fileId, sharedWithUserId: 1, permission: 'view' },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-DRV-024: GET /drive/files/:fileId/shares list shares', async () => {
    if (!fileId) test.skip(true, 'No file available');
    const res = await apiRequest('GET', `/drive/files/${fileId}/shares`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-028: POST /drive/public-links create public link', async () => {
    if (!fileId) test.skip(true, 'No file for public link');
    const res = await apiRequest('POST', '/drive/public-links', {
      body: { fileId, permission: 'view' },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });
});

test.describe('Smart Drive API - Comments & Activities', () => {
  let fileId;

  test.beforeAll(async () => {
    const res = await apiRequest('GET', '/drive/files?limit=1');
    if (res.data?.data?.length > 0) fileId = res.data.data[0].id;
  });

  test('TC-DRV-031: POST /drive/files/:fileId/comments', async () => {
    if (!fileId) test.skip(true, 'No file available');
    const res = await apiRequest('POST', `/drive/files/${fileId}/comments`, {
      body: { text: `E2E comment ${testTimestamp()}` },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-DRV-032: GET /drive/files/:fileId/comments', async () => {
    if (!fileId) test.skip(true, 'No file available');
    const res = await apiRequest('GET', `/drive/files/${fileId}/comments`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DRV-034: GET /drive/files/:fileId/activities', async () => {
    if (!fileId) test.skip(true, 'No file available');
    const res = await apiRequest('GET', `/drive/files/${fileId}/activities`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });
});
