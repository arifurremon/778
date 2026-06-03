import { describe, expect, it } from "vitest";
import { generateOpenApiDocument } from "@/lib/openapi/generate";

describe("OpenAPI document", () => {
  it("generates OpenAPI 3.1 with public paths", () => {
    const doc = generateOpenApiDocument();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBe("The Chattala API");
    expect(doc.paths?.["/api/health"]).toBeDefined();
    expect(doc.paths?.["/api/v1/health"]).toBeDefined();
    expect(doc.paths?.["/api/orders"]?.post).toBeDefined();
    expect(doc.paths?.["/api/webhooks"]?.post).toBeDefined();
  });
});
