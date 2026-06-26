/**
 * API helper utilities for E2E tests
 * Provides functions to obtain auth tokens and make API requests
 */
import { testConfig } from '../config/test.config.js';

const API_BASE = `http://localhost:8001/api/v1`;

/**
 * Get Keycloak token for a given role
 */
export async function getAuthToken(role = 'superAdmin') {
  const user = testConfig[role] || testConfig.superAdmin;
  const keycloakUrl = testConfig.keycloakUrl;
  const realm = testConfig.keycloakRealm;
  const clientId = testConfig.keycloakClientId;
  const clientSecret = testConfig.keycloakClientSecret;

  const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    client_secret: clientSecret,
    username: user.email,
    password: user.password,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get token for role ${role}: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest(method, path, options = {}) {
  const token = options.token || await getAuthToken(options.role || 'superAdmin');
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

/**
 * Make an unauthenticated API request
 */
export async function apiRequestNoAuth(method, path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

export { API_BASE };
