"use client";

import { AlertTriangle, Loader2, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ConfirmationDialog } from '@/components/admin/actions/ConfirmationDialog';
import { FieldDefinition, SettingsForm } from '@/components/admin/settings/SettingsForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SettingsData {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  registrationOpen: boolean;
  emailVerificationReq: boolean;
  defaultPostVisibility: string;
  featuresEnabled: {
    posts: boolean;
    marketplace: boolean;
    services: boolean;
    messaging: boolean;
  };
  maintenanceMode: boolean;
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Maintenance Mode States
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const json = await res.json();
      const data = json.data ?? json;
      setSettings(data);
      setMaintenanceMode(data.maintenanceMode ?? false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load settings." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (endpoint: string, data: Record<string, unknown>) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save settings');
  };

  const handleMaintenanceToggle = (checked: boolean) => {
    if (checked) {
      // Trying to enable maintenance mode requires confirmation
      setPendingMaintenanceState(true);
      setShowMaintenanceDialog(true);
    } else {
      // Disabling maintenance mode does not require confirmation
      executeMaintenanceUpdate(false);
    }
  };

  const executeMaintenanceUpdate = async (newState: boolean) => {
    setIsUpdatingMaintenance(true);
    try {
      await handleSaveSettings('maintenance', { maintenanceMode: newState });
      setMaintenanceMode(newState);
      toast({ 
        title: newState ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled", 
        description: newState ? "The platform is now offline for users." : "The platform is back online.",
        variant: newState ? "destructive" : "default"
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update maintenance mode." });
    } finally {
      setIsUpdatingMaintenance(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const siteInfoFields: FieldDefinition[] = [
    { name: 'siteName', label: 'Site Name', type: 'text', required: true },
    { name: 'siteDescription', label: 'Site Description', type: 'textarea' },
    { name: 'contactEmail', label: 'Contact Email', type: 'email', required: true },
    { name: 'supportPhone', label: 'Support Phone', type: 'tel' }
  ];

  const accessControlFields: FieldDefinition[] = [
    { 
      name: 'registrationOpen', 
      label: 'Registration Open', 
      type: 'toggle',
      description: 'Allow new users to sign up for the platform.' 
    },
    { 
      name: 'emailVerificationReq', 
      label: 'Require Email Verification', 
      type: 'toggle',
      description: 'Users must verify their email before accessing the platform.' 
    },
    {
      name: 'defaultPostVisibility',
      label: 'Default Post Visibility',
      type: 'select',
      options: [
        { label: 'Public', value: 'PUBLIC' },
        { label: 'Neighbours Only', value: 'NEIGHBOURS' },
        { label: 'Private', value: 'PRIVATE' }
      ]
    }
  ];

  const featureFields: FieldDefinition[] = [
    { name: 'posts', label: 'Community Posts', type: 'toggle', description: 'Enable the community feed and posting.' },
    { name: 'marketplace', label: 'Marketplace', type: 'toggle', description: 'Enable shops and product listings.' },
    { name: 'services', label: 'Expert Services', type: 'toggle', description: 'Enable service provider directory.' },
    { name: 'messaging', label: 'Direct Messaging', type: 'toggle', description: 'Allow users to message each other.' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
          <SettingsIcon size={12} />
          Global Configuration
        </div>
        <h1 className="text-3xl font-black tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage core platform behavior, access controls, and features.</p>
      </div>

      <div className="space-y-8">
        {/* Card 1: Site Information (Manual Save) */}
        <SettingsForm
          title="Site Information"
          description="Publicly displayed information about the platform."
          fields={siteInfoFields}
          defaultValues={{
            siteName: settings.siteName,
            siteDescription: settings.siteDescription,
            contactEmail: settings.contactEmail,
            supportPhone: settings.supportPhone
          }}
          onSubmit={(data) => handleSaveSettings('general', data)}
          autoSave={false}
        />

        {/* Card 2: Access Control (Auto Save) */}
        <SettingsForm
          title="Access Control"
          description="Manage who can access the platform and how."
          fields={accessControlFields}
          defaultValues={{
            registrationOpen: settings.registrationOpen,
            emailVerificationReq: settings.emailVerificationReq,
            defaultPostVisibility: settings.defaultPostVisibility
          }}
          onSubmit={(data) => handleSaveSettings('access', data)}
          autoSave={true}
        />

        {/* Card 3: Feature Flags (Auto Save) */}
        <SettingsForm
          title="Feature Flags"
          description="Enable or disable core modules globally."
          fields={featureFields}
          defaultValues={settings.featuresEnabled}
          onSubmit={(data) => handleSaveSettings('features', { featuresEnabled: data })}
          autoSave={true}
        />

        {/* Card 4: Maintenance Mode */}
        <Card className={cn(
          "border-2 transition-all duration-300 shadow-xl shadow-black/5 overflow-hidden relative",
          maintenanceMode ? "border-rose-500 bg-rose-500/5" : "border-border/50"
        )}>
          {maintenanceMode && (
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertTriangle size={100} className="text-rose-500" />
            </div>
          )}
          <CardHeader className={cn("pb-4 border-b", maintenanceMode ? "border-rose-500/20" : "border-border/30 bg-muted/10")}>
            <CardTitle className={cn("text-lg font-black tracking-tight flex items-center gap-2", maintenanceMode && "text-rose-600")}>
              <ShieldAlert size={18} /> Danger Zone: Maintenance Mode
            </CardTitle>
            <CardDescription className={maintenanceMode ? "text-rose-600/70 font-medium" : ""}>
              Taking the platform offline. Only administrators will be able to log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-row items-center justify-between rounded-xl border p-6 bg-background/50 backdrop-blur-sm shadow-sm">
              <div className="space-y-1 pr-6">
                <h4 className="text-sm font-bold">Enable Maintenance Mode</h4>
                <p className="text-xs text-muted-foreground">
                  This will immediately terminate all active user sessions and display a maintenance screen to visitors. Use with extreme caution.
                </p>
              </div>
              <Switch 
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceToggle}
                disabled={isUpdatingMaintenance}
                className={maintenanceMode ? "data-[state=checked]:bg-rose-500" : ""}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={showMaintenanceDialog}
        onOpenChange={setShowMaintenanceDialog}
        title="Activate Maintenance Mode?"
        description="Are you absolutely sure? This action will immediately block all regular users from accessing the platform. Only admins will be able to log in."
        confirmText="Yes, take platform offline"
        onConfirm={() => executeMaintenanceUpdate(pendingMaintenanceState)}
      />
    </div>
  );
}
