import axios from 'axios';
import router from './router';
import { userAuthStore } from '@/stores/authStore';

export const API_BASE = process.env.VUE_APP_API_URL || 'http://localhost:8000/moneyflow/';
export const TOKEN_REFRESH_PATH = process.env.VUE_APP_TOKEN_REFRESH_PATH || 'token/refresh/';


const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  }
});

export function getAccessToken() {
  const authStore = userAuthStore();
  return authStore.accessToken;
}

export function setAccessToken(access) {
  const authStore = userAuthStore();
  if (access) authStore.setAccessToken('accessToken', access);
}


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
  const access = getAccessToken();
  
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

  // if (res.status === 401) {
  //   const newAccess = await refreshAccessToken();
  //   if (newAccess) {
  //     opts.headers['Authorization'] = `Bearer ${newAccess}`;
  //     res = await fetch(`${API_BASE}${endpoint}`, opts);
  //   }
  // }

  return res;
}

apiClient.interceptors.request.use(
  (config) => {
    const access = getAccessToken();
    const isLoginRequest = config.url.endsWith('login/');

    if(isLoginRequest)
      return config;
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
  get(endpoint, data={}) {
    return apiClient.get(endpoint, data);
  },
  post(endpoint, data={}) {
    return apiClient.post(endpoint, data);
  },
  put(endpoint, data={}) {
    return apiClient.put(endpoint, data);
  },
  patch(endpoint, data={}) {
    return apiClient.patch(endpoint, data);
  },
  delete(endpoint, data={}) {
    return apiClient.delete(endpoint, data);
  },

  login(credentials) {
    return apiClient.post('login/', credentials, {
      withCredentials: true
    });
  },

  refresh_token() {
    try {
      return apiClient.post('token/refresh/', {}, {
        withCredentials: true
      });
    } catch(error) {
      console.log("Cannot logout at this time!");
    }
  },

  logout() {
    try {
      return apiClient.post('logout/', {}, {
        withCredentials: true
      });
    } catch(error) {
      console.log("Cannot logout at this time!");
    }
  },

  create_user(details) {
    return apiClient.post('register/', details, {
      withCredentials: true
    });
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
    if(error.config.url.endsWith('login/'))
      return error.response;

    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      console.warn("Unauthorized! Redirecting to login...");
      router.push('/'); 
    }
    return Promise.reject(error);
  }
);

let refreshInProgress = null;

export function refreshAccessToken() {
  // const { refresh } = getAccessToken();
  // if (!refresh) return null;
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    try {
      const res = await api.refresh_token();
      const newAccess = res.data.access;
      
      if (newAccess) setAccessToken(newAccess);
      refreshInProgress = null;
      return newAccess;

    } catch (e) {
      refreshInProgress = null;
      return null;
    }
  })();

  return refreshInProgress;
}

let refreshTimeoutId = null;

export function scheduleTokenRefresh() {
  const access = getAccessToken();
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
