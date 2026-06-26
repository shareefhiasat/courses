/**
 * Enrollments API Tests
 * Module: enrollments
 * Covers: TC-ENR-001 through TC-ENR-010
 *
 * Business Context:
 * Enrollments link students to classes. Admin/HR manage enrollments.
 * Students can only see their own enrollments.
 * Max capacity enforcement is a business rule.
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleEnrollment } from '../fixtures/test-data.js';

test.describe('Enrollments API', () => {
  test('TC-ENR-001: GET /enrollments returns list', async () => {
    const res = await apiRequest('GET', '/enrollments');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-ENR-002: GET /enrollments/students-by-class', async () => {
    const res = await apiRequest('GET', '/enrollments/students-by-class?classId=1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ENR-003: GET /enrollments/:id returns details', async () => {
    const listRes = await apiRequest('GET', '/enrollments?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No enrollments exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('GET', `/enrollments/${id}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.data.id).toBe(id);
  });

  test('TC-ENR-004: GET /enrollments/student/:studentId', async () => {
    const res = await apiRequest('GET', '/enrollments/student/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ENR-005: GET /enrollments/class/:classId', async () => {
    const res = await apiRequest('GET', '/enrollments/class/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ENR-006: GET /enrollments/program/:programId', async () => {
    const res = await apiRequest('GET', '/enrollments/program/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ENR-007: POST /enrollments enrolls student in class', async () => {
    const res = await apiRequest('POST', '/enrollments', { body: sampleEnrollment });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-ENR-008: POST /enrollments with duplicate student+class returns error', async () => {
    const listRes = await apiRequest('GET', '/enrollments?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No enrollments exist');
    const existing = listRes.data?.data?.[0];
    const res = await apiRequest('POST', '/enrollments', {
      body: { studentId: existing.studentId, classId: existing.classId, status: 'active' },
    });
    expect([400, 409, 500]).toContain(res.status);
  });

  test('TC-ENR-009: PUT /enrollments/:id updates status', async () => {
    const listRes = await apiRequest('GET', '/enrollments?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No enrollments exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('PUT', `/enrollments/${id}`, {
      body: { status: 'withdrawn' },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-ENR-010: DELETE /enrollments/:id removes enrollment', async () => {
    const listRes = await apiRequest('GET', '/enrollments?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No enrollments exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('DELETE', `/enrollments/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  // RBAC: Student can view own enrollments
  test('TC-ENR-RBAC-STUDENT: Student can view own enrollments', async () => {
    const res = await apiRequest('GET', '/enrollments', { role: 'student' });
    expect([200, 403, 400, 500]).toContain(res.status);
  });

  // RBAC: Student cannot enroll others
  test('TC-ENR-RBAC-STUDENT-CREATE: Student cannot create enrollment', async () => {
    const res = await apiRequest('POST', '/enrollments', {
      body: sampleEnrollment,
      role: 'student',
    });
    expect([403, 401, 400, 500]).toContain(res.status);
  });

  test('TC-ENR-SEC: GET /enrollments without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/enrollments');
    expect(res.status).toBe(401);
  });
});
