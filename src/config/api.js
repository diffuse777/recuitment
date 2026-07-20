/**
 * Backend base URL — resolved at call time.
 * - Local dev: http://localhost:5000
 * - Vercel / production: same origin ("" → /api/...)
 *
 * Never use a localhost API URL on a deployed site — Chrome blocks it
 * (loopback / local network permission) and admin login fails.
 */
function resolveApiBase() {
  const envUrl = String(import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/$/, '');
  const envPointsToLocalhost = /localhost|127\.0\.0\.1/i.test(envUrl);

  // Production build: always same-origin /api unless a real remote API is set
  if (import.meta.env.PROD) {
    if (envUrl && !envPointsToLocalhost) return envUrl;
    return '';
  }

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';

  // Safety: deployed preview hostname without PROD flag still must not hit localhost
  if (!isLocalHost) {
    if (envUrl && !envPointsToLocalhost) return envUrl;
    return '';
  }

  if (envUrl) return envUrl;
  return 'http://localhost:5000';
}

export function apiUrl(path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${resolveApiBase()}${normalized}`;
}

export const API_BASE_URL =
  typeof window !== 'undefined' ? resolveApiBase() : '';

/**
 * Parse a fetch Response as JSON, with a clear error if HTML/non-JSON is returned.
 */
export async function parseJsonResponse(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty response from server.');
  }
  if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
    throw new Error(
      'API returned a web page instead of data. On Vercel, confirm /api is configured and redeploy.'
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error('Invalid JSON response from server.');
  }
}
