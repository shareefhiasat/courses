/**
 * User data scope profile + explicit grants API client
 */

const API_BASE = '/api/v1/user-data-scope';

async function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getUserDataScope(userId) {
  const response = await fetch(`${API_BASE}/user/${userId}`, { headers: await authHeaders() });
  return response.json();
}

export async function saveUserDataScope(userId, payload) {
  const response = await fetch(`${API_BASE}/user/${userId}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  return response.json();
}

export default { getUserDataScope, saveUserDataScope };
