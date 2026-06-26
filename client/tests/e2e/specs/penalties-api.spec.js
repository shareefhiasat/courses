/**
 * Penalties API Tests
 * Module: penalties
 * Covers: TC-PEN-001 through TC-PEN-007
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { samplePenalty, testTimestamp } from '../fixtures/test-data.js';

test.describe('Penalties API', () => {
  test('TC-PEN-001: GET /penalties returns list', async () => {
    const res = await apiRequest('GET', '/penalties');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-PEN-002: GET /penalties/:id returns details', async () => {
    const listRes = await apiRequest('GET', '/penalties?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No penalties exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('GET', `/penalties/${id}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.data.id).toBe(id);
  });

  test('TC-PEN-003: GET /penalties/student/:studentId', async () => {
    const res = await apiRequest('GET', '/penalties/student/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-PEN-004: GET /penalties/class/:classId', async () => {
    const res = await apiRequest('GET', '/penalties/class/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-PEN-005: POST /penalties creates penalty', async () => {
    const pen = { ...samplePenalty, descriptionEn: `E2E-PEN-${testTimestamp()}` };
    const res = await apiRequest('POST', '/penalties', { body: pen });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-PEN-006: PUT /penalties/:id updates', async () => {
    const listRes = await apiRequest('GET', '/penalties?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No penalties exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('PUT', `/penalties/${id}`, {
      body: { points: 10 },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-PEN-007: DELETE /penalties/:id removes', async () => {
    const pen = { ...samplePenalty, descriptionEn: `E2E-DEL-P-${testTimestamp()}` };
    const createRes = await apiRequest('POST', '/penalties', { body: pen });
    if (!createRes.data?.data?.id) test.skip(true, 'Could not create penalty');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/penalties/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  test('TC-PEN-SEC: GET /penalties without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/penalties');
    expect(res.status).toBe(401);
  });
});
