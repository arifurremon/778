import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({ logErrorToSentry: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  hasRedisConfigs: vi.fn(() => false),
  runRateLimit: vi.fn(async () => ({ success: true, limit: 30, remaining: 29, reset: Date.now() + 60_000 })),
  rateLimiters: {
    messages: { limit: vi.fn().mockResolvedValue({ success: true }) },
  },
}));

vi.mock("@/lib/pusher", () => ({
  pusher: { trigger: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/lib/user-blocks", () => ({
  assertCanInteract: vi.fn().mockResolvedValue(undefined),
  blockForbiddenResponse: vi.fn(() => new Response(null, { status: 403 })),
  getInteractionBlockedUserIds: vi.fn().mockResolvedValue([]),
  UserBlockError: class UserBlockError extends Error {},
}));

const mockRequireActiveSession = vi.fn();
const mockRequireActiveMutation = vi.fn();

vi.mock("@/lib/session-guards", () => ({
  requireActiveSession: () => mockRequireActiveSession(),
  requireActiveMutation: (req: NextRequest) => mockRequireActiveMutation(req),
}));

import { GET as listConversations, POST as startConversation } from "@/app/api/messages/route";
import { GET as getMessages, POST as sendMessage } from "@/app/api/messages/[conversationId]/route";

const VIEWER_ID = testUsers.regular.id;
const OTHER_ID = "00000000-0000-4000-8000-000000000099";
const CONV_ID = "00000000-0000-4000-8000-0000000000aa";

function mockSession() {
  mockRequireActiveSession.mockResolvedValue({
    error: null,
    session: { user: { id: VIEWER_ID, name: "Viewer" } },
  });
  mockRequireActiveMutation.mockResolvedValue({
    error: null,
    session: { user: { id: VIEWER_ID, name: "Viewer" } },
  });
}

describe("Messages API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockSession();
  });

  it("GET /api/messages returns shaped conversation list", async () => {
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        id: CONV_ID,
        participantA: VIEWER_ID,
        participantB: OTHER_ID,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
        userA: {
          id: VIEWER_ID,
          name: "Viewer",
          username: "viewer",
          profileImage: null,
        },
        userB: {
          id: OTHER_ID,
          name: "Other User",
          username: "other",
          profileImage: "/avatar.png",
        },
        messages: [{ text: "Hello", createdAt: new Date("2026-01-02"), senderId: OTHER_ID }],
        _count: { messages: 1 },
      },
    ]);

    const res = await listConversations();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.conversations).toHaveLength(1);
    expect(json.conversations[0].participantId).toBe(OTHER_ID);
    expect(json.conversations[0].lastMessage).toBe("Hello");
    expect(json.conversations[0].unreadCount).toBe(1);
  });

  it("POST /api/messages starts or resumes a conversation", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: OTHER_ID });
    prismaMock.conversation.upsert.mockResolvedValue({ id: CONV_ID });

    const res = await startConversation(
      new NextRequest("http://localhost/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost",
          "x-csrf-token": "test",
        },
        body: JSON.stringify({ recipientId: OTHER_ID }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.conversationId).toBe(CONV_ID);
    expect(prismaMock.conversation.upsert).toHaveBeenCalled();
  });

  it("GET /api/messages/[conversationId] returns paginated messages", async () => {
    prismaMock.conversation.findFirst.mockResolvedValue({
      id: CONV_ID,
      participantA: VIEWER_ID,
      participantB: OTHER_ID,
    });
    prismaMock.message.findMany.mockResolvedValue([
      {
        id: "msg-1",
        text: "Hi",
        isRead: true,
        createdAt: new Date("2026-01-01"),
        senderId: OTHER_ID,
        sender: {
          id: OTHER_ID,
          name: "Other",
          username: "other",
          profileImage: null,
        },
      },
    ]);

    const res = await getMessages(
      new NextRequest(`http://localhost/api/messages/${CONV_ID}`),
      { params: Promise.resolve({ conversationId: CONV_ID }) }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.messages).toHaveLength(1);
    expect(json.messages[0].text).toBe("Hi");
  });

  it("POST /api/messages/[conversationId] creates a message", async () => {
    prismaMock.conversation.findFirst.mockResolvedValue({
      id: CONV_ID,
      participantA: VIEWER_ID,
      participantB: OTHER_ID,
    });

    const createdMessage = {
      id: "msg-new",
      text: "Test message",
      isRead: false,
      createdAt: new Date(),
      senderId: VIEWER_ID,
      sender: {
        id: VIEWER_ID,
        name: "Viewer",
        username: "viewer",
        profileImage: null,
      },
    };

    prismaMock.$transaction.mockResolvedValue([createdMessage]);

    const res = await sendMessage(
      new NextRequest(`http://localhost/api/messages/${CONV_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost",
          "x-csrf-token": "test",
        },
        body: JSON.stringify({ text: "Test message" }),
      }),
      { params: Promise.resolve({ conversationId: CONV_ID }) }
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.text).toBe("Test message");
  });
});
