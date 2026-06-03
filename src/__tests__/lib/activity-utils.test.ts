import { describe, expect, it } from "vitest";
import {
  buildActivityTabFilter,
  mapActivityTypeToTab,
  mapApiActivityLog,
} from "@/lib/activity-utils";

describe("activity-utils", () => {
  it("maps activity types to UI tabs", () => {
    expect(mapActivityTypeToTab("LIKE")).toBe("likes");
    expect(mapActivityTypeToTab("COMMENT")).toBe("comments");
    expect(mapActivityTypeToTab("SAVED")).toBe("saved");
    expect(mapActivityTypeToTab("SYSTEM")).toBe("system");
  });

  it("builds prisma filters for tabs", () => {
    expect(buildActivityTabFilter("all")).toBeNull();
    expect(buildActivityTabFilter("likes")).toContain("LIKE");
    expect(buildActivityTabFilter("saved")).toEqual(["SAVED"]);
  });

  it("maps API activity rows for the UI", () => {
    const mapped = mapApiActivityLog({
      id: "act-1",
      type: "COMMENT",
      description: "You commented on a post.",
      contextUrl: "/community#post-1",
      isRead: false,
      createdAt: "2026-06-08T10:00:00.000Z",
    });

    expect(mapped.type).toBe("comments");
    expect(mapped.href).toBe("/community#post-1");
    expect(mapped.isRead).toBe(false);
  });
});
