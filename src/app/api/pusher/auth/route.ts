import { validateCsrfRequest } from "@/lib/csrf";
/**
 * src/app/api/pusher/auth/route.ts
 *
 * Pusher private-channel authentication endpoint.
 *
 * Security model:
 *   Pusher private channels require a server-side handshake before a client
 *   can subscribe. The browser sends the socket_id (assigned by Pusher at
 *   connect time) and the requested channel_name to this endpoint. We verify
 *   the user's session, then enforce the invariant:
 *
 *     The requesting user may ONLY subscribe to their own channel.
 *     channel_name MUST equal "private-user-{session.user.id}".
 *
 *   If those conditions are met, pusher.authorizeChannel() signs the payload
 *   with PUSHER_SECRET and returns the auth token to the client. Pusher's
 *   infrastructure then allows the WebSocket subscription.
 *
 *   Any mismatch between the claimed channel and the real user ID returns 403,
 *   preventing a logged-in user from subscribing to another user's channel.
 *
 * NOTE: This route must run in the Node.js runtime (not Edge), because the
 * server-side Pusher SDK uses Node.js http/crypto internals.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/session-guards";
import { pusher } from "@/lib/pusher";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { logErrorToSentry } from "@/lib/error-handler";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const active = await requireActiveUser();
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.pusherAuth, session.user.id),
      "PusherAuth"
    );
    if (rateLimitResponse) return rateLimitResponse;

    // 2. Pusher is optional (may be null if env vars are missing).
    if (!pusher) {
      return NextResponse.json(
        { error: "Real-time service not configured" },
        { status: 503 }
      );
    }

    // 3. Parse the form-encoded body Pusher-js sends.
    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    // 4. Enforce channel ownership.
    // A user may only subscribe to their own private channel.
    // This prevents User A from subscribing to private-user-{userB_id}.
    const expectedChannel = `private-user-${session.user.id}`;
    if (channelName !== expectedChannel) {
      return NextResponse.json(
        { error: "Forbidden: channel ownership mismatch" },
        { status: 403 }
      );
    }

    // 5. Generate the Pusher auth token and return it.
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/pusher/auth]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
