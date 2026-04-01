import { defineMiddleware } from "astro:middleware";

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://www.google-analytics.com https://*.googleapis.com",
    "connect-src 'self' https://www.google-analytics.com https://cal.com",
    "frame-src https://www.googletagmanager.com",
  ].join("; "),
};

const cachePatterns: Array<{ pattern: RegExp; maxAge: number; immutable?: boolean }> = [
  { pattern: /^\/_astro\//, maxAge: 31536000, immutable: true },
  { pattern: /^\/images\//, maxAge: 31536000 },
  { pattern: /^\/fonts\//, maxAge: 31536000 },
  { pattern: /\.(woff2?|ttf)$/, maxAge: 31536000 },
];

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Guard: if no response, pass through
  if (!response) {
    return response;
  }

  const url = new URL(context.request.url);

  // Clone response to make headers mutable
  const newResponse = new Response(response.body, response);

  // Add security headers to all responses
  for (const [key, value] of Object.entries(securityHeaders)) {
    newResponse.headers.set(key, value);
  }

  // Add cache headers based on path
  for (const { pattern, maxAge, immutable } of cachePatterns) {
    if (pattern.test(url.pathname)) {
      const cacheControl = immutable
        ? `public, max-age=${maxAge}, immutable`
        : `public, max-age=${maxAge}`;
      newResponse.headers.set("Cache-Control", cacheControl);
      break;
    }
  }

  return newResponse;
});
