"use client";

import { useMessages } from "@/hooks/use-messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { GlobalUserBadges } from "@/components/user/global-user-badges";

export function ChatList() {
  const { conversations, activeChatId, setActiveChatId } = useMessages();

  return (
    <div className="flex flex-col h-full text-left">
      <div className="p-6 border-b border-border/10 space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-10 h-10 bg-background/40 border-border/30 rounded-xl text-xs font-bold"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {conversations.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground font-bold">
            No active conversations
          </div>
        ) : (
          conversations.map((conv) => (
            <motion.button
              key={conv.id}
              onClick={() => setActiveChatId(conv.id)}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 flex gap-4 text-left transition-colors border-b border-border/5 ${
                activeChatId === conv.id ? 'bg-primary/10 border-r-2 border-r-accent' : 'hover:bg-white/5'
              }`}
            >
              <div className="relative shrink-0">
                <Avatar className="w-12 h-12 border border-border/50 shadow-md">
                  <AvatarImage src={conv.participantAvatar} />
                  <AvatarFallback className="font-bold">{conv.participantName[0]}</AvatarFallback>
                </Avatar>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="flex items-center min-w-0">
                    <h4 className="text-sm font-bold truncate tracking-tight">{conv.participantName}</h4>
                    <GlobalUserBadges user={{ isVerified: true, isSeller: conv.participantRole.includes('Shop') || conv.participantRole.includes('Restaurant'), isServiceProvider: !conv.participantRole.includes('Shop') && !conv.participantRole.includes('Restaurant') }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold ml-2">{conv.timestamp}</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/10">
                    {conv.participantRole}
                  </span>
                  {conv.context && (
                    <span className="text-[8px] text-muted-foreground uppercase truncate opacity-60 font-bold">
                      • {conv.context}
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-foreground font-bold' : 'text-muted-foreground font-bold'}`}>
                  {conv.lastMessage || "Start a conversation..."}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
