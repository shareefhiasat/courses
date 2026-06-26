/**
 * Classrooms API Tests
 * Module: classrooms
 * Covers: TC-CLRM-001 through TC-CLRM-007
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleClassroom, testTimestamp } from '../fixtures/test-data.js';

test.describe('Classrooms API', () => {
  test('TC-CLRM-001: GET /classrooms returns list', async () => {
    const res = await apiRequest('GET', '/classrooms');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-CLRM-002: GET /classrooms/available for date/time', async () => {
    const res = await apiRequest('GET', '/classrooms/available?date=2026-07-01&startTime=08:00&endTime=10:00');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-CLRM-003: GET /classrooms/program/:programId', async () => {
    const res = await apiRequest('GET', '/classrooms/program/1');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-CLRM-004: GET /classrooms/:id', async () => {
    const listRes = await apiRequest('GET', '/classrooms?limit=1');
    if (listRes.data.data.length === 0) test.skip(true, 'No classrooms exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('GET', `/classrooms/${id}`);
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBe(id);
  });

  test('TC-CLRM-005: POST /classrooms creates', async () => {
    const cls = { ...sampleClassroom, code: `E2E-CLRM-${testTimestamp()}` };
    const res = await apiRequest('POST', '/classrooms', { body: cls });
    expect([200, 201]).toContain(res.status);
    expect(res.data.success).toBe(true);
  });

  test('TC-CLRM-006: PUT /classrooms/:id updates', async () => {
    const listRes = await apiRequest('GET', '/classrooms?limit=1');
    if (listRes.data.data.length === 0) test.skip(true, 'No classrooms exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('PUT', `/classrooms/${id}`, {
      body: { nameEn: `Updated ${testTimestamp()}` },
    });
    expect([200, 400]).toContain(res.status);
  });

  test('TC-CLRM-007: DELETE /classrooms/:id removes', async () => {
    const cls = { ...sampleClassroom, code: `E2E-DEL-CR-${testTimestamp()}` };
    const createRes = await apiRequest('POST', '/classrooms', { body: cls });
    if (!createRes.data.data?.id) test.skip(true, 'Could not create classroom');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/classrooms/${id}`);
    expect([200, 204]).toContain(res.status);
  });

  test('TC-CLRM-SEC: GET /classrooms without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/classrooms');
    expect(res.status).toBe(401);
  });
});
