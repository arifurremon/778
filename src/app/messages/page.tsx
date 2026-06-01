"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChatList } from "@/components/messages/chat-list";
import { ChatWindow } from "@/components/messages/chat-window";
import { useMessages } from "@/hooks/use-messages";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  const { activeChatId } = useMessages();

  return (
      <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
        <div className={`p-6 pb-0 md:hidden ${activeChatId ? 'hidden' : 'block'}`}>
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px] mb-2">
             <MessageSquare size={12} /> Secure Channels
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Neighborhood <span className="text-accent">Inbox</span>
          </h1>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`w-full md:w-80 lg:w-96 border-r border-border/30 bg-card/5 flex-shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'} flex-col`}>
            <ChatList />
          </div>

          <div className={`flex-1 flex flex-col bg-background relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
            <AnimatePresence mode="wait">
              {activeChatId ? (
                <motion.div 
                  key={activeChatId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  <ChatWindow />
                </motion.div>
              ) : (
                <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent/40 mb-2">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Neighborhood Inbox</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Connect with residents, shop owners, or service experts in Chittagong. Select a conversation to begin.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
  );
}
