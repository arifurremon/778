"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "@/hooks/use-toast";
import {
  appSettingsFromPrivacy,
  DEFAULT_APP_SETTINGS,
  privacyPatchFromAppSettings,
  type AppNotificationSettings,
} from "@/lib/app-settings";
import { api } from "@/lib/api";
import {
  Bell,
  Loader2,
  Monitor,
  Moon,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ProfileResponse = {
  privacySettings?: Record<string, string> | null;
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppNotificationSettings>(DEFAULT_APP_SETTINGS);
  const [privacyBase, setPrivacyBase] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.get<ProfileResponse>("/api/user/profile");
      const privacy = (data.privacySettings ?? {}) as Record<string, string>;
      setPrivacyBase(privacy);
      setSettings(appSettingsFromPrivacy(privacy));
    } catch {
      toast({
        variant: "destructive",
        title: "Could not load settings",
        description: "Showing defaults. Try again when you are back online.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/user/profile", {
        privacySettings: privacyPatchFromAppSettings(settings, privacyBase),
      });
      setPrivacyBase(privacyPatchFromAppSettings(settings, privacyBase));
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Please try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    toast({
      variant: "destructive",
      title: "Action restricted",
      description:
        "Please contact support to initiate account deletion for security verification.",
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-label="Loading settings" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 space-y-12">
      <PageHeader
        eyebrow="System Preferences"
        eyebrowIcon={SettingsIcon}
        title={
          <>
            App <span className="text-accent">Settings</span>
          </>
        }
        subtitle="Customize your digital experience on The Chattala"
        subtitleClassName="text-xs font-bold tracking-wide opacity-60 uppercase"
      />

      <div className="space-y-8">
        <section className="bg-card/20 border border-border/50 rounded-3xl p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-3">
            <Moon size={16} className="text-accent" /> Appearance
          </h3>

          <div className="space-y-4">
            <Label className="text-base font-bold">Theme Preference</Label>
            <RadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2 bg-background/40 p-4 rounded-2xl border border-border/30 cursor-pointer hover:border-accent/30 transition-colors">
                <RadioGroupItem value="light" id="light" />
                <Label
                  htmlFor="light"
                  className="flex items-center gap-2 cursor-pointer flex-1 text-xs font-bold uppercase tracking-widest"
                >
                  <Sun size={14} className="text-orange-400" /> Light
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-background/40 p-4 rounded-2xl border border-border/30 cursor-pointer hover:border-accent/30 transition-colors">
                <RadioGroupItem value="dark" id="dark" />
                <Label
                  htmlFor="dark"
                  className="flex items-center gap-2 cursor-pointer flex-1 text-xs font-bold uppercase tracking-widest"
                >
                  <Moon size={14} className="text-accent" /> Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-background/40 p-4 rounded-2xl border border-border/30 cursor-pointer hover:border-accent/30 transition-colors">
                <RadioGroupItem value="system" id="system" />
                <Label
                  htmlFor="system"
                  className="flex items-center gap-2 cursor-pointer flex-1 text-xs font-bold uppercase tracking-widest"
                >
                  <Monitor size={14} className="text-muted-foreground" /> System
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground font-medium">
              Theme is saved on this device automatically.
            </p>
          </div>
        </section>

        <section className="bg-card/20 border border-border/50 rounded-3xl p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-3">
            <Bell size={16} className="text-accent" /> Alerts & Notifications
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Push Notifications</Label>
                <p className="text-xs text-muted-foreground font-bold">
                  Real-time updates for messages and orders
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(v) =>
                  setSettings((s) => ({ ...s, pushNotifications: v }))
                }
                aria-label="Push notifications"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Email Updates</Label>
                <p className="text-xs text-muted-foreground font-bold">
                  Weekly neighborhood digests and system logs
                </p>
              </div>
              <Switch
                checked={settings.emailUpdates}
                onCheckedChange={(v) =>
                  setSettings((s) => ({ ...s, emailUpdates: v }))
                }
                aria-label="Email updates"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Product Updates</Label>
                <p className="text-xs text-muted-foreground font-bold">
                  News about new Chattala features
                </p>
              </div>
              <Switch
                checked={settings.marketing}
                onCheckedChange={(v) =>
                  setSettings((s) => ({ ...s, marketing: v }))
                }
                aria-label="Product updates"
              />
            </div>
          </div>
        </section>

        <section className="bg-card/20 border border-border/50 rounded-3xl p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-3">
            <ShieldCheck size={16} className="text-accent" /> Privacy & Local Data
          </h3>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-base font-bold">Hyperlocal Tracking</Label>
              <p className="text-xs text-muted-foreground font-bold">
                More accurate shop filtering for your Thana
              </p>
            </div>
            <Switch
              checked={settings.preciseLocation}
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, preciseLocation: v }))
              }
              aria-label="Hyperlocal tracking"
            />
          </div>
        </section>

        <section className="bg-destructive/5 border border-destructive/20 rounded-3xl p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-destructive flex items-center gap-3">
            <ShieldAlert size={16} /> Dangerous Territory
          </h3>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed font-bold">
              Deleting your account is permanent. This will remove all your shop
              listings, expert profiles, and community posts.
            </p>
            <Button
              variant="ghost"
              onClick={handleDeleteAccount}
              className="text-destructive hover:bg-destructive/10 h-12 w-full justify-between px-6 rounded-xl border border-destructive/20"
            >
              <span className="font-bold uppercase tracking-widest text-[10px]">
                Delete My Permanent Residency
              </span>
              <Trash2 size={16} />
            </Button>
          </div>
        </section>
      </div>

      <div className="pt-8 border-t border-border/10 flex justify-between items-center gap-4">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          The Chattala v1.1.0 • Theme Engine Active
        </p>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent text-accent-foreground font-black uppercase tracking-widest text-[10px] h-12 px-10 rounded-xl shadow-lg shadow-accent/20 transition-smooth"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save All Changes"
          )}
        </Button>
      </div>

      <div className="h-20" />
    </div>
  );
}
