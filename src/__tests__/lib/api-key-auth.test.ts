import { describe, expect, it } from "vitest";
import {
  generateApiKeyMaterial,
  hashApiKey,
  hasApiKeyScope,
  parseBearerApiKey,
} from "@/lib/api-key-auth";

describe("api-key-auth", () => {
  it("generates keys with tc_live prefix", () => {
    const { rawKey, keyPrefix, hashedKey } = generateApiKeyMaterial();
    expect(rawKey.startsWith("tc_live_")).toBe(true);
    expect(keyPrefix).toBe(rawKey.slice(0, 16));
    expect(hashedKey).toBe(hashApiKey(rawKey));
  });

  it("parses bearer API keys", () => {
    expect(parseBearerApiKey("Bearer tc_live_abc123")).toBe("tc_live_abc123");
    expect(parseBearerApiKey("Bearer session-token")).toBeNull();
  });

  it("checks scopes", () => {
    expect(hasApiKeyScope(["read:orders"], "read:orders")).toBe(true);
    expect(hasApiKeyScope(["*"], "write:orders")).toBe(true);
    expect(hasApiKeyScope(["read:shops"], "write:orders")).toBe(false);
  });
});
