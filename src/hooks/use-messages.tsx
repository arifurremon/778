"use client";

import { api } from "@/lib/api";
import { getPusherClient } from "@/lib/pusher-client";
import { useSession } from "next-auth/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    username: string;
    profileImage: string;
  };
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantUsername: string;
  participantRole?: string; // kept for UI badge compat
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
  context?: string;
}

interface MessagesContextType {
  conversations: Conversation[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
  startConversation: (participant: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
    context?: string;
  }) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  totalUnread: number;
  isLoading: boolean;
  initializeMessages: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const MessagesContext = createContext<MessagesContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // ── Initial Load ────────────────────────────────────────────────────────────

  const initializeMessages = useCallback(async () => {
    if (hasFetchedRef.current || !session?.user?.id) return;
    hasFetchedRef.current = true;
    setIsLoading(true);
    try {
      const data = await api.get<{ conversations: Conversation[] }>(
        "/api/messages"
      );
      setConversations(
        data.conversations.map((c) => ({ ...c, messages: [] }))
      );
    } catch (err) {
      console.error("[Messages] Failed to load conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // ── Pusher real-time subscription ──────────────────────────────────────────

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const pusherClient = getPusherClient();
    if (!pusherClient) return; // env vars not set — silent fallback

    const channel = pusherClient.subscribe(`private-user-${userId}`);

    channel.bind(
      "new-message",
      (payload: { conversationId: string; message: Message }) => {
        const { conversationId, message } = payload;

        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conversationId);

          if (exists) {
            return prev.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    lastMessage: message.text,
                    lastMessageAt: message.createdAt,
                    unreadCount:
                      activeChatId === conversationId
                        ? 0
                        : c.unreadCount + 1,
                    messages: [...c.messages, message],
                  }
                : c
            );
          }

          // New conversation started by the other party — re-fetch list
          hasFetchedRef.current = false;
          initializeMessages();
          return prev;
        });
      }
    );

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`private-user-${userId}`);
    };
  }, [session?.user?.id, activeChatId, initializeMessages]);

  // ── Set active chat + mark as read ─────────────────────────────────────────

  const setActiveChatId = useCallback(
    async (id: string | null) => {
      setActiveChatIdState(id);
      if (!id) return;

      // Fetch messages for this conversation if not already loaded
      const conv = conversations.find((c) => c.id === id);
      if (conv && conv.messages.length === 0) {
        await fetchMessages(id);
      }

      // Mark as read
      if (conv && conv.unreadCount > 0) {
        await markAsRead(id);
      }
    },
    [conversations]
  );

  // ── Fetch messages for a conversation ──────────────────────────────────────

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await api.get<{ messages: Message[] }>(
        `/api/messages/${conversationId}`
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: data.messages }
            : c
        )
      );
    } catch (err) {
      console.error("[Messages] Failed to fetch messages:", err);
    }
  }, []);

  // ── Mark conversation as read ───────────────────────────────────────────────

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await api.patch(`/api/messages/${conversationId}/read`, {});
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error("[Messages] Failed to mark as read:", err);
    }
  }, []);

  // ── Send a message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeChatId || !text.trim()) return;

      try {
        const newMessage = await api.post<Message>(
          `/api/messages/${activeChatId}`,
          { text }
        );

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  lastMessage: newMessage.text,
                  lastMessageAt: newMessage.createdAt,
                  messages: [...c.messages, newMessage],
                }
              : c
          )
        );
      } catch (err) {
        console.error("[Messages] Failed to send message:", err);
        throw err; // re-throw so the UI can show an error toast
      }
    },
    [activeChatId]
  );

  // ── Start a new conversation ────────────────────────────────────────────────

  const startConversation = useCallback(
    async (participant: {
      id: string;
      name: string;
      avatar: string;
      role?: string;
      context?: string;
    }) => {
      // Check if conversation already exists locally
      const existing = conversations.find(
        (c) => c.participantId === participant.id
      );
      if (existing) {
        setActiveChatId(existing.id);
        return;
      }

      try {
        const { conversationId } = await api.post<{ conversationId: string }>(
          "/api/messages",
          { recipientId: participant.id }
        );

        const newConv: Conversation = {
          id: conversationId,
          participantId: participant.id,
          participantName: participant.name,
          participantAvatar: participant.avatar,
          participantUsername: participant.id,
          participantRole: participant.role,
          lastMessage: "",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          messages: [],
          context: participant.context,
        };

        setConversations((prev) => [newConv, ...prev]);
        setActiveChatId(conversationId);
      } catch (err) {
        console.error("[Messages] Failed to start conversation:", err);
        throw err;
      }
    },
    [conversations, setActiveChatId]
  );

  // ── Derived state ───────────────────────────────────────────────────────────

  const totalUnread = conversations.reduce(
    (acc, c) => acc + c.unreadCount,
    0
  );

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        activeChatId,
        setActiveChatId,
        sendMessage,
        startConversation,
        fetchMessages,
        markAsRead,
        totalUnread,
        isLoading,
        initializeMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context)
    throw new Error("useMessages must be used within MessagesProvider");
  return context;
};
