import { describe, expect, it } from "vitest";
import {
  appSettingsFromPrivacy,
  DEFAULT_APP_SETTINGS,
  privacyPatchFromAppSettings,
} from "@/lib/app-settings";

describe("app-settings", () => {
  it("returns defaults when privacy is empty", () => {
    expect(appSettingsFromPrivacy(null)).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("reads stored string booleans", () => {
    expect(
      appSettingsFromPrivacy({
        pushNotifications: "false",
        emailUpdates: "true",
      })
    ).toMatchObject({
      pushNotifications: false,
      emailUpdates: true,
    });
  });

  it("merges patch without dropping unrelated privacy keys", () => {
    const patch = privacyPatchFromAppSettings(
      { ...DEFAULT_APP_SETTINGS, emailUpdates: true },
      { mobile: "PRIVATE", email: "PUBLIC" }
    );
    expect(patch.mobile).toBe("PRIVATE");
    expect(patch.emailUpdates).toBe("true");
  });
});
