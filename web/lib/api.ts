const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ── Auth ────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body: { email: string; password: string; full_name: string }) =>
      apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      apiFetch<{ access_token: string; refresh_token: string; user: any }>(
        '/api/auth/login', { method: 'POST', body: JSON.stringify(body) }
      ),
  },

  profile: {
    get:    (token: string) => apiFetch('/api/profile', {}, token),
    update: (token: string, body: any) =>
      apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(body) }, token),
    setPreferences: (token: string, body: any) =>
      apiFetch('/api/profile/preferences', { method: 'PUT', body: JSON.stringify(body) }, token),
    getMeta: (token: string) => apiFetch('/api/profile/meta', {}, token),
  },

  matches: {
    list:    (token: string) => apiFetch('/api/matches', {}, token),
    get:     (token: string, id: string) => apiFetch(`/api/matches/${id}`, {}, token),
    refresh: (token: string) => apiFetch('/api/matches/refresh', { method: 'POST' }, token),
  },

  connections: {
    list:   (token: string) => apiFetch('/api/connections', {}, token),
    send:   (token: string, body: any) =>
      apiFetch('/api/connections', { method: 'POST', body: JSON.stringify(body) }, token),
    respond: (token: string, id: string, status: string) =>
      apiFetch(`/api/connections/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token),
  },

  messages: {
    list:    (token: string) => apiFetch('/api/messages', {}, token),
    get:     (token: string, convId: string) => apiFetch(`/api/messages/${convId}`, {}, token),
    send:    (token: string, convId: string, content: string) =>
      apiFetch(`/api/messages/${convId}`, { method: 'POST', body: JSON.stringify({ content }) }, token),
  },

  admin: {
    stats:       (token: string) => apiFetch('/api/admin/stats', {}, token),
    users:       (token: string, page = 1, search = '') =>
      apiFetch(`/api/admin/users?page=${page}&search=${search}`, {}, token),
    updateUser:  (token: string, id: string, body: any) =>
      apiFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
    matches:     (token: string, page = 1) =>
      apiFetch(`/api/admin/matches?page=${page}`, {}, token),
    runMatching: (token: string) =>
      apiFetch('/api/admin/matching/run', { method: 'POST' }, token),
  },
};
