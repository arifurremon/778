
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  History, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Zap, 
  ArrowRight,
  Search,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppEmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { useActivity } from "@/hooks/use-activity";
import type { ActivityItem, ActivityTab } from "@/lib/activity-utils";
import { Skeleton } from "@/components/ui/skeleton";

const TABS: ActivityTab[] = ["all", "likes", "comments", "saved", "system"];

export default function ActivityPage() {
  const {
    activities,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    markAsRead,
  } = useActivity("all");

  return (
      <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
        <PageHeader
          eyebrow="Audit Trail"
          eyebrowIcon={History}
          title={
            <>
              Activity <span className="text-accent">History</span>
            </>
          }
          subtitle="Review your past interactions within the Chattala ecosystem"
          subtitleClassName="text-[10px] font-bold uppercase tracking-widest opacity-60"
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActivityTab)} className="space-y-8">
          <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full w-full max-w-2xl overflow-x-auto scrollbar-hide flex">
            {TABS.map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab} 
                className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest py-3"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value={activeTab} className="mt-0 space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : error ? (
                  <AppEmptyState
                    icon={Search}
                    title="Could not load activity"
                    description={error}
                    action={{ label: "Explore Community", href: "/community" }}
                    className="py-16"
                  />
                ) : activities.length === 0 ? (
                  <AppEmptyState
                    icon={Search}
                    title="No activities found"
                    description="Start engaging with the community to fill your log."
                    action={{ label: "Explore Community", href: "/community" }}
                    className="py-16"
                  />
                ) : (
                  activities.map((act) => (
                    <ActivityCard key={act.id} item={act} onOpen={() => void markAsRead(act.id)} />
                  ))
                )}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
  );
}

function ActivityCard({ item, onOpen }: { item: ActivityItem; onOpen: () => void }) {
  const getIcon = (type: ActivityTab) => {
    switch (type) {
      case 'likes': return <Heart size={16} className="text-rose-500 fill-current" />;
      case 'comments': return <MessageCircle size={16} className="text-emerald-500 fill-current" />;
      case 'saved': return <Bookmark size={16} className="text-accent fill-current" />;
      case 'system': return <Zap size={16} className="text-amber-500 fill-current" />;
      default: return <History size={16} />;
    }
  };

  const getBadgeColor = (type: ActivityTab) => {
    switch (type) {
      case 'likes': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'comments': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'saved': return 'bg-accent/10 text-accent border-accent/20';
      case 'system': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  return (
    <div className={cn(
      "bg-card/30 border border-border/50 rounded-2xl p-5 hover:bg-card/40 hover:border-accent/30 transition-all duration-300 group flex items-center justify-between gap-6",
      !item.isRead && "border-accent/40 bg-accent/5"
    )}>
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
          getBadgeColor(item.type)
        )}>
          {getIcon(item.type)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-foreground leading-tight mb-1">
            {item.description}
          </p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            <span>{item.timestamp}</span>
            <span>•</span>
            <span className="text-accent">{item.context}</span>
          </div>
        </div>
      </div>
      
      <Link href={item.href} onClick={onOpen}>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full border-border/50 text-[9px] font-black uppercase tracking-widest px-5 h-9 group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent transition-all"
        >
          View Context <ArrowRight size={12} className="ml-1.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  );
}
