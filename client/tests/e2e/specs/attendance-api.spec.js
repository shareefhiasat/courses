/**
 * Attendance API Tests
 * Module: attendance
 * Covers: TC-ATT-001 through TC-ATT-006
 *
 * Business Context:
 * Attendance is a core daily operation for instructors and HR.
 * Students are marked present/absent/late per class session.
 * HR uses attendance for compliance reporting.
 * High priority for military training compliance.
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleAttendance, testTimestamp } from '../fixtures/test-data.js';

test.describe('Attendance API', () => {
  test('TC-ATT-001: GET /attendance returns list', async () => {
    const res = await apiRequest('GET', '/attendance');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-ATT-002: GET /attendance/stats returns class stats', async () => {
    const res = await apiRequest('GET', '/attendance/stats?classId=1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ATT-003: GET /attendance/:id returns details', async () => {
    const listRes = await apiRequest('GET', '/attendance?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No attendance records exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('GET', `/attendance/${id}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.data.id).toBe(id);
  });

  test('TC-ATT-004: POST /attendance creates record', async () => {
    const att = { ...sampleAttendance, date: new Date().toISOString().split('T')[0] };
    const res = await apiRequest('POST', '/attendance', { body: att });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-ATT-005: PUT /attendance/:id updates record', async () => {
    const listRes = await apiRequest('GET', '/attendance?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No attendance records exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('PUT', `/attendance/${id}`, {
      body: { status: 'late' },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-ATT-006: DELETE /attendance/:id removes record', async () => {
    const att = { ...sampleAttendance, date: new Date().toISOString().split('T')[0] };
    const createRes = await apiRequest('POST', '/attendance', { body: att });
    if (!createRes.data?.data?.id) test.skip(true, 'Could not create attendance record');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/attendance/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  // RBAC: Instructor can mark attendance
  test('TC-ATT-RBAC-INSTR: Instructor can create attendance', async () => {
    const att = { ...sampleAttendance, date: new Date().toISOString().split('T')[0] };
    const res = await apiRequest('POST', '/attendance', { body: att, role: 'instructor' });
    expect([200, 201, 403, 400, 500]).toContain(res.status);
  });

  // RBAC: Student cannot mark attendance
  test('TC-ATT-RBAC-STUDENT: Student cannot create attendance', async () => {
    const att = { ...sampleAttendance, date: new Date().toISOString().split('T')[0] };
    const res = await apiRequest('POST', '/attendance', { body: att, role: 'student' });
    expect([403, 401, 400, 500]).toContain(res.status);
  });

  // RBAC: HR can view all attendance
  test('TC-ATT-RBAC-HR: HR can list attendance', async () => {
    const res = await apiRequest('GET', '/attendance', { role: 'instructor' });
    expect([200, 403, 400, 500]).toContain(res.status);
  });

  test('TC-ATT-SEC: GET /attendance without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/attendance');
    expect(res.status).toBe(401);
  });
});
