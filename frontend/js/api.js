/**
 * API client — thin wrapper around fetch() that:
 *   - prefixes the API base URL
 *   - attaches the Bearer token from localStorage
 *   - handles 401 (auto-logout)
 *   - returns parsed JSON or throws a useful error
 */
const API_BASE = (window.API_BASE_OVERRIDE || '/api');

function getToken() {
  return localStorage.getItem('vs_token') || '';
}

function setToken(token) {
  if (token) localStorage.setItem('vs_token', token);
  else localStorage.removeItem('vs_token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('vs_user') || 'null'); }
  catch (e) { return null; }
}

function setUser(user) {
  if (user) localStorage.setItem('vs_user', JSON.stringify(user));
  else localStorage.removeItem('vs_user');
}

function clearSession() {
  setToken(null);
  setUser(null);
}

async function request(method, path, { body, params, isForm } = {}) {
  const url = new URL(API_BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload;
  if (body && isForm) {
    payload = body; // FormData — browser sets content-type
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url.toString(), { method, headers, body: payload });
  } catch (e) {
    throw new Error('Network error — please check your connection.');
  }

  if (res.status === 401) {
    clearSession();
    if (!window.location.pathname.endsWith('login.html') &&
        !window.location.pathname.endsWith('/')) {
      window.location.href = '/login.html';
    }
    const err = await safeJson(res);
    throw new Error(err.detail || 'Session expired. Please log in again.');
  }

  if (res.status === 204) return null;

  if (!res.ok) {
    const err = await safeJson(res);
    let msg = err.detail || err.message || `Request failed (${res.status})`;
    if (Array.isArray(err.detail)) msg = err.detail.map(d => d.msg || JSON.stringify(d)).join('; ');
    throw new Error(msg);
  }

  // File download
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await res.json();
  if (ct.includes('text/csv') || ct.includes('application/pdf') ||
      ct.includes('application/octet-stream')) {
    return await res.blob();
  }
  return await res.text();
}

async function safeJson(res) {
  try { return await res.json(); }
  catch (e) { return { detail: res.statusText }; }
}

const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
  upload: (path, formData) => request('POST', path, { body: formData, isForm: true }),
};

window.api = api;
window.auth = { getToken, setToken, getUser, setUser, clearSession };
