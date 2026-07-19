/**
 * Backend base URL.
 * Local: http://localhost:5000
 * Production: set VITE_API_URL in Vercel (e.g. https://your-api.onrender.com)
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

export function apiUrl(path = '') {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
