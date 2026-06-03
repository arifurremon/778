import { buildContentSecurityPolicy, generateCspNonce } from "@/lib/csp";
import { describe, expect, it } from "vitest";

describe("buildContentSecurityPolicy", () => {
  const nonce = "test-nonce";

  it("includes nonce-based script-src in production", () => {
    const policy = buildContentSecurityPolicy(nonce, false);
    expect(policy).toContain(`'nonce-${nonce}'`);
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("allows unsafe-eval in development", () => {
    const policy = buildContentSecurityPolicy(nonce, true);
    expect(policy).toContain("'unsafe-eval'");
  });

  it("documents accepted style-src unsafe-inline for Tailwind", () => {
    const policy = buildContentSecurityPolicy(nonce, false);
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("allows Google OAuth frames", () => {
    const policy = buildContentSecurityPolicy(nonce, false);
    expect(policy).toContain("frame-src 'self' https://accounts.google.com");
  });

  it("includes third-party script and connect hosts", () => {
    const policy = buildContentSecurityPolicy(nonce, false);
    expect(policy).toContain("https://js.pusher.com");
    expect(policy).toContain("https://www.googletagmanager.com");
    expect(policy).toContain("https://*.upstash.io");
  });

  it("sets baseline security directives", () => {
    const policy = buildContentSecurityPolicy(nonce, false);
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
  });
});

describe("generateCspNonce", () => {
  it("returns a base64 string", () => {
    const nonce = generateCspNonce();
    expect(nonce.length).toBeGreaterThan(8);
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});
