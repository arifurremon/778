"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Settings,
  ClipboardList,
  Bell,
  ShieldCheck,
  Globe,
  ChevronRight,
  Info,
  Server,
  Database,
} from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    title: "System",
    items: [
      {
        icon: ClipboardList,
        label: "Audit Log",
        description: "View all system activity, user actions, and admin operations",
        href: "/admin/settings/audit-log",
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
      },
      {
        icon: ShieldCheck,
        label: "Permissions",
        description: "Manage admin roles and access levels",
        href: "/admin/settings/permissions",
        color: "text-rose-400",
        bg: "bg-rose-400/10",
        soon: true,
      },
      {
        icon: Bell,
        label: "Notifications",
        description: "Configure admin alerts and notification preferences",
        href: "/admin/settings/notifications",
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        soon: true,
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        icon: Globe,
        label: "General Settings",
        description: "Site-wide configuration, platform name, and feature flags",
        href: "/admin/settings/general",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        soon: true,
      },
      {
        icon: Server,
        label: "System Health",
        description: "Monitor server performance, API latency, and error rates",
        href: "/admin/analytics",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
      },
      {
        icon: Database,
        label: "Database",
        description: "Database statistics, connection pool, and maintenance info",
        href: "/admin/settings/database",
        color: "text-cyan-400",
        bg: "bg-cyan-400/10",
        soon: true,
      },
    ],
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          <Settings size={12} />
          Configuration
        </div>
        <h1 className="text-2xl font-black tracking-tight">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage platform configuration and system settings</p>
      </div>

      {SETTINGS_SECTIONS.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
          className="space-y-3"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
            {section.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.soon ? "#" : item.href}>
                  <div className={`relative flex flex-col gap-3 p-5 bg-card/40 border border-border/50 rounded-2xl hover:border-border transition-all group cursor-pointer ${item.soon ? "opacity-60 cursor-not-allowed" : ""}`}>
                    {item.soon && (
                      <div className="absolute top-3 right-3 text-[9px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Soon
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <Icon size={18} className={item.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{item.label}</p>
                        {!item.soon && <ChevronRight size={13} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5"
      >
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-400">Admin Settings Panel</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Settings marked as "Soon" are planned features in upcoming releases. The Audit Log and System Health pages are fully operational.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
