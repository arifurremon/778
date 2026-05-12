"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare,
  FileText,
  Flag,
  ChevronRight,
} from "lucide-react";

const COMMUNITY_SECTIONS = [
  {
    icon: FileText,
    label: "Post Moderation",
    description: "Review and moderate community posts with visibility control",
    href: "/admin/posts",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: MessageSquare,
    label: "Comment Moderation",
    description: "Review, search, and bulk-delete comments across all posts",
    href: "/admin/community/comments",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Flag,
    label: "User Reports",
    description: "View flagged content and user-submitted reports",
    href: "#",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    soon: true,
  },
];

export default function CommunityIndexPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">
          <MessageSquare size={12} />
          Community
        </div>
        <h1 className="text-2xl font-black tracking-tight">Community Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Moderate posts, comments, and handle community reports</p>
      </div>
      <div className="grid gap-4">
        {COMMUNITY_SECTIONS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link href={item.soon ? "#" : item.href}>
                <div className={`flex items-center gap-5 p-5 bg-card/40 border border-border/50 rounded-2xl hover:border-border transition-all group cursor-pointer ${item.soon ? "opacity-60 cursor-not-allowed" : ""}`}>
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                    <Icon size={20} className={item.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{item.label}</p>
                      {item.soon && <span className="text-[9px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase">Soon</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  {!item.soon && <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
