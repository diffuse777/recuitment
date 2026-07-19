/**
 * Backend base URL.
 * - Local Vite: http://localhost:5000 (run `npm start` in /server)
 * - Production on Vercel: same site (/api/...) — no VITE_API_URL needed
 * - Optional override: set VITE_API_URL if API is on another host
 */
const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const isBrowser = typeof window !== 'undefined';
const isLocalHost =
  isBrowser &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = envUrl || (isLocalHost ? 'http://localhost:5000' : '');

export function apiUrl(path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Production: relative URL → https://owaspxcybernerds.xyz/api/...
  return `${API_BASE_URL}${normalized}`;
}
