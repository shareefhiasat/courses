/**
 * Standup Attendance & Attendance Amendment API Tests
 * Module: standup-attendance, attendance-amendment, instructor-history, audit-export, weekly-summary
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';

test.describe('Standup Attendance API', () => {
  test('TC-STD-001: POST /standup-attendance creates', async () => {
    const res = await apiRequest('POST', '/standup-attendance', {
      body: { userId: 1, date: new Date().toISOString().split('T')[0] },
    });
    expect([200, 201, 400]).toContain(res.status);
  });

  test('TC-STD-002: GET /standup-attendance/user/:userId/date/:date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await apiRequest('GET', `/standup-attendance/user/1/date/${today}`);
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-STD-003: GET /standup-attendance/user/:userId', async () => {
    const res = await apiRequest('GET', '/standup-attendance/user/1');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-STD-004: GET /standup-attendance/class?classId=1&date=2026-07-01', async () => {
    const res = await apiRequest('GET', '/standup-attendance/class?classId=1&date=2026-07-01');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-STD-005: GET /standup-attendance/date/:date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await apiRequest('GET', `/standup-attendance/date/${today}`);
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-STD-006: GET /standup-attendance/program?programId=1&date=2026-07-01', async () => {
    const res = await apiRequest('GET', '/standup-attendance/program?programId=1&date=2026-07-01');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-STD-007: GET /standup-attendance/program/range?programId=1&startDate=2026-07-01&endDate=2026-07-31', async () => {
    const res = await apiRequest('GET', '/standup-attendance/program/range?programId=1&startDate=2026-07-01&endDate=2026-07-31');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-STD-SEC: GET /standup-attendance without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/standup-attendance/date/2026-07-01');
    expect(res.status).toBe(401);
  });
});

test.describe('Attendance Amendment API', () => {
  test('TC-AA-001: POST /attendance-amendment creates', async () => {
    const res = await apiRequest('POST', '/attendance-amendment', {
      body: { attendanceId: 1, reason: 'E2E test amendment' },
    });
    expect([200, 201, 400]).toContain(res.status);
  });

  test('TC-AA-002: GET /attendance-amendment/:attendanceId', async () => {
    const res = await apiRequest('GET', '/attendance-amendment/1');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-AA-003: GET /attendance-amendment (all)', async () => {
    const res = await apiRequest('GET', '/attendance-amendment');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });
});

test.describe('Instructor History API', () => {
  test('TC-IH-001: GET /instructor-history/class/:classId', async () => {
    const res = await apiRequest('GET', '/instructor-history/class/1');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-IH-002: GET /instructor-history/instructor/:instructorId', async () => {
    const res = await apiRequest('GET', '/instructor-history/instructor/1');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-IH-003: GET /instructor-history/session/:sessionId', async () => {
    const res = await apiRequest('GET', '/instructor-history/session/1');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-IH-004: GET /instructor-history/workload/:instructorId', async () => {
    const res = await apiRequest('GET', '/instructor-history/workload/1');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });
});

test.describe('Audit Export API', () => {
  test('TC-AE-001: GET /audit-export/workflow-status-history', async () => {
    const res = await apiRequest('GET', '/audit-export/workflow-status-history');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-AE-002: GET /audit-export/permission-denials', async () => {
    const res = await apiRequest('GET', '/audit-export/permission-denials');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });
});

test.describe('Weekly Summary API', () => {
  test('TC-WS-001: POST /weekly-summary/generate', async () => {
    const res = await apiRequest('POST', '/weekly-summary/generate', {
      body: { weekStart: '2026-07-01', weekEnd: '2026-07-07' },
    });
    expect([200, 201, 400]).toContain(res.status);
  });

  test('TC-WS-002: GET /weekly-summary/daily-documents', async () => {
    const res = await apiRequest('GET', '/weekly-summary/daily-documents?date=2026-07-01');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });
});

test.describe('Help Items API', () => {
  test('TC-HELP-001: GET /help-items', async () => {
    const res = await apiRequest('GET', '/help-items');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-HELP-002: GET /help-items/page/:page', async () => {
    const res = await apiRequest('GET', '/help-items/page/dashboard');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-HELP-003: GET /help-items/organized', async () => {
    const res = await apiRequest('GET', '/help-items/organized');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });
});
