"use client";

import { useState, useRef, useEffect } from "react";
import { useMessages } from "@/hooks/use-messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Paperclip, Info, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

export function ChatWindow() {
  const { conversations, activeChatId, setActiveChatId, sendMessage } = useMessages();
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChat = conversations.find(c => c.id === activeChatId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  if (!activeChat) return null;

  return (
    <div className="flex flex-col h-full bg-background text-left">
      <header className="h-20 border-b border-border/10 px-4 md:px-6 flex items-center justify-between bg-card/5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setActiveChatId(null)}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-border/50 shadow-lg">
              <AvatarImage src={activeChat.participantAvatar} />
              <AvatarFallback className="font-bold">{activeChat.participantName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <h3 className="text-sm font-bold tracking-tight">{activeChat.participantName}</h3>
              <div className="flex items-center gap-2">
                {activeChat.participantRole && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{activeChat.participantRole}</span>
                )}
                {activeChat.context && (
                   <span className="text-[10px] text-muted-foreground font-bold opacity-70">• {activeChat.context}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent transition-colors"><Info size={18} /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent transition-colors"><MoreHorizontal size={18} /></Button>
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[radial-gradient(circle_at_top_right,rgba(97,179,204,0.03),transparent)]"
      >
        {activeChat.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <p className="text-sm font-bold">No messages yet. Start the conversation!</p>
          </div>
        )}
        {activeChat.messages.map((msg) => {
          const isMe = msg.senderId === "me";
          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg font-bold ${
                    isMe 
                    ? 'bg-accent text-accent-foreground rounded-tr-none' 
                    : 'bg-[#1E1E1E] border border-border/50 text-foreground rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mt-1 px-1 opacity-60">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 md:p-6 border-t border-border/10 bg-card/5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full h-11 w-11 hover:bg-white/5">
            <Paperclip size={20} />
          </Button>
          <div className="flex-1 relative">
            <Input 
              placeholder="Write a message..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="bg-background/50 border-border/50 h-12 rounded-full px-6 focus:ring-accent pr-12 text-sm font-bold"
            />
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground h-9 w-9 shadow-lg shadow-accent/20 transition-smooth"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
