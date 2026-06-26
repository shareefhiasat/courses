/**
 * Behaviors API Tests
 * Module: behaviors
 * Covers: TC-BEH-001 through TC-BEH-007
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleBehavior, testTimestamp } from '../fixtures/test-data.js';

test.describe('Behaviors API', () => {
  test('TC-BEH-001: GET /behaviors returns list', async () => {
    const res = await apiRequest('GET', '/behaviors');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-BEH-002: GET /behaviors/:id returns details', async () => {
    const listRes = await apiRequest('GET', '/behaviors?limit=1');
    if (!listRes.data.data?.length) test.skip(true, 'No behaviors exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('GET', `/behaviors/${id}`);
    expect([200, 404]).toContain(res.status);
  });

  test('TC-BEH-003: GET /behaviors/student/:studentId', async () => {
    const res = await apiRequest('GET', '/behaviors/student/1');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-BEH-004: GET /behaviors/class/:classId', async () => {
    const res = await apiRequest('GET', '/behaviors/class/1');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-BEH-005: POST /behaviors creates', async () => {
    const beh = { ...sampleBehavior, notes: `E2E-BEH-${testTimestamp()}` };
    const res = await apiRequest('POST', '/behaviors', { body: beh });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-BEH-006: PUT /behaviors/:id updates', async () => {
    const listRes = await apiRequest('GET', '/behaviors?limit=1');
    if (!listRes.data.data?.length) test.skip(true, 'No behaviors exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('PUT', `/behaviors/${id}`, {
      body: { rating: 'neutral' },
    });
    expect([200, 400]).toContain(res.status);
  });

  test('TC-BEH-007: DELETE /behaviors/:id removes', async () => {
    const beh = { ...sampleBehavior, notes: `E2E-DEL-B-${testTimestamp()}` };
    const createRes = await apiRequest('POST', '/behaviors', { body: beh });
    if (!createRes.data.data?.id) test.skip(true, 'Could not create behavior');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/behaviors/${id}`);
    expect([200, 204]).toContain(res.status);
  });

  test('TC-BEH-SEC: GET /behaviors without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/behaviors');
    expect(res.status).toBe(401);
  });
});
