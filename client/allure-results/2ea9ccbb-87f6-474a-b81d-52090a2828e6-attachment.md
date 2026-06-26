# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scheduling-api.spec.js >> Time Slots API >> TC-TS-002: GET /time-slots/schedulable
- Location: tests/e2e/specs/scheduling-api.spec.js:17:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 400
```

# Test source

```ts
  1   | /**
  2   |  * Scheduling API Tests
  3   |  * Module: time-slots, holidays, teacher-availability, schedule-sessions, scheduling-summary
  4   |  * Covers: TC-TS-*, TC-HOL-*, TC-TA-*, TC-SS-*, TC-SSUM-*
  5   |  */
  6   | import { test, expect } from '@playwright/test';
  7   | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  8   | import { sampleHoliday, sampleTimeSlot, testTimestamp } from '../fixtures/test-data.js';
  9   | 
  10  | test.describe('Time Slots API', () => {
  11  |   test('TC-TS-001: GET /time-slots returns list', async () => {
  12  |     const res = await apiRequest('GET', '/time-slots');
  13  |     expect(res.status).toBe(200);
  14  |     expect(res.data.success).toBe(true);
  15  |   });
  16  | 
  17  |   test('TC-TS-002: GET /time-slots/schedulable', async () => {
  18  |     const res = await apiRequest('GET', '/time-slots/schedulable');
> 19  |     expect(res.status).toBe(200);
      |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  20  |     expect(res.data.success).toBe(true);
  21  |   });
  22  | 
  23  |   test('TC-TS-003: POST /time-slots/bulk-init', async () => {
  24  |     const res = await apiRequest('POST', '/time-slots/bulk-init', { body: { programId: 1 } });
  25  |     expect([200, 201]).toContain(res.status);
  26  |   });
  27  | 
  28  |   test('TC-TS-004: GET /time-slots/program/:programId', async () => {
  29  |     const res = await apiRequest('GET', '/time-slots/program/1');
  30  |     expect(res.status).toBe(200);
  31  |     expect(res.data.success).toBe(true);
  32  |   });
  33  | 
  34  |   test('TC-TS-005: POST /time-slots creates', async () => {
  35  |     const slot = { ...sampleTimeSlot, nameEn: `E2E-TS-${testTimestamp()}` };
  36  |     const res = await apiRequest('POST', '/time-slots', { body: slot });
  37  |     expect([200, 201]).toContain(res.status);
  38  |   });
  39  | 
  40  |   test('TC-TS-SEC: GET /time-slots without token returns 401', async () => {
  41  |     const res = await apiRequestNoAuth('GET', '/time-slots');
  42  |     expect(res.status).toBe(401);
  43  |   });
  44  | });
  45  | 
  46  | test.describe('Holidays API', () => {
  47  |   test('TC-HOL-001: GET /holidays returns list', async () => {
  48  |     const res = await apiRequest('GET', '/holidays');
  49  |     expect(res.status).toBe(200);
  50  |     expect(res.data.success).toBe(true);
  51  |   });
  52  | 
  53  |   test('TC-HOL-002: GET /holidays/upcoming', async () => {
  54  |     const res = await apiRequest('GET', '/holidays/upcoming');
  55  |     expect(res.status).toBe(200);
  56  |     expect(res.data.success).toBe(true);
  57  |   });
  58  | 
  59  |   test('TC-HOL-003: GET /holidays/program/:programId', async () => {
  60  |     const res = await apiRequest('GET', '/holidays/program/1');
  61  |     expect(res.status).toBe(200);
  62  |     expect(res.data.success).toBe(true);
  63  |   });
  64  | 
  65  |   test('TC-HOL-004: POST /holidays creates', async () => {
  66  |     const hol = { ...sampleHoliday, nameEn: `E2E-HOL-${testTimestamp()}` };
  67  |     const res = await apiRequest('POST', '/holidays', { body: hol });
  68  |     expect([200, 201]).toContain(res.status);
  69  |   });
  70  | 
  71  |   test('TC-HOL-SEC: GET /holidays without token returns 401', async () => {
  72  |     const res = await apiRequestNoAuth('GET', '/holidays');
  73  |     expect(res.status).toBe(401);
  74  |   });
  75  | });
  76  | 
  77  | test.describe('Teacher Availability API', () => {
  78  |   test('TC-TA-001: GET /teacher-availability returns list', async () => {
  79  |     const res = await apiRequest('GET', '/teacher-availability');
  80  |     expect(res.status).toBe(200);
  81  |     expect(res.data.success).toBe(true);
  82  |   });
  83  | 
  84  |   test('TC-TA-002: GET /teacher-availability/available', async () => {
  85  |     const res = await apiRequest('GET', '/teacher-availability/available?date=2026-07-01');
  86  |     expect(res.status).toBe(200);
  87  |     expect(res.data.success).toBe(true);
  88  |   });
  89  | 
  90  |   test('TC-TA-003: GET /teacher-availability/user/:userId', async () => {
  91  |     const res = await apiRequest('GET', '/teacher-availability/user/1');
  92  |     expect(res.status).toBe(200);
  93  |     expect(res.data.success).toBe(true);
  94  |   });
  95  | 
  96  |   test('TC-TA-004: POST /teacher-availability creates', async () => {
  97  |     const res = await apiRequest('POST', '/teacher-availability', {
  98  |       body: { userId: 1, dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
  99  |     });
  100 |     expect([200, 201, 400]).toContain(res.status);
  101 |   });
  102 | 
  103 |   test('TC-TA-SEC: GET /teacher-availability without token returns 401', async () => {
  104 |     const res = await apiRequestNoAuth('GET', '/teacher-availability');
  105 |     expect(res.status).toBe(401);
  106 |   });
  107 | });
  108 | 
  109 | test.describe('Schedule Sessions API', () => {
  110 |   test('TC-SS-001: GET /schedule-sessions returns list', async () => {
  111 |     const res = await apiRequest('GET', '/schedule-sessions');
  112 |     expect(res.status).toBe(200);
  113 |     expect(res.data.success).toBe(true);
  114 |   });
  115 | 
  116 |   test('TC-SS-002: GET /schedule-sessions/range', async () => {
  117 |     const res = await apiRequest('GET', '/schedule-sessions/range?startDate=2026-07-01&endDate=2026-07-31');
  118 |     expect(res.status).toBe(200);
  119 |     expect(res.data.success).toBe(true);
```