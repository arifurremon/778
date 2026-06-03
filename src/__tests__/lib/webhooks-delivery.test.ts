import { describe, expect, it } from "vitest";
import { signWebhookPayload } from "@/lib/webhooks/delivery";

describe("webhook delivery", () => {
  it("signs payloads with HMAC sha256", () => {
    const signature = signWebhookPayload("secret", '{"ok":true}', 1710000000);
    expect(signature).toHaveLength(64);
    expect(signWebhookPayload("secret", '{"ok":true}', 1710000000)).toBe(signature);
    expect(signWebhookPayload("other", '{"ok":true}', 1710000000)).not.toBe(signature);
  });
});
