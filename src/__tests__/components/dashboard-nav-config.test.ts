import { describe, expect, it } from "vitest";
import {
  DASHBOARD_NAV_ITEMS,
  filterVisibleNavItems,
  getDashboardGreeting,
  getNavItemsByZone,
  hasWorkspaceNav,
} from "@/components/dashboard/dashboard-nav-config";

describe("dashboard-nav-config", () => {
  it("filters seller, expert, and admin-only items", () => {
    const visible = filterVisibleNavItems(DASHBOARD_NAV_ITEMS, {
      isSeller: true,
      isServiceProvider: false,
      role: "USER",
    });

    expect(visible.some((item) => item.label === "Seller Hub")).toBe(true);
    expect(visible.some((item) => item.label === "Expert Hub")).toBe(false);
    expect(visible.some((item) => item.label === "Admin Center")).toBe(false);
  });

  it("shows admin center for admin roles", () => {
    const visible = filterVisibleNavItems(DASHBOARD_NAV_ITEMS, {
      role: "ADMIN",
    });

    expect(visible.some((item) => item.label === "Admin Center")).toBe(true);
  });

  it("returns greeting based on hour", () => {
    expect(getDashboardGreeting(new Date("2026-06-10T08:00:00"))).toBe("Good Morning,");
    expect(getDashboardGreeting(new Date("2026-06-10T14:00:00"))).toBe("Good Afternoon,");
    expect(getDashboardGreeting(new Date("2026-06-10T18:00:00"))).toBe("Good Evening,");
    expect(getDashboardGreeting(new Date("2026-06-10T22:00:00"))).toBe("Good Night,");
  });

  it("groups nav items by zone", () => {
    const core = getNavItemsByZone(DASHBOARD_NAV_ITEMS, "core");
    expect(core.map((item) => item.label)).toEqual(["Overview", "Community", "Neighbours"]);
  });

  it("detects workspace nav visibility", () => {
    expect(hasWorkspaceNav({ role: "USER" })).toBe(false);
    expect(hasWorkspaceNav({ isSeller: true })).toBe(true);
    expect(hasWorkspaceNav({ role: "ADMIN" })).toBe(true);
  });
});
