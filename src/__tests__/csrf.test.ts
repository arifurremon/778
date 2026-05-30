import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { validateCsrfRequest } from "@/lib/csrf";

describe("validateCsrfRequest", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("allows non-mutating requests without a CSRF header", () => {
    const req = new NextRequest("http://localhost:3000/api/posts", { method: "GET" });

    expect(validateCsrfRequest(req)).toBeNull();
  });

  it("rejects mutation requests that omit the CSRF header", async () => {
    const req = new NextRequest("http://localhost:3000/api/posts", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });

    const res = validateCsrfRequest(req);
    expect(res?.status).toBe(403);
    await expect(res?.json()).resolves.toMatchObject({
      error: expect.stringContaining("CSRF token"),
    });
  });

  it("rejects origins that are prefixes instead of exact same-origin matches", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://thechattala.com";
    const req = new NextRequest("https://thechattala.com/api/posts", {
      method: "POST",
      headers: {
        origin: "https://thechattala.com.evil.example",
        "x-csrf-token": "test-csrf-token",
      },
    });

    const res = validateCsrfRequest(req);
    expect(res?.status).toBe(403);
  });

  it("allows mutation requests only from the configured exact origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://thechattala.com/app";
    const req = new NextRequest("https://thechattala.com/api/posts", {
      method: "POST",
      headers: {
        origin: "https://thechattala.com",
        "x-csrf-token": "test-csrf-token",
      },
    });

    expect(validateCsrfRequest(req)).toBeNull();
  });
});
