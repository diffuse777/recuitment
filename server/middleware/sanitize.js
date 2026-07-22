/**
 * Guard against MongoDB / NoSQL operator injection.
 * Strips keys that start with `$` and dangerous prototypes from objects.
 * (This app uses MongoDB — classic SQL injection does not apply.)
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function sanitizeValue(value, depth = 0) {
  if (depth > 12) return null;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const clean = {};
  for (const [key, nested] of Object.entries(value)) {
    if (typeof key !== 'string') continue;
    if (key.startsWith('$') || DANGEROUS_KEYS.has(key)) continue;
    clean[key] = sanitizeValue(nested, depth + 1);
  }
  return clean;
}

export function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

/** Force primitive string IDs — blocks object-shaped injection in query params */
export function asSafeString(value, maxLen = 200) {
  if (value == null) return '';
  if (typeof value === 'object') return '';
  return String(value).trim().slice(0, maxLen);
}
