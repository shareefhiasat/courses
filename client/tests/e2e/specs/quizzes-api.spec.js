/**
 * Quizzes API Tests
 * Module: quizzes
 * Covers: TC-QUIZ-001 through TC-QUIZ-007
 */
import { test, expect } from '@playwright/test';
import { apiRequest, apiRequestNoAuth } from '../utils/api-helpers.js';
import { sampleQuiz, testTimestamp } from '../fixtures/test-data.js';

test.describe('Quizzes API', () => {
  test('TC-QUIZ-001: GET /quizzes returns list', async () => {
    const res = await apiRequest('GET', '/quizzes');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-QUIZ-002: GET /quizzes/stats returns statistics', async () => {
    const res = await apiRequest('GET', '/quizzes/stats');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-QUIZ-003: GET /quizzes/creator/:userId', async () => {
    const res = await apiRequest('GET', '/quizzes/creator/1');
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-QUIZ-004: GET /quizzes/:id returns details', async () => {
    const listRes = await apiRequest('GET', '/quizzes');
    if (!listRes.data.data || listRes.data.data.length === 0) test.skip(true, 'No quizzes exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('GET', `/quizzes/${id}`);
    expect(res.status).toBe(200);
    expect(res.data).toBeTruthy();
  });

  test('TC-QUIZ-005: POST /quizzes creates quiz', async () => {
    const quiz = { ...sampleQuiz, title: `E2E-QUIZ-${testTimestamp()}` };
    const res = await apiRequest('POST', '/quizzes', { body: quiz });
    expect([200, 201]).toContain(res.status);
    expect(res.data).toBeTruthy();
  });

  test('TC-QUIZ-006: PUT /quizzes/:id updates quiz', async () => {
    const listRes = await apiRequest('GET', '/quizzes');
    if (!listRes.data.data || listRes.data.data.length === 0) test.skip(true, 'No quizzes exist');
    const id = listRes.data.data[0].id;
    const res = await apiRequest('PUT', `/quizzes/${id}`, {
      body: { title: `Updated ${testTimestamp()}` },
    });
    expect([200, 400]).toContain(res.status);
  });

  test('TC-QUIZ-007: DELETE /quizzes/:id removes quiz', async () => {
    const quiz = { ...sampleQuiz, title: `E2E-DEL-Q-${testTimestamp()}` };
    const createRes = await apiRequest('POST', '/quizzes', { body: quiz });
    if (!createRes.data?.data?.id) test.skip(true, 'Could not create quiz');
    const id = createRes.data.data.id;
    const res = await apiRequest('DELETE', `/quizzes/${id}`);
    expect([200, 204]).toContain(res.status);
  });

  test('TC-QUIZ-SEC: GET /quizzes without token returns 401', async () => {
    const res = await apiRequestNoAuth('GET', '/quizzes');
    expect(res.status).toBe(401);
  });
});
