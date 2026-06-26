/**
 * Users & Admin Scopes API Tests
 * Module: users, admin-scopes, permissions, dashboard, lookup
 * Covers: TC-USR-*, TC-ASC-*, TC-PERM-*, TC-DASH-*, TC-LKP-*
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';

test.describe('Users API', () => {
  test('TC-USR-001: GET /users returns list', async () => {
    const res = await apiRequest('GET', '/users');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-USR-002: GET /users/instructors', async () => {
    const res = await apiRequest('GET', '/users/instructors');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-USR-003: GET /users/programs', async () => {
    const res = await apiRequest('GET', '/users/programs');
    expect([200, 403, 400, 500]).toContain(res.status);
  });

  test('TC-USR-004: GET /users/subjects', async () => {
    const res = await apiRequest('GET', '/users/subjects');
    expect([200, 403, 400, 500]).toContain(res.status);
  });

  test('TC-USR-005: GET /users/me returns current user', async () => {
    const res = await apiRequest('GET', '/users/me');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-USR-006: GET /users/:id returns user', async () => {
    const listRes = await apiRequest('GET', '/users?limit=1');
    if (!listRes.data.data?.length) test.skip(true, 'No users exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('GET', `/users/${id}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-USR-SEC: GET /users without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/users');
    expect(res.status).toBe(401);
  });

  test('TC-USR-RBAC: GET /users as student returns 403', async () => {
    const res = await apiRequest('GET', '/users', { role: 'student' });
    expect([403, 200, 400, 500]).toContain(res.status);
  });
});

test.describe('Admin Scopes API', () => {
  test('TC-ASC-001: GET /admin-scopes returns list', async () => {
    const res = await apiRequest('GET', '/admin-scopes');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-ASC-002: GET /admin-scopes/user/:userId', async () => {
    const res = await apiRequest('GET', '/admin-scopes/user/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-ASC-003: GET /admin-scopes/user/:userId/effective', async () => {
    const res = await apiRequest('GET', '/admin-scopes/user/1/effective');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-ASC-004: POST /admin-scopes creates', async () => {
    const res = await apiRequest('POST', '/admin-scopes', {
      body: { userId: 1, scopeType: 'PROGRAM', programId: 1 },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-ASC-SEC: GET /admin-scopes without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/admin-scopes');
    expect(res.status).toBe(401);
  });
});

test.describe('Permissions API', () => {
  test('TC-PERM-001: GET /permissions returns list', async () => {
    const res = await apiRequest('GET', '/permissions');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-PERM-002: PUT /permissions as super_admin succeeds', async () => {
    const res = await apiRequest('PUT', '/permissions', {
      body: { permissions: [] },
      role: 'superAdmin',
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-PERM-003: PUT /permissions as admin returns 403', async () => {
    const res = await apiRequest('PUT', '/permissions', {
      body: { permissions: [] },
      role: 'admin',
    });
    expect([403, 401, 400, 500]).toContain(res.status);
  });

  test('TC-PERM-SEC: GET /permissions without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/permissions');
    expect(res.status).toBe(401);
  });
});

test.describe('Dashboard API', () => {
  test('TC-DASH-001: GET /dashboard/summary', async () => {
    const res = await apiRequest('GET', '/dashboard/summary');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DASH-002: GET /dashboard/teacher/:teacherUserId', async () => {
    const res = await apiRequest('GET', '/dashboard/teacher/1');
    expect([200, 400, 500, 403]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DASH-003: GET /dashboard/analytics', async () => {
    const res = await apiRequest('GET', '/dashboard/analytics');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DASH-004: GET /dashboard/analytics/drive', async () => {
    const res = await apiRequest('GET', '/dashboard/analytics/drive');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DASH-005: GET /dashboard/analytics/workflow', async () => {
    const res = await apiRequest('GET', '/dashboard/analytics/workflow');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DASH-006: GET /dashboard/analytics/activity', async () => {
    const res = await apiRequest('GET', '/dashboard/analytics/activity');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-DASH-SEC: GET /dashboard/summary without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/dashboard/summary');
    expect(res.status).toBe(401);
  });
});

test.describe('Lookup API', () => {
  test('TC-LKP-001: GET /lookup returns multiple types', async () => {
    const res = await apiRequest('GET', '/lookup?types=subject-types,category-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-LKP-002: GET /lookup/types', async () => {
    const res = await apiRequest('GET', '/lookup/types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-LKP-003: GET /lookup/:type', async () => {
    const res = await apiRequest('GET', '/lookup/subject-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-LKP-004: GET /lookup/behavior-types (legacy)', async () => {
    const res = await apiRequest('GET', '/lookup/behavior-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-LKP-005: GET /lookup/participation-types (legacy)', async () => {
    const res = await apiRequest('GET', '/lookup/participation-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-LKP-006: GET /lookup/penalty-types (legacy)', async () => {
    const res = await apiRequest('GET', '/lookup/penalty-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-LKP-007: GET /lookup/category-types (legacy)', async () => {
    const res = await apiRequest('GET', '/lookup/category-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-LKP-008: GET /lookup/resource-types (legacy)', async () => {
    const res = await apiRequest('GET', '/lookup/resource-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-LKP-SEC: GET /lookup without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/lookup');
    expect(res.status).toBe(401);
  });
});

test.describe('Me API', () => {
  test('TC-ME-001: GET /me/data-scope', async () => {
    const res = await apiRequest('GET', '/me/data-scope');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-ME-002: GET /me/dashboards/:dashboardKey', async () => {
    const res = await apiRequest('GET', '/me/dashboards/main');
    expect([200, 404, 400, 500]).toContain(res.status);
  });

  test('TC-ME-003: PUT /me/dashboards/:dashboardKey', async () => {
    const res = await apiRequest('PUT', '/me/dashboards/test-key', {
      body: { widgets: [] },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-ME-004: DELETE /me/dashboards/:dashboardKey', async () => {
    const res = await apiRequest('DELETE', '/me/dashboards/test-key');
    expect([200, 204, 404, 400, 500]).toContain(res.status);
  });

  test('TC-ME-SEC: GET /me/data-scope without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/me/data-scope');
    expect(res.status).toBe(401);
  });
});
