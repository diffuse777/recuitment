/**
 * Backend base URL — resolved at call time so hostname is always correct.
 * - Local: http://localhost:5000 (or Vite /api proxy)
 * - Production: same origin (empty base → /api/...)
 * - Override: VITE_API_URL
 */
function resolveApiBase() {
  const envUrl = String(import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/$/, '');
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }

  return '';
}

export const API_BASE_URL =
  typeof window !== 'undefined' ? resolveApiBase() : 'http://localhost:5000';

export function apiUrl(path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${resolveApiBase()}${normalized}`;
}

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
      'API returned a web page instead of data. Make sure the backend is running on port 5000.'
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error('Invalid JSON response from server.');
  }
}
