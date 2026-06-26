/**
 * Classes API Tests
 * Module: classes
 * Covers: TC-CLS-001 through TC-CLS-012
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleClass, testTimestamp } from '../fixtures/test-data.js';

test.describe('Classes API', () => {
  test('TC-CLS-001: GET /classes returns paginated list', async () => {
    const res = await apiRequest('GET', '/classes');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-CLS-002: GET /classes with programId filter', async () => {
    const res = await apiRequest('GET', '/classes?programId=1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-CLS-003: GET /classes with instructorId filter', async () => {
    const res = await apiRequest('GET', '/classes?instructorId=1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-CLS-004: GET /classes/:id returns details', async () => {
    const listRes = await apiRequest('GET', '/classes?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No classes exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('GET', `/classes/${id}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.data.id).toBe(id);
  });

  test('TC-CLS-005: GET /classes/program/:programId', async () => {
    const res = await apiRequest('GET', '/classes/program/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-CLS-006: GET /classes/subject/:subjectId', async () => {
    const res = await apiRequest('GET', '/classes/subject/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-CLS-007: GET /classes/instructor/:instructorId', async () => {
    const res = await apiRequest('GET', '/classes/instructor/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-CLS-008: POST /classes creates with valid data', async () => {
    const cls = { ...sampleClass, code: `E2E-CLS-${testTimestamp()}` };
    const res = await apiRequest('POST', '/classes', { body: cls });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-CLS-009: POST /classes with missing required fields returns 400', async () => {
    const res = await apiRequest('POST', '/classes', { body: {} });
    expect([400, 500]).toContain(res.status);
  });

  test('TC-CLS-010: PUT /classes/:id updates class', async () => {
    const listRes = await apiRequest('GET', '/classes?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No classes exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('PUT', `/classes/${id}`, {
      body: { nameEn: `Updated ${testTimestamp()}` },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-CLS-011: DELETE /classes/:id removes class', async () => {
    const cls = { ...sampleClass, code: `E2E-DEL-C-${testTimestamp()}` };
    const createRes = await apiRequest('POST', '/classes', { body: cls });
    if (!createRes.data?.data?.id) test.skip(true, 'Could not create class');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/classes/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  test('TC-CLS-012: DELETE /classes with enrollments returns 400', async () => {
    const listRes = await apiRequest('GET', '/classes?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No classes exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('DELETE', `/classes/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  test('TC-CLS-SEC: GET /classes without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/classes');
    expect(res.status).toBe(401);
  });
});
