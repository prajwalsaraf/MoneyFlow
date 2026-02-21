export const API_BASE = process.env.VUE_APP_API_URL || 'http://localhost:8000';
export const TOKEN_REFRESH_PATH = process.env.VUE_APP_TOKEN_REFRESH_PATH || '/moneyflow/token/refresh/';

export function getTokens() {
  return {
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
  };
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem('accessToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// Fixed: Added 'export' to make it accessible as a named import
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
  } catch (e) {
    return null;
  }
}

let refreshInProgress = null;

async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) return null;
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    try {
      const res = await fetch(`${API_BASE}${TOKEN_REFRESH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
      });

      if (!res.ok) throw new Error('Refresh failed');

      const data = await res.json();
      const newAccess = data.access || data.token || data.access_token;
      
      if (newAccess) setTokens(newAccess, refresh);
      refreshInProgress = null;
      return newAccess;

    } catch (e) {
      clearTokens();
      refreshInProgress = null;
      return null;
    }
  })();

  return refreshInProgress;
}

export async function apiFetch(endpoint, options = {}) {
  const opts = { ...options, headers: { ...(options.headers || {}) } };
  const { access } = getTokens();
  
  if (access) opts.headers['Authorization'] = `Bearer ${access}`;

  if (process.env.VUE_APP_API_USE_CREDENTIALS === 'true') {
    opts.credentials = 'include';
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, opts);
  } catch (e) {
    console.error(`Network error on ${endpoint}:`, e);
    throw new Error('Network error. Is the server running?');
  }

  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      opts.headers['Authorization'] = `Bearer ${newAccess}`;
      res = await fetch(`${API_BASE}${endpoint}`, opts);
    }
  }

  return res;
}

let refreshTimeoutId = null;

export function scheduleTokenRefresh() {
  const { access } = getTokens();
  clearTimeout(refreshTimeoutId);
  
  if (!access) return;
  
  const payload = decodeJwt(access);
  if (!payload?.exp) return;
  
  const refreshAt = Math.max(5000, (payload.exp * 1000) - Date.now() - 60000);
  
  refreshTimeoutId = setTimeout(async () => {
    const newAccess = await refreshAccessToken();
    if (newAccess) scheduleTokenRefresh();
  }, refreshAt);
}