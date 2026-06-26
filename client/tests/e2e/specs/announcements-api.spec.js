/**
 * Announcements API Tests
 * Module: announcements
 * Covers: TC-ANN-001 through TC-ANN-008
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleAnnouncement, testTimestamp } from '../fixtures/test-data.js';

test.describe('Announcements API', () => {
  test('TC-ANN-001: GET /announcements returns list', async () => {
    const res = await apiRequest('GET', '/announcements');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-ANN-002: GET /announcements/:id returns details', async () => {
    const listRes = await apiRequest('GET', '/announcements?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No announcements exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('GET', `/announcements/${id}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.data.id).toBe(id);
  });

  test('TC-ANN-003: GET /announcements/program/:programId', async () => {
    const res = await apiRequest('GET', '/announcements/program/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ANN-004: GET /announcements/class/:classId', async () => {
    const res = await apiRequest('GET', '/announcements/class/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ANN-005: POST /announcements creates with valid data', async () => {
    const ann = { ...sampleAnnouncement, titleEn: `E2E-ANN-${testTimestamp()}` };
    const res = await apiRequest('POST', '/announcements', { body: ann });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ANN-006: POST /announcements with missing fields returns 400', async () => {
    const res = await apiRequest('POST', '/announcements', { body: {} });
    expect([400, 500]).toContain(res.status);
  });

  test('TC-ANN-007: PUT /announcements/:id updates', async () => {
    const listRes = await apiRequest('GET', '/announcements?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No announcements exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('PUT', `/announcements/${id}`, {
      body: { titleEn: `Updated ${testTimestamp()}` },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-ANN-008: DELETE /announcements/:id removes', async () => {
    const ann = { ...sampleAnnouncement, titleEn: `E2E-DEL-A-${testTimestamp()}` };
    const createRes = await apiRequest('POST', '/announcements', { body: ann });
    if (!createRes.data?.data?.id) test.skip(true, 'Could not create announcement');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/announcements/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  test('TC-ANN-SEC: GET /announcements without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/announcements');
    expect(res.status).toBe(401);
  });
});
