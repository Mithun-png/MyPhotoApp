const rawEnvUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE = rawEnvUrl.trim().replace(/\/+$/, '');

export const getStoredToken = () => localStorage.getItem('photo_token');
export const setStoredToken = (token) => localStorage.setItem('photo_token', token);
export const removeStoredToken = () => localStorage.removeItem('photo_token');

export const getStoredUser = () => {
  const user = localStorage.getItem('photo_user');
  return user ? JSON.parse(user) : null;
};
export const setStoredUser = (user) => localStorage.setItem('photo_user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('photo_user');

async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${cleanEndpoint}`;
  const headers = options.headers || {};

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/verify-pin')) {
    removeStoredToken();
    removeStoredUser();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (endpoint, body, options) =>
    request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  
  // Multi-file upload helper (supports File objects or { file, name } objects)
  uploadPhotos: (eventId, items) => {
    const formData = new FormData();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item instanceof File) {
        formData.append('files', item, item.name);
      } else if (item && item.file) {
        formData.append('files', item.file, item.name || item.file.name);
      }
    }
    return request(`/events/${eventId}/photos`, {
      method: 'POST',
      body: formData,
    });
  }
};
