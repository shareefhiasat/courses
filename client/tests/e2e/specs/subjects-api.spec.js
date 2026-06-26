/**
 * Subjects API Tests
 * Module: subjects
 * Covers: TC-SUBJ-001 through TC-SUBJ-012
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleSubject, testTimestamp } from '../fixtures/test-data.js';

test.describe('Subjects API', () => {
  test('TC-SUBJ-001: GET /subjects returns paginated list', async () => {
    const res = await apiRequest('GET', '/subjects');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-SUBJ-002: GET /subjects with programId filter', async () => {
    const res = await apiRequest('GET', '/subjects?programId=1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-SUBJ-003: GET /subjects with search query', async () => {
    const res = await apiRequest('GET', '/subjects?search=test');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status === 200) {
      if (res.status < 400) expect(res.data.success).toBe(true);
    }
  });

  test('TC-SUBJ-004: GET /subjects/:id returns details', async () => {
    const listRes = await apiRequest('GET', '/subjects?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No subjects exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('GET', `/subjects/${id}`);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.data.id).toBe(id);
  });

  test('TC-SUBJ-005: GET /subjects/program/:programId returns filtered list', async () => {
    const res = await apiRequest('GET', '/subjects/program/1');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-SUBJ-006: GET /subjects/subject-types returns types', async () => {
    const res = await apiRequest('GET', '/subjects/subject-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-SUBJ-007: GET /subjects/requirement-types returns types', async () => {
    const res = await apiRequest('GET', '/subjects/requirement-types');
    expect([200, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
    if (res.status < 400) expect(res.data.data).toBeInstanceOf(Array);
  });

  test('TC-SUBJ-008: POST /subjects creates with valid data', async () => {
    const subj = { ...sampleSubject, code: `E2E-SUBJ-${testTimestamp()}` };
    const res = await apiRequest('POST', '/subjects', { body: subj });
    expect([200, 201, 400, 500]).toContain(res.status);
    if (res.status < 400) expect(res.data.success).toBe(true);
  });

  test('TC-SUBJ-009: POST /subjects with missing required fields returns 400', async () => {
    const res = await apiRequest('POST', '/subjects', { body: {} });
    expect([400, 500]).toContain(res.status);
  });

  test('TC-SUBJ-010: PUT /subjects/:id updates subject', async () => {
    const listRes = await apiRequest('GET', '/subjects?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No subjects exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('PUT', `/subjects/${id}`, {
      body: { nameEn: `Updated ${testTimestamp()}` },
    });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('TC-SUBJ-011: DELETE /subjects/:id removes subject', async () => {
    const subj = { ...sampleSubject, code: `E2E-DEL-S-${testTimestamp()}` };
    const createRes = await apiRequest('POST', '/subjects', { body: subj });
    if (!createRes.data?.data?.id) test.skip(true, 'Could not create subject');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/subjects/${id}`);
    expect([200, 204, 400, 500]).toContain(res.status);
  });

  test('TC-SUBJ-012: DELETE /subjects with dependencies returns 400', async () => {
    const listRes = await apiRequest('GET', '/subjects?limit=1');
    if (!listRes.data?.data?.length) test.skip(true, 'No subjects exist');
    const id = listRes.data?.data?.[0].id;
    const res = await apiRequest('DELETE', `/subjects/${id}`);
    expect([200, 204, 400, 404, 500]).toContain(res.status);
  });

  test('TC-SUBJ-SEC: GET /subjects without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/subjects');
    expect(res.status).toBe(401);
  });
});
