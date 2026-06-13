/**
 * Common test setup helpers for backend tests
 * Provides consistent mock request/response objects and setup patterns
 */

/**
 * Create a mock request object with default values
 * @param {Object} overrides - Optional overrides for default values
 * @returns {Object} Mock request object
 */
export function createMockRequest(overrides = {}) {
  return {
    params: {},
    user: { id: 'test-user-id', roles: ['student'] },
    body: {},
    file: null,
    ...overrides,
  };
}

/**
 * Create a mock response object with Jest mocks
 * @param {Object} overrides - Optional overrides for default values
 * @returns {Object} Mock response object
 */
export function createMockResponse(overrides = {}) {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    headersSent: false,
    ...overrides,
  };
}

/**
 * Setup common test environment with mock request/response
 * Clears all mocks before each test
 * @returns {Object} Object containing mockReq and mockRes
 */
export function setupTestEnvironment() {
  const mockReq = createMockRequest();
  const mockRes = createMockResponse();
  jest.clearAllMocks();
  return { mockReq, mockRes };
}

/**
 * Assert successful response with status 200
 * @param {Object} mockRes - Mock response object
 * @param {Object} expectedData - Optional expected data in response
 */
export function expectSuccess(mockRes, expectedData = null) {
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({ success: true })
  );
  if (expectedData) {
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining(expectedData)
    );
  }
}

/**
 * Assert unauthorized response with status 403
 * @param {Object} mockRes - Mock response object
 */
export function expectUnauthorized(mockRes) {
  expect(mockRes.status).toHaveBeenCalledWith(403);
}

/**
 * Assert not found response with status 404
 * @param {Object} mockRes - Mock response object
 */
export function expectNotFound(mockRes) {
  expect(mockRes.status).toHaveBeenCalledWith(404);
}

/**
 * Assert bad request response with status 400
 * @param {Object} mockRes - Mock response object
 */
export function expectBadRequest(mockRes) {
  expect(mockRes.status).toHaveBeenCalledWith(400);
}
