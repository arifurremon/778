/** Keys stored in User.privacySettings JSON (string values for API compatibility). */
export const APP_SETTING_KEYS = {
  pushNotifications: "pushNotifications",
  emailUpdates: "emailUpdates",
  marketing: "marketing",
  preciseLocation: "preciseLocation",
} as const;

export type AppNotificationSettings = {
  pushNotifications: boolean;
  emailUpdates: boolean;
  marketing: boolean;
  preciseLocation: boolean;
};

export const DEFAULT_APP_SETTINGS: AppNotificationSettings = {
  pushNotifications: true,
  emailUpdates: false,
  marketing: true,
  preciseLocation: true,
};

export function appSettingsFromPrivacy(
  privacy: Record<string, string> | null | undefined
): AppNotificationSettings {
  const read = (key: string, defaultValue: boolean) => {
    const v = privacy?.[key];
    if (v === "true") return true;
    if (v === "false") return false;
    return defaultValue;
  };
  return {
    pushNotifications: read(APP_SETTING_KEYS.pushNotifications, DEFAULT_APP_SETTINGS.pushNotifications),
    emailUpdates: read(APP_SETTING_KEYS.emailUpdates, DEFAULT_APP_SETTINGS.emailUpdates),
    marketing: read(APP_SETTING_KEYS.marketing, DEFAULT_APP_SETTINGS.marketing),
    preciseLocation: read(APP_SETTING_KEYS.preciseLocation, DEFAULT_APP_SETTINGS.preciseLocation),
  };
}

export function privacyPatchFromAppSettings(
  settings: AppNotificationSettings,
  existing: Record<string, string> | null | undefined
): Record<string, string> {
  return {
    ...(existing ?? {}),
    [APP_SETTING_KEYS.pushNotifications]: String(settings.pushNotifications),
    [APP_SETTING_KEYS.emailUpdates]: String(settings.emailUpdates),
    [APP_SETTING_KEYS.marketing]: String(settings.marketing),
    [APP_SETTING_KEYS.preciseLocation]: String(settings.preciseLocation),
  };
}
