
"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
  context?: string;
}

interface MessagesContextType {
  conversations: Conversation[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  sendMessage: (text: string) => void;
  startConversation: (participant: { id: string, name: string, avatar: string, role: string, context?: string }) => void;
  totalUnread: number;
  initializeMessages: () => void;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    participantId: "s1",
    participantName: "Mezban Haile Ayun",
    participantAvatar: "https://picsum.photos/seed/mezban/100",
    participantRole: "Restaurant",
    lastMessage: "Your order is ready for pickup!",
    timestamp: "10:30 AM",
    unreadCount: 1,
    context: "Order #CH-9231",
    messages: [
      { id: "m1", senderId: "s1", text: "Hello! Thank you for your order.", timestamp: "10:15 AM" },
      { id: "m2", senderId: "me", text: "Hi, when will it be ready?", timestamp: "10:20 AM" },
      { id: "m3", senderId: "s1", text: "Your order is ready for pickup!", timestamp: "10:30 AM" },
    ]
  },
  {
    id: "conv-2",
    participantId: "p1",
    participantName: "Dr. Ahmed Kabir",
    participantAvatar: "https://picsum.photos/seed/doc1/100",
    participantRole: "Cardiologist",
    lastMessage: "Please bring your previous reports.",
    timestamp: "Yesterday",
    unreadCount: 0,
    context: "Appointment: Oct 24",
    messages: [
      { id: "m4", senderId: "p1", text: "Confirmed your appointment for tomorrow.", timestamp: "Yesterday" },
      { id: "m5", senderId: "p1", text: "Please bring your previous reports.", timestamp: "Yesterday" },
    ]
  }
];

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const initializeMessages = useCallback(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    const saved = localStorage.getItem("chattala_messages");
    if (saved) {
      setConversations(JSON.parse(saved));
    } else {
      setConversations(MOCK_CONVERSATIONS);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("chattala_messages", JSON.stringify(conversations));
  }, [conversations, isHydrated]);

  const totalUnread = conversations.reduce((acc, curr) => acc + curr.unreadCount, 0);

  const sendMessage = (text: string) => {
    if (!activeChatId || !text.trim()) return;

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeChatId) {
        const newMessage: Message = {
          id: `msg-${Math.random().toString(36).substr(2, 9)}`,
          senderId: "me",
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...conv,
          lastMessage: text,
          timestamp: "Just now",
          messages: [...conv.messages, newMessage]
        };
      }
      return conv;
    }));
  };

  const startConversation = (participant: { id: string, name: string, avatar: string, role: string, context?: string }) => {
    const existing = conversations.find(c => c.participantId === participant.id);
    if (existing) {
      setActiveChatId(existing.id);
      return;
    }

    const newConv: Conversation = {
      id: `conv-${Math.random().toString(36).substr(2, 9)}`,
      participantId: participant.id,
      participantName: participant.name,
      participantAvatar: participant.avatar,
      participantRole: participant.role,
      lastMessage: "Conversation started",
      timestamp: "Just now",
      unreadCount: 0,
      context: participant.context,
      messages: []
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveChatId(newConv.id);
  };

  return (
    <MessagesContext.Provider value={{
      conversations,
      activeChatId,
      setActiveChatId,
      sendMessage,
      startConversation,
      totalUnread,
      initializeMessages,
    }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) throw new Error("useMessages must be used within MessagesProvider");
  return context;
};
