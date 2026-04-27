

const DOMAIN = import.meta.env.VITE_DOMAIN;
const API_BASE = `${DOMAIN}/orion/api/v1`;
const AUTH_KEY = 'orion_auth';
const ACCESS_TOKEN_KEY = 'orion_access_token';

async function parseResponseBody(resp) {
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await resp.json();
  }
  return await resp.text();
}

export async function signupUser({ name, email, password }) {
  const url = `${API_BASE}/signup`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const body = await parseResponseBody(resp);

  if (!resp.ok) {
    const msg =
      (body && (body.detail || body.message || JSON.stringify(body))) ||
      resp.statusText ||
      `Request failed with status ${resp.status}`;
    throw new Error(msg);
  }

  return body;
}

export async function loginUser({ email, password, name } = {}) {
  const url = `${API_BASE}/login`;

  const payload = { email, password };
  if (typeof name === 'string' && name.trim() !== '') {
    payload.name = name;
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await parseResponseBody(resp);

  if (!resp.ok) {
    const msg = (body && (body.detail || body.message || JSON.stringify(body))) || resp.statusText || `Request failed with status ${resp.status}`;
    throw new Error(msg);
  }

  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(body));
    if (body.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, body.accessToken);
    }
  } catch (err) {
    console.warn('Failed to save auth to localStorage', err);
  }

  return body;
}

export function getCurrentAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function logoutUser() {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem('orion_pdf_meta');
    localStorage.removeItem('sessionId');
  } catch {}
}