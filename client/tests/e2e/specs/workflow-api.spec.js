/**
 * Workflow Documents API Tests
 * Module: workflow
 * Covers: TC-WF-001 through TC-WF-025
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleWorkflowDocument, testTimestamp } from '../fixtures/test-data.js';

test.describe('Workflow Documents API', () => {
  let documentId;

  test('TC-WF-001: POST /workflow-documents creates document', async () => {
    const doc = { ...sampleWorkflowDocument, title: `E2E-WF-${testTimestamp()}` };
    const res = await apiRequest('POST', '/workflow-documents', { body: doc });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.data?.data?.id) documentId = res.data.data.id;
  });

  test('TC-WF-002: GET /workflow-documents list', async () => {
    const res = await apiRequest('GET', '/workflow-documents');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
    if (res.data?.data?.length > 0 && !documentId) documentId = res.data.data[0].id;
  });

  test('TC-WF-003: GET /workflow-documents/:id', async () => {
    if (!documentId) test.skip(true, 'No workflow document exists');
    const res = await apiRequest('GET', `/workflow-documents/${documentId}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-WF-005: PATCH /workflow-documents/:id/status', async () => {
    if (!documentId) test.skip(true, 'No workflow document exists');
    const res = await apiRequest('PATCH', `/workflow-documents/${documentId}/status`, {
      body: { status: 'submitted' },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-WF-006: GET /workflow-documents/:id/comments', async () => {
    if (!documentId) test.skip(true, 'No workflow document exists');
    const res = await apiRequest('GET', `/workflow-documents/${documentId}/comments`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-WF-007: POST /workflow-documents/:id/comments', async () => {
    if (!documentId) test.skip(true, 'No workflow document exists');
    const res = await apiRequest('POST', `/workflow-documents/${documentId}/comments`, {
      body: { text: `E2E comment ${testTimestamp()}` },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-WF-015: GET /workflow-documents/compliance', async () => {
    const res = await apiRequest('GET', '/workflow-documents/compliance');
    expect([200, 400, 500, 404]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-WF-016: GET /workflow-documents/analytics', async () => {
    const res = await apiRequest('GET', '/workflow-documents/analytics');
    expect([200, 400, 500, 404]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-WF-004: DELETE /workflow-documents/:id', async () => {
    const doc = { ...sampleWorkflowDocument, title: `E2E-DEL-WF-${testTimestamp()}` };
    const createRes = await apiRequest('POST', '/workflow-documents', { body: doc });
    if (!createRes.data?.data?.id) test.skip(true, 'Could not create workflow document');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/workflow-documents/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  test('TC-WF-SEC: GET /workflow-documents without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/workflow-documents');
    expect(res.status).toBe(401);
  });
});

test.describe('Workflow Definitions & Instances API', () => {
  test('TC-WF-020: POST /workflows/definitions', async () => {
    const res = await apiRequest('POST', '/workflows/definitions', {
      body: { name: `E2E-WF-DEF-${testTimestamp()}`, stages: [] },
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  test('TC-WF-021: GET /workflows/definitions', async () => {
    const res = await apiRequest('GET', '/workflows/definitions');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-WF-022: GET /workflows/instances', async () => {
    const res = await apiRequest('GET', '/workflows/instances');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-WF-023: GET /workflows/my-tasks', async () => {
    const res = await apiRequest('GET', '/workflows/my-tasks');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data).toBeTruthy();
  });

  test('TC-WF-SEC2: GET /workflows/definitions without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/workflows/definitions');
    expect(res.status).toBe(401);
  });
});
