/**
 * Lightweight in-memory rate limiter + basic scraper throttling.
 * Works for a single Node process; on Vercel each instance has its own map.
 */

const hits = new Map();

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown';
  return ip;
}

function prune(now) {
  if (hits.size < 5000) return;
  for (const [key, entry] of hits.entries()) {
    if (now > entry.resetAt) hits.delete(key);
  }
}

/**
 * @param {{ windowMs?: number, max?: number, message?: string }} options
 */
export function rateLimit({
  windowMs = 60_000,
  max = 100,
  message = 'Too many requests. Please try again later.',
} = {}) {
  return (req, res, next) => {
    const now = Date.now();
    prune(now);
    const key = `${clientKey(req)}:${req.baseUrl}${req.path}:${windowMs}:${max}`;
    let entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      return res.status(429).json({ message });
    }
    next();
  };
}

const SCRAPER_UA =
  /bot|crawl|spider|scrapy|httpclient|python-requests|curl|wget|go-http|libwww|phantom|headless|selenium|puppeteer/i;

/** Soft-block obvious non-browser scrapers on sensitive read endpoints */
export function blockObviousScrapers(req, res, next) {
  const ua = String(req.headers['user-agent'] || '');
  // Allow normal browsers (including privacy modes with odd/empty UA)
  if (ua && SCRAPER_UA.test(ua)) {
    return res.status(403).json({
      message: 'Automated access is not allowed.',
    });
  }
  next();
}

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://accounts.google.com",
    ].join('; ')
  );
  next();
}
