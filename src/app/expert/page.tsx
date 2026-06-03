
"use client";

import { ExpertDashboard } from "@/components/expert/expert-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { Calendar, LayoutDashboard, Settings, ShieldCheck, Star, Wallet } from "lucide-react";
export default function ExpertPage() {
  return (
      <div className="flex h-full">
        {/* Contextual Expert Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-card/5 shrink-0">
          <div className="p-8 space-y-8">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent opacity-70 px-4">Expert Terminal</h3>
            </div>
            
            <nav className="space-y-1">
              <SidebarLink icon={<LayoutDashboard size={18} />} label="Operational Feed" active={true} />
              <SidebarLink icon={<Calendar size={18} />} label="Booking Calendar" />
              <SidebarLink icon={<Star size={18} />} label="Client Feedback" />
              <SidebarLink icon={<Wallet size={18} />} label="Earning Logs" />
              <div className="h-px bg-border/20 my-6 mx-4" />
              <SidebarLink icon={<Settings size={18} />} label="Service Settings" />
            </nav>
          </div>
        </aside>

        <div className="flex-1 max-w-6xl mx-auto py-8 px-6 space-y-10">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <PageHeader
              className="text-left"
              eyebrow="Verified Professional Interface"
              eyebrowIcon={ShieldCheck}
              eyebrowClassName="font-black tracking-[0.3em]"
              title={
                <>
                  Professional <span className="text-accent">Hub</span>
                </>
              }
              titleClassName="text-4xl font-black tracking-tighter"
              subtitle="Manage deployments and neighborhood reputation"
              subtitleClassName="text-[10px] font-black uppercase tracking-[0.2em] opacity-50"
            />
          </header>

          <ExpertDashboard />
        </div>
      </div>
  );
}

function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 font-black text-[11px] uppercase tracking-widest",
      active 
        ? "bg-accent/10 text-accent border border-accent/20 shadow-sm" 
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    )}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
