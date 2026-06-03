/** Shared CSP builder for middleware (nonce-based script-src in production). */

const cspScriptHosts = [
  "https://js.pusher.com",
  "https://js.sentry-cdn.com",
  "https://www.googletagmanager.com",
].join(" ");

const cspConnectHosts = [
  "https://*.pusher.com",
  "wss://*.pusher.com",
  "https://*.upstash.io",
  "https://*.sentry.io",
  "https://uploadthing.com",
  "https://utfs.io",
  "https://www.google-analytics.com",
  "https://analytics.google.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
].join(" ");

export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'unsafe-eval' ${cspScriptHosts}`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' ${cspScriptHosts}`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    `connect-src 'self' ${cspConnectHosts}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function generateCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
