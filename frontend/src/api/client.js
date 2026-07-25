const TOKEN_KEY = 'advo_buddy_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * Thin fetch wrapper: attaches the bearer token, assumes JSON in/out unless
 * `raw` is requested (used for the CSV export download).
 */
async function request(path, { method = 'GET', body, isForm = false, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (raw) {
    if (!res.ok) throw new ApiError('Request failed', res.status, null);
    return res;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError((data && data.error) || 'Something went wrong.', res.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts = {}) => request(path, { method: 'PUT', body, ...opts }),
  del: (path) => request(path, { method: 'DELETE' }),
  raw: (path) => request(path, { raw: true }),
};

export { ApiError };
