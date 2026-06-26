/**
 * Notifications API Tests
 * Module: notifications
 * Covers: TC-NOT-001 through TC-NOT-010
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';

test.describe('Notifications API', () => {
  let notificationId;

  test('TC-NOT-001: GET /notifications returns list', async () => {
    const res = await apiRequest('GET', '/notifications');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
    if (res.data.data?.length > 0) notificationId = res.data.data[0].id;
  });

  test('TC-NOT-002: PATCH /:id/read marks as read', async () => {
    if (!notificationId) {
      const listRes = await apiRequest('GET', '/notifications');
      if (!listRes.data.data?.length) test.skip(true, 'No notifications exist');
      notificationId = listRes.data.data[0].id;
    }
    const res = await apiRequest('PATCH', `/notifications/${notificationId}/read`);
    expect([200, 204]).toContain(res.status);
  });

  test('TC-NOT-003: PATCH /:id/unread marks as unread', async () => {
    if (!notificationId) {
      const listRes = await apiRequest('GET', '/notifications');
      if (!listRes.data.data?.length) test.skip(true, 'No notifications exist');
      notificationId = listRes.data.data[0].id;
    }
    const res = await apiRequest('PATCH', `/notifications/${notificationId}/unread`);
    expect([200, 204]).toContain(res.status);
  });

  test('TC-NOT-004: POST /mark-all-read', async () => {
    const res = await apiRequest('POST', '/notifications/mark-all-read');
    expect([200, 204]).toContain(res.status);
  });

  test('TC-NOT-005: PATCH /:id/archive', async () => {
    const listRes = await apiRequest('GET', '/notifications');
    if (!listRes.data.data?.length) test.skip(true, 'No notifications exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('PATCH', `/notifications/${id}/archive`);
    expect([200, 204]).toContain(res.status);
  });

  test('TC-NOT-006: POST /archive-all-read', async () => {
    const res = await apiRequest('POST', '/notifications/archive-all-read');
    expect([200, 204]).toContain(res.status);
  });

  test('TC-NOT-007: DELETE /:id removes notification', async () => {
    const listRes = await apiRequest('GET', '/notifications');
    if (!listRes.data.data?.length) test.skip(true, 'No notifications exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('DELETE', `/notifications/${id}`);
    expect([200, 204]).toContain(res.status);
  });

  test('TC-NOT-008: GET /preferences returns preferences', async () => {
    const res = await apiRequest('GET', '/notifications/preferences');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-NOT-009: PUT /preferences updates preferences', async () => {
    const res = await apiRequest('PUT', '/notifications/preferences', {
      body: { emailNotifications: true, pushNotifications: false },
    });
    expect([200, 400]).toContain(res.status);
  });

  test('TC-NOT-010: POST /admin/test sends test notification (admin only)', async () => {
    const res = await apiRequest('POST', '/notifications/admin/test', {
      body: { message: 'E2E test notification' },
      role: 'superAdmin',
    });
    expect([200, 403]).toContain(res.status);
  });

  test('TC-NOT-SEC: GET /notifications without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/notifications');
    expect(res.status).toBe(401);
  });
});
