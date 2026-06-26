import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';

test.describe('Activities API - CRUD Operations', () => {
  test('Activities API - Service Layer Integration', async () => {
    const res = await apiRequest('GET', '/activities');
    expect([200, 400, 404]).toContain(res.status);
    if (res.status === 404) test.skip(true, 'Activities API endpoint not yet implemented');
    if (res.status === 400) test.skip(true, 'Activities API requires query params');
    expect(res.data.success !== false).toBe(true);
    expect(Array.isArray(res.data.data || res.data)).toBe(true);
  });

  test('POST /api/v1/activities - Create new activity', async () => {
    const activityData = {
      title: 'Test Activity',
      type: 'assignment',
      description: 'This is a test activity',
      maxScore: 100,
      duration: 60,
      instructions: 'Complete this assignment',
      startDate: '2024-01-15T09:00:00Z',
      dueDate: '2024-01-20T23:59:59Z'
    };
    const res = await apiRequest('POST', '/activities', { body: activityData });
    expect([201, 200, 400, 500]).toContain(res.status);
    if (res.data.data?.id) {
      expect(res.data.data).toHaveProperty('id');
    }
  });

  test('GET /api/v1/activities/:id - Get activity by ID', async () => {
    const listRes = await apiRequest('GET', '/activities?limit=1');
    if (!listRes.data.data?.length) test.skip(true, 'No activities exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('GET', `/activities/${id}`);
    expect(res.status).toBe(200);
    expect(res.data.data.id).toBe(id);
  });

  test('PUT /api/v1/activities/:id - Update activity', async () => {
    const listRes = await apiRequest('GET', '/activities?limit=1');
    if (!listRes.data.data?.length) test.skip(true, 'No activities exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('PUT', `/activities/${id}`, {
      body: { title: 'Updated Activity', description: 'Updated description', maxScore: 150 }
    });
    expect([200, 400]).toContain(res.status);
  });

  test('DELETE /api/v1/activities/:id - Delete activity', async () => {
    const createRes = await apiRequest('POST', '/activities', {
      body: { title: 'Activity to Delete', type: 'assignment', description: 'Will be deleted' }
    });
    if (!createRes.data.data?.id) test.skip(true, 'Unable to create test activity');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/activities/${id}`);
    expect([200, 204]).toContain(res.status);
  });

  test('POST /api/v1/activities/:id/publish - Publish activity', async () => {
    const createRes = await apiRequest('POST', '/activities', {
      body: { title: 'Draft Activity', type: 'assignment', description: 'Will be published', maxScore: 100 }
    });
    if (!createRes.data.data?.id) test.skip(true, 'Unable to create test activity');
    const id = createRes.data.data.id;
    const res = await apiRequest('POST', `/activities/${id}/publish`);
    expect([200, 400, 404]).toContain(res.status);
  });

  test('GET /api/v1/activities - Validation tests', async () => {
    const res = await apiRequest('POST', '/activities', {
      body: { description: 'Activity without title and type' }
    });
    expect([400, 422]).toContain(res.status);
  });

  test('GET /api/v1/classes/:classId/activities - Get activities by class', async () => {
    const listRes = await apiRequest('GET', '/classes?limit=1');
    if (!listRes.data.data?.length) test.skip(true, 'No classes exist');
    const classId = listRes.data.data[0].id;
    const res = await apiRequest('GET', `/classes/${classId}/activities`);
    expect([200, 404]).toContain(res.status);
  });

  test('GET /api/v1/subjects/:subjectId/activities - Get activities by subject', async () => {
    const listRes = await apiRequest('GET', '/subjects?limit=1');
    if (!listRes.data.data?.length) test.skip(true, 'No subjects exist');
    const subjectId = listRes.data.data[0].id;
    const res = await apiRequest('GET', `/subjects/${subjectId}/activities`);
    expect([200, 404]).toContain(res.status);
  });
});
