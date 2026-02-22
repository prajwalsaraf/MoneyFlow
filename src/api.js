import axios from 'axios';

export const API_BASE = process.env.VUE_APP_API_URL || 'http://localhost:8000/moneyflow/';
export const TOKEN_REFRESH_PATH = process.env.VUE_APP_TOKEN_REFRESH_PATH || 'token/refresh/';


const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  }
});

export function getTokens() {
  return {
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
  };
}

export function setAuthTokens(access, refresh) {
  if (access) localStorage.setItem('accessToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
}

export function clearAuthTokens() {
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

apiClient.interceptors.request.use(
  (config) => {
    const { access } = getTokens();
    
    if (access) {
      config.headers['Authorization'] = `Bearer ${access}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  get(endpoint, data) {
    return apiClient.get(endpoint, data);
  },
  post(endpoint, data) {
    return apiClient.post(endpoint, data);
  },
  put(endpoint, data) {
    return apiClient.put(endpoint, data);
  },
  patch(endpoint, data) {
    return apiClient.patch(endpoint, data);
  },
  delete(endpoint, data) {
    return apiClient.delete(endpoint, data);
  },

  getAccounts(page = 1) {
    // DRF uses ?page=X for pagination by default
    return apiClient.get(`accounts/?page=${page}`);
  },

  getAllTransactions(page = 1) {
    // DRF uses ?page=X for pagination by default
    return apiClient.get(`accounts/all-txns/?page=${page}`);
  }
}

apiClient.interceptors.response.use(
  (response) => response, 
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      console.warn("Unauthorized! Redirecting to login...");
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

let refreshInProgress = null;

async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) return null;
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    try {
      const res = await api.post(TOKEN_REFRESH_PATH, refresh);
      // const res = await fetch(`${API_BASE}${TOKEN_REFRESH_PATH}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ refresh })
      // });
      
      // if (!res.ok) throw new Error('Refresh failed');
      const newAccess = res.data.access;
      
      if (newAccess) setAuthTokens(newAccess, refresh);
      refreshInProgress = null;
      return newAccess;

    } catch (e) {
      clearAuthTokens();
      refreshInProgress = null;
      return null;
    }
  })();

  return refreshInProgress;
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