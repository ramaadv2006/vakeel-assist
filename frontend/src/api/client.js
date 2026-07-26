import { supabase } from './supabaseClient';

// Cache the access token and keep it in sync via onAuthStateChange instead of
// calling supabase.auth.getSession() on every request. Supabase's client
// serializes auth-related calls internally (a cross-tab lock), so firing
// getSession() from several concurrent API calls (e.g. a page that loads
// multiple resources at once) can queue up behind that lock and stall for
// several seconds - caching sidesteps that entirely.
let cachedToken = null;
let initPromise = null;

function ensureTokenSynced() {
  if (!initPromise) {
    initPromise = supabase.auth.getSession().then(({ data: { session } }) => {
      cachedToken = session?.access_token ?? null;
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      cachedToken = session?.access_token ?? null;
    });
  }
  return initPromise;
}

async function getAccessToken() {
  await ensureTokenSynced();
  return cachedToken;
}

// Lets AuthContext seed the cache directly from a signInWithPassword/signUp
// response (which already includes the session) instead of making another
// getSession() call right after - chaining a second auth call immediately
// after a state-changing one is what was causing multi-second stalls.
export function setCachedToken(token) {
  cachedToken = token;
  initPromise = Promise.resolve();
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * Thin fetch wrapper: attaches the Supabase session's bearer token, assumes
 * JSON in/out unless `raw` is requested (used for the CSV export download).
 */
async function request(path, { method = 'GET', body, isForm = false, raw = false } = {}) {
  const headers = {};
  const token = await getAccessToken();
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
