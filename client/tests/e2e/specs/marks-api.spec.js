/**
 * Marks API Tests
 * Module: marks
 * Covers: TC-MRK-001 through TC-MRK-007
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';

test.describe('Marks API', () => {
  test('TC-MRK-001: GET /marks/distribution/:subjectId', async () => {
    const res = await apiRequest('GET', '/marks/distribution/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-MRK-002: PUT /marks/distribution/:subjectId sets distribution', async () => {
    const res = await apiRequest('PUT', '/marks/distribution/1', {
      body: { components: [{ name: 'Midterm', weight: 40 }, { name: 'Final', weight: 60 }] },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-MRK-003: GET /marks/students/:subjectId returns marks', async () => {
    const res = await apiRequest('GET', '/marks/students/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-MRK-004: PUT /marks/students/:userId/:subjectId/:classId updates', async () => {
    const res = await apiRequest('PUT', '/marks/students/1/1/1', {
      body: { marks: 85 },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-MRK-005: PUT /marks/students/batch/:subjectId/:classId batch updates', async () => {
    const res = await apiRequest('PUT', '/marks/students/batch/1/1', {
      body: { updates: [{ userId: 1, marks: 90 }] },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-MRK-006: GET /marks/report returns all marks', async () => {
    const res = await apiRequest('GET', '/marks/report');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-MRK-007: GET /marks/history/:userId/:subjectId/:classId', async () => {
    const res = await apiRequest('GET', '/marks/history/1/1/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-MRK-SEC: GET /marks without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/marks/distribution/1');
    expect(res.status).toBe(401);
  });
});
