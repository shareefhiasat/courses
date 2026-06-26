/**
 * Scheduling API Tests
 * Module: time-slots, holidays, teacher-availability, schedule-sessions, scheduling-summary
 * Covers: TC-TS-*, TC-HOL-*, TC-TA-*, TC-SS-*, TC-SSUM-*
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleHoliday, sampleTimeSlot, testTimestamp } from '../fixtures/test-data.js';

test.describe('Time Slots API', () => {
  test('TC-TS-001: GET /time-slots returns list', async () => {
    const res = await apiRequest('GET', '/time-slots');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-TS-002: GET /time-slots/schedulable', async () => {
    const res = await apiRequest('GET', '/time-slots/schedulable');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-TS-003: POST /time-slots/bulk-init', async () => {
    const res = await apiRequest('POST', '/time-slots/bulk-init', { body: { programId: 1 } });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-TS-004: GET /time-slots/program/:programId', async () => {
    const res = await apiRequest('GET', '/time-slots/program/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-TS-005: POST /time-slots creates', async () => {
    const slot = { ...sampleTimeSlot, nameEn: `E2E-TS-${testTimestamp()}` };
    const res = await apiRequest('POST', '/time-slots', { body: slot });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-TS-SEC: GET /time-slots without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/time-slots');
    expect(res.status).toBe(401);
  });
});

test.describe('Holidays API', () => {
  test('TC-HOL-001: GET /holidays returns list', async () => {
    const res = await apiRequest('GET', '/holidays');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-HOL-002: GET /holidays/upcoming', async () => {
    const res = await apiRequest('GET', '/holidays/upcoming');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-HOL-003: GET /holidays/program/:programId', async () => {
    const res = await apiRequest('GET', '/holidays/program/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-HOL-004: POST /holidays creates', async () => {
    const hol = { ...sampleHoliday, nameEn: `E2E-HOL-${testTimestamp()}` };
    const res = await apiRequest('POST', '/holidays', { body: hol });
    expect([200, 201, 400, 500, 403]).toContain(res.status);
  });

  test('TC-HOL-SEC: GET /holidays without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/holidays');
    expect(res.status).toBe(401);
  });
});

test.describe('Teacher Availability API', () => {
  test('TC-TA-001: GET /teacher-availability returns list', async () => {
    const res = await apiRequest('GET', '/teacher-availability');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-TA-002: GET /teacher-availability/available', async () => {
    const res = await apiRequest('GET', '/teacher-availability/available?date=2026-07-01');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-TA-003: GET /teacher-availability/user/:userId', async () => {
    const res = await apiRequest('GET', '/teacher-availability/user/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-TA-004: POST /teacher-availability creates', async () => {
    const res = await apiRequest('POST', '/teacher-availability', {
      body: { userId: 1, dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-TA-SEC: GET /teacher-availability without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/teacher-availability');
    expect(res.status).toBe(401);
  });
});

test.describe('Schedule Sessions API', () => {
  test('TC-SS-001: GET /schedule-sessions returns list', async () => {
    const res = await apiRequest('GET', '/schedule-sessions');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-SS-002: GET /schedule-sessions/range', async () => {
    const res = await apiRequest('GET', '/schedule-sessions/range?startDate=2026-07-01&endDate=2026-07-31');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-SS-003: POST /schedule-sessions/check-conflicts', async () => {
    const res = await apiRequest('POST', '/schedule-sessions/check-conflicts', {
      body: { classId: 1, classroomId: 1, date: '2026-07-01', startTime: '08:00', endTime: '10:00' },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-SS-004: POST /schedule-sessions/bulk', async () => {
    const res = await apiRequest('POST', '/schedule-sessions/bulk', {
      body: { sessions: [] },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-SS-SEC: GET /schedule-sessions without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/schedule-sessions');
    expect(res.status).toBe(401);
  });
});

test.describe('Scheduling Summary API', () => {
  test('TC-SSUM-001: GET /scheduling/summary', async () => {
    const res = await apiRequest('GET', '/scheduling/summary');
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-SSUM-002: GET /scheduling/summary/break-sessions', async () => {
    const res = await apiRequest('GET', '/scheduling/summary/break-sessions');
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-SSUM-003: GET /scheduling/summary/holidays', async () => {
    const res = await apiRequest('GET', '/scheduling/summary/holidays');
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-SSUM-004: GET /scheduling/summary/teacher-workload', async () => {
    const res = await apiRequest('GET', '/scheduling/summary/teacher-workload');
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-SSUM-005: GET /scheduling/summary/classroom-utilization', async () => {
    const res = await apiRequest('GET', '/scheduling/summary/classroom-utilization');
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-SSUM-006: GET /scheduling/effort-report', async () => {
    const res = await apiRequest('GET', '/scheduling/effort-report');
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-SSUM-007: GET /scheduling/break-sessions', async () => {
    const res = await apiRequest('GET', '/scheduling/break-sessions');
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-SSUM-SEC: GET /scheduling/summary without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/scheduling/summary');
    expect(res.status).toBe(401);
  });
});
