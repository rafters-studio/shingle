import { defineMiddleware } from "astro:middleware";

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
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

  if (!response) {
    return response;
  }

  const url = new URL(context.request.url);

  const newResponse = new Response(response.body, response);

  for (const [key, value] of Object.entries(securityHeaders)) {
    newResponse.headers.set(key, value);
  }

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
