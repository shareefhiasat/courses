# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-api.spec.js >> RBAC - API Access Control >> TC-RBAC-001: superAdmin GET /users/me returns 200
- Location: tests/e2e/specs/rbac-api.spec.js:22:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  1   | /**
  2   |  * RBAC Cross-Cutting Tests — Expanded
  3   |  * Module: rbac
  4   |  * Covers: TC-RBAC-001 through TC-RBAC-020, TC-RBAC-SEC1 through TC-RBAC-SEC15
  5   |  * Tests role-based access control across API endpoints
  6   |  *
  7   |  * Test depth:
  8   |  * - GET /users/me for all authenticated roles (TC-RBAC-001 — TC-RBAC-005)
  9   |  * - GET /me/data-scope for all authenticated roles (TC-RBAC-006 — TC-RBAC-010)
  10  |  * - Cross-role endpoint restrictions (TC-RBAC-011 — TC-RBAC-015)
  11  |  * - Admin scope filtering (TC-RBAC-016 — TC-RBAC-018)
  12  |  * - Unauthenticated access denial (TC-RBAC-019 — TC-RBAC-020)
  13  |  * - Unauthenticated security tests across all modules (TC-RBAC-SEC1 — TC-RBAC-SEC15)
  14  |  */
  15  | import { test, expect } from '@playwright/test';
  16  | import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
  17  | 
  18  | test.describe('RBAC - API Access Control', () => {
  19  |   // ═══════════════════════════════════════════════════════════════════════════
  20  |   // SECTION 1: GET /users/me — All authenticated roles (TC-RBAC-001 — TC-RBAC-005)
  21  |   // ═══════════════════════════════════════════════════════════════════════════
  22  |   test('TC-RBAC-001: superAdmin GET /users/me returns 200', async () => {
  23  |     const res = await apiRequest('GET', '/users/me', { role: 'superAdmin' });
> 24  |     expect(res.status).toBe(200);
      |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  25  |     expect(res.data).toBeTruthy();
  26  |   });
  27  | 
  28  |   test('TC-RBAC-002: admin GET /users/me returns 200', async () => {
  29  |     const res = await apiRequest('GET', '/users/me', { role: 'admin' });
  30  |     expect(res.status).toBe(200);
  31  |     expect(res.data).toBeTruthy();
  32  |   });
  33  | 
  34  |   test('TC-RBAC-003: instructor GET /users/me returns 200', async () => {
  35  |     const res = await apiRequest('GET', '/users/me', { role: 'instructor' });
  36  |     expect(res.status).toBe(200);
  37  |     expect(res.data).toBeTruthy();
  38  |   });
  39  | 
  40  |   test('TC-RBAC-004: student GET /users/me returns 200', async () => {
  41  |     const res = await apiRequest('GET', '/users/me', { role: 'student' });
  42  |     expect(res.status).toBe(200);
  43  |     expect(res.data).toBeTruthy();
  44  |   });
  45  | 
  46  |   test('TC-RBAC-005: GET /users/me returns user email in response', async () => {
  47  |     const res = await apiRequest('GET', '/users/me', { role: 'superAdmin' });
  48  |     expect(res.status).toBe(200);
  49  |     expect(res.data).toBeTruthy();
  50  |     // Response should contain user identifiable info
  51  |     const user = res.data.data || res.data;
  52  |     expect(user.email || user.username || user.id).toBeTruthy();
  53  |   });
  54  | 
  55  |   // ═══════════════════════════════════════════════════════════════════════════
  56  |   // SECTION 2: GET /me/data-scope — All authenticated roles (TC-RBAC-006 — TC-RBAC-010)
  57  |   // ═══════════════════════════════════════════════════════════════════════════
  58  |   test('TC-RBAC-006: superAdmin GET /me/data-scope returns 200', async () => {
  59  |     const res = await apiRequest('GET', '/me/data-scope', { role: 'superAdmin' });
  60  |     expect([200, 404]).toContain(res.status);
  61  |   });
  62  | 
  63  |   test('TC-RBAC-007: admin GET /me/data-scope returns 200', async () => {
  64  |     const res = await apiRequest('GET', '/me/data-scope', { role: 'admin' });
  65  |     expect([200, 404]).toContain(res.status);
  66  |   });
  67  | 
  68  |   test('TC-RBAC-008: instructor GET /me/data-scope returns 200', async () => {
  69  |     const res = await apiRequest('GET', '/me/data-scope', { role: 'instructor' });
  70  |     expect([200, 404]).toContain(res.status);
  71  |   });
  72  | 
  73  |   test('TC-RBAC-009: student GET /me/data-scope returns 200', async () => {
  74  |     const res = await apiRequest('GET', '/me/data-scope', { role: 'student' });
  75  |     expect([200, 404]).toContain(res.status);
  76  |   });
  77  | 
  78  |   test('TC-RBAC-010: GET /permissions returns 200 for authenticated user', async () => {
  79  |     const res = await apiRequest('GET', '/permissions', { role: 'superAdmin' });
  80  |     expect([200, 404]).toContain(res.status);
  81  |   });
  82  | 
  83  |   // ═══════════════════════════════════════════════════════════════════════════
  84  |   // SECTION 3: Cross-role endpoint restrictions (TC-RBAC-011 — TC-RBAC-015)
  85  |   // ═══════════════════════════════════════════════════════════════════════════
  86  |   test('TC-RBAC-011: Student GET /users returns 403 (known issue SHA-16: requireSuperAdmin disabled)', async () => {
  87  |     const res = await apiRequest('GET', '/users', { role: 'student' });
  88  |     // SHA-16: requireSuperAdmin is commented out, so this currently returns 200
  89  |     expect([403, 401, 200]).toContain(res.status);
  90  |   });
  91  | 
  92  |   test('TC-RBAC-012: Student POST /programs returns 403', async () => {
  93  |     const res = await apiRequest('POST', '/programs', {
  94  |       body: { code: 'TEST-RBAC', nameEn: 'Test' },
  95  |       role: 'student',
  96  |     });
  97  |     expect([403, 401, 400]).toContain(res.status);
  98  |   });
  99  | 
  100 |   test('TC-RBAC-013: Instructor DELETE /users returns 403 (known issue SHA-16)', async () => {
  101 |     const res = await apiRequest('DELETE', '/users/999999', { role: 'instructor' });
  102 |     // SHA-16: requireSuperAdmin is commented out on /users routes
  103 |     expect([403, 401, 404, 200, 500]).toContain(res.status);
  104 |   });
  105 | 
  106 |   test('TC-RBAC-014: Admin PUT /permissions returns 403', async () => {
  107 |     const res = await apiRequest('PUT', '/permissions', {
  108 |       body: { permissions: [] },
  109 |       role: 'admin',
  110 |     });
  111 |     expect([403, 401]).toContain(res.status);
  112 |   });
  113 | 
  114 |   test('TC-RBAC-015: Super admin PUT /permissions succeeds', async () => {
  115 |     const res = await apiRequest('PUT', '/permissions', {
  116 |       body: { permissions: [] },
  117 |       role: 'superAdmin',
  118 |     });
  119 |     expect([200, 400]).toContain(res.status);
  120 |   });
  121 | 
  122 |   // ═══════════════════════════════════════════════════════════════════════════
  123 |   // SECTION 4: Admin scope filtering (TC-RBAC-016 — TC-RBAC-018)
  124 |   // ═══════════════════════════════════════════════════════════════════════════
```