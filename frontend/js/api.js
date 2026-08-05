/**
 * API client — thin wrapper around fetch() that:
 *   - prefixes the API base URL
 *   - attaches the Bearer token from localStorage
 *   - handles 401 (auto-logout)
 *   - returns parsed JSON or throws a useful error
 *   - shows a top loading bar for in-flight requests
 */
const API_BASE = (window.API_BASE_OVERRIDE || '/api');

// --- Simple GET cache (stale-while-revalidate) --------------------------
const _apiCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function _cacheKey(path, params) {
  return path + JSON.stringify(params || {});
}

// --- Global loading bar --------------------------------------------------
let _activeRequests = 0;
let _loadingBar = null;
let _loadingTimer = null;

function _ensureLoadingBar() {
  if (_loadingBar) return _loadingBar;
  _loadingBar = document.createElement('div');
  _loadingBar.id = 'api-loading-bar';
  _loadingBar.style.cssText = `
    position: fixed; top: 0; left: 0; height: 3px; width: 0%;
    background: linear-gradient(90deg, #6366f1, #a855f7);
    z-index: 9999; transition: width 0.3s ease, opacity 0.3s ease;
    box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
    opacity: 0;
  `;
  document.body.appendChild(_loadingBar);
  return _loadingBar;
}

function _startLoading() {
  _activeRequests++;
  const bar = _ensureLoadingBar();
  bar.style.opacity = '1';
  bar.style.width = '30%';
  if (_loadingTimer) clearTimeout(_loadingTimer);
  _loadingTimer = setTimeout(() => { if (_activeRequests > 0) bar.style.width = '70%'; }, 500);
}

function _stopLoading() {
  _activeRequests = Math.max(0, _activeRequests - 1);
  if (_activeRequests === 0) {
    const bar = _ensureLoadingBar();
    bar.style.width = '100%';
    if (_loadingTimer) clearTimeout(_loadingTimer);
    _loadingTimer = setTimeout(() => {
      bar.style.opacity = '0';
      setTimeout(() => { bar.style.width = '0%'; }, 300);
    }, 200);
  }
}

function getToken() {
  // Check localStorage first (Remember Me), then sessionStorage (session-only)
  return localStorage.getItem('vs_token') || sessionStorage.getItem('vs_token') || '';
}

function setToken(token, remember = true) {
  // Always clear both storages first to avoid duplicates
  localStorage.removeItem('vs_token');
  sessionStorage.removeItem('vs_token');
  if (token) {
    if (remember) localStorage.setItem('vs_token', token);
    else sessionStorage.setItem('vs_token', token);
  }
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('vs_user') || sessionStorage.getItem('vs_user') || 'null');
  } catch (e) { return null; }
}

function setUser(user, remember = true) {
  localStorage.removeItem('vs_user');
  sessionStorage.removeItem('vs_user');
  if (user) {
    const data = JSON.stringify(user);
    if (remember) localStorage.setItem('vs_user', data);
    else sessionStorage.setItem('vs_user', data);
  }
}

function clearSession() {
  localStorage.removeItem('vs_token');
  sessionStorage.removeItem('vs_token');
  localStorage.removeItem('vs_user');
  sessionStorage.removeItem('vs_user');
}

async function request(method, path, { body, params, isForm } = {}) {
  const url = new URL(API_BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  // Check cache for GET requests (stale-while-revalidate)
  const isGet = method === 'GET' && !body && !isForm;
  const ck = _cacheKey(path, params);
  if (isGet) {
    const cached = _apiCache.get(ck);
    if (cached) {
      const age = Date.now() - cached.time;
      if (age < CACHE_TTL) {
        // Fresh — return immediately
        return Promise.resolve(cached.data);
      }
      // Stale — return cached data, then revalidate in background
      _revalidate(path, params, ck);
      return Promise.resolve(cached.data);
    }
  }

  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload;
  if (body && isForm) {
    payload = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  _startLoading();
  let res;
  try {
    res = await fetch(url.toString(), { method, headers, body: payload });
  } catch (e) {
    _stopLoading();
    throw new Error('Network error — please check your connection.');
  }
  _stopLoading();

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

  const ct = res.headers.get('content-type') || '';
  const cd = res.headers.get('content-disposition') || '';
  let result;
  if (ct.includes('application/json')) result = await res.json();
  else if (cd.includes('attachment') ||
      ct.includes('text/csv') || ct.includes('application/pdf') ||
      ct.includes('application/octet-stream') ||
      ct.includes('spreadsheet') || ct.includes('wordprocessing') ||
      ct.includes('text/plain')) {
    result = await res.blob();
  } else {
    result = await res.text();
  }

  // Cache JSON GET responses
  if (isGet && ct.includes('application/json')) {
    _apiCache.set(ck, { data: result, time: Date.now() });
  }

  return result;
}

// Background revalidation for stale-while-revalidate
async function _revalidate(path, params, ck) {
  try {
    const url = new URL(API_BASE + path, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
      });
    }
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url.toString(), { method: 'GET', headers });
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      const data = await res.json();
      _apiCache.set(ck, { data, time: Date.now() });
    }
  } catch (e) { /* silent — background revalidation */ }
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
