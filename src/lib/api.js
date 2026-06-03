const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://40.70.20.86:5000/api';

export const storage = {
  getToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('cahuin_web_token') || '';
  },
  setSession(data) {
    if (typeof window === 'undefined') return;
    if (data.token) localStorage.setItem('cahuin_web_token', data.token);
    if (data.usuario) localStorage.setItem('cahuin_web_user', JSON.stringify(data.usuario));
  },
  getUser() {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('cahuin_web_user');
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('cahuin_web_token');
    localStorage.removeItem('cahuin_web_user');
  },
};

export async function api(path, options = {}) {
  const token = storage.getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No pudimos conectar con Cahuin');
  return data;
}
