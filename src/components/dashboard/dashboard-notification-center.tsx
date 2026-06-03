"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Briefcase,
  Heart,
  MessageCircle,
  Package,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DashboardNotification {
  id: string;
  type: string;
  description: string;
  createdAt: string | Date;
  isRead?: boolean;
  contextUrl?: string | null;
}

interface DashboardNotificationCenterProps {
  notifications: DashboardNotification[];
  unreadCount: number;
  isMobile: boolean;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
}

function NotificationList({
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onMarkAsRead,
  onNavigate,
}: {
  notifications: DashboardNotification[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  return (
    <div className="flex flex-col h-full max-h-[450px]">
      <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-black uppercase tracking-widest">Notifications</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          className="text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/5 h-8 px-3 rounded-lg"
        >
          Mark all as read
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {notifications.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              No new alerts
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const isLike = notification.type === "POST_REACTION";
            const isComment =
              notification.type === "NEW_COMMENT" || notification.type === "COMMENT_REPLY";
            const isConnection =
              notification.type === "NEIGHBOR_REQUEST" ||
              notification.type === "NEIGHBOR_ACCEPTED";
            const isModeration =
              notification.type === "SYSTEM_ALERT" ||
              notification.type === "MODERATION_ACTION" ||
              notification.type === "POST_FLAGGED";
            const isCommerce =
              notification.type === "NEW_ORDER" ||
              notification.type === "ORDER_UPDATED" ||
              notification.type === "SHOP_VERIFIED" ||
              notification.type === "NEW_PRODUCT_REVIEW";
            const isService =
              notification.type === "SERVICE_BOOKED" ||
              notification.type === "SERVICE_UPDATED" ||
              notification.type === "SERVICE_VERIFIED";

            return (
              <div
                key={notification.id}
                onClick={() => {
                  if (notification.isRead === false) onMarkAsRead(notification.id);
                  if (notification.contextUrl) onNavigate(notification.contextUrl);
                }}
                className={cn(
                  "px-4 py-4 flex gap-4 transition-colors relative cursor-pointer group",
                  !notification.isRead
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border/30",
                    isModeration
                      ? "bg-rose-500/10 text-rose-500"
                      : isLike
                        ? "bg-blue-500/10 text-blue-500"
                        : isComment
                          ? "bg-emerald-500/10 text-emerald-500"
                          : isConnection
                            ? "bg-purple-500/10 text-purple-500"
                            : isCommerce
                              ? "bg-amber-500/10 text-amber-500"
                              : isService
                                ? "bg-cyan-500/10 text-cyan-500"
                                : "bg-muted text-muted-foreground"
                  )}
                >
                  {isModeration ? (
                    <ShieldAlert size={18} />
                  ) : isLike ? (
                    <Heart size={18} className="fill-current" />
                  ) : isComment ? (
                    <MessageCircle size={18} className="fill-current" />
                  ) : isConnection ? (
                    <Users size={18} className="fill-current" />
                  ) : isCommerce ? (
                    <Package size={18} />
                  ) : isService ? (
                    <Briefcase size={18} />
                  ) : (
                    <Bell size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p
                    className={cn(
                      "text-xs leading-relaxed font-bold",
                      !notification.isRead ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {notification.description}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="p-4 border-t border-border/50 bg-muted/20 shrink-0 space-y-1">
        <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest">
          Alerts are actionable · Activity History is your timeline
        </p>
        <Link href="/activity" className="w-full">
          <Button
            variant="link"
            className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground h-auto p-0"
          >
            View Activity History
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function DashboardNotificationCenter({
  notifications,
  unreadCount,
  isMobile,
  onMarkAllAsRead,
  onMarkAsRead,
}: DashboardNotificationCenterProps) {
  const router = useRouter();

  const list = (
    <NotificationList
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAllAsRead={onMarkAllAsRead}
      onMarkAsRead={onMarkAsRead}
      onNavigate={(url) => router.push(url)}
    />
  );

  const triggerClassName = cn(
    "rounded-full transition-all duration-300 relative w-11 h-11",
    "bg-card/30 border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className={triggerClassName}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-background animate-in zoom-in shadow-lg">
                {unreadCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-[2.5rem] p-0 border-t-0 bg-background overflow-hidden max-h-[85vh]"
        >
          <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mt-4 mb-2" />
          <SheetHeader className="hidden">
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          {list}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            triggerClassName,
            "data-[state=open]:bg-primary data-[state=open]:text-white data-[state=open]:shadow-lg"
          )}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-background animate-in zoom-in shadow-lg">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl overflow-hidden mt-2"
      >
        {list}
      </PopoverContent>
    </Popover>
  );
}
