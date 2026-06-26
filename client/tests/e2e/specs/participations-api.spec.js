/**
 * Participations API Tests
 * Module: participations
 * Covers: TC-PAR-001 through TC-PAR-010
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleParticipation, testTimestamp } from '../fixtures/test-data.js';

test.describe('Participations API', () => {
  test('TC-PAR-001: GET /participations returns list', async () => {
    const res = await apiRequest('GET', '/participations');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-PAR-002: GET /participations/stats returns student stats', async () => {
    const res = await apiRequest('GET', '/participations/stats?studentId=1');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-PAR-003: GET /participations/class-stats', async () => {
    const res = await apiRequest('GET', '/participations/class-stats?classId=1');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-PAR-004: GET /participations/:id', async () => {
    const listRes = await apiRequest('GET', '/participations?limit=1');
    if (listRes.data.data.length === 0) test.skip(true, 'No participations exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('GET', `/participations/${id}`);
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBe(id);
  });

  test('TC-PAR-005: GET /participations/student/:studentId', async () => {
    const res = await apiRequest('GET', '/participations/student/1');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-PAR-006: GET /participations/class/:classId', async () => {
    const res = await apiRequest('GET', '/participations/class/1');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-PAR-007: GET /participations/activity/:activityId', async () => {
    const res = await apiRequest('GET', '/participations/activity/1');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test('TC-PAR-008: POST /participations creates', async () => {
    const par = { ...sampleParticipation };
    const res = await apiRequest('POST', '/participations', { body: par });
    expect([200, 201]).toContain(res.status);
    expect(res.data.success).toBe(true);
  });

  test('TC-PAR-009: PUT /participations/:id updates', async () => {
    const listRes = await apiRequest('GET', '/participations?limit=1');
    if (listRes.data.data.length === 0) test.skip(true, 'No participations exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('PUT', `/participations/${id}`, {
      body: { points: 15 },
    });
    expect([200, 400]).toContain(res.status);
  });

  test('TC-PAR-010: DELETE /participations/:id removes', async () => {
    const par = { ...sampleParticipation };
    const createRes = await apiRequest('POST', '/participations', { body: par });
    if (!createRes.data.data?.id) test.skip(true, 'Could not create participation');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/participations/${id}`);
    expect([200, 204]).toContain(res.status);
  });

  test('TC-PAR-SEC: GET /participations without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/participations');
    expect(res.status).toBe(401);
  });
});
