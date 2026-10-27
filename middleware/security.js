/**
 * Security & Hardening Middleware
 * Enterprise-grade security headers, rate limiting, and sanitization.
 * Aligned with OWASP Top 10 guidelines.
 */

'use strict';

/**
 * Applies defensive HTTP security headers to all incoming responses.
 */
function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Cross-Site Scripting (XSS) filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HTTP Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Permissions Policy (allow microphone for Web Speech STT, restrict camera/geo)
  res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=()');

  // Content Security Policy - permissive for Speech API, inline SVGs, and QR codes
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; font-src 'self' data:; media-src 'self' blob:;"
  );

  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * In-Memory Token Bucket Rate Limiter
 * Protects against brute-force attacks and denial-of-service attempts.
 */
const rateLimitBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests per minute per IP

function rateLimiter(req, res, next) {
  // Extract client IP (respecting reverse proxies like Render/Vercel)
  const clientIp = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';

  const now = Date.now();
  let bucket = rateLimitBuckets.get(clientIp);

  if (!bucket || now - bucket.startTime > RATE_LIMIT_WINDOW_MS) {
    bucket = { startTime: now, count: 1 };
    rateLimitBuckets.set(clientIp, bucket);
  } else {
    bucket.count++;
  }

  // Periodic cleanup of stale rate-limit buckets (every 500 requests)
  if (rateLimitBuckets.size > 2000) {
    for (const [ip, data] of rateLimitBuckets.entries()) {
      if (now - data.startTime > RATE_LIMIT_WINDOW_MS) {
        rateLimitBuckets.delete(ip);
      }
    }
  }

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_WINDOW - bucket.count));

  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a moment before trying again.',
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - bucket.startTime)) / 1000)
    });
  }

  next();
}

/**
 * Sanitizes a string by stripping dangerous HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  securityHeaders,
  rateLimiter,
  sanitizeString
};
