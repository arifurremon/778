/**
 * src/lib/pusher.ts
 *
 * Minimal server-side Pusher REST helper implemented with platform primitives.
 *
 * Why this exists instead of the official `pusher` npm package:
 *   - The repository's lockfile did not contain the newly-added Pusher packages,
 *     which made `npm ci` non-deterministic.
 *   - The deployment environment can block those packages at install time.
 *   - We only need two small operations here: private-channel auth signatures and
 *     best-effort event triggering. Both are documented HMAC/REST operations and
 *     do not require a runtime SDK dependency.
 */

import crypto from "crypto";

const {
  PUSHER_APP_ID,
  NEXT_PUBLIC_PUSHER_KEY,
  PUSHER_SECRET,
  NEXT_PUBLIC_PUSHER_CLUSTER,
} = process.env;

const requiredVars = {
  PUSHER_APP_ID,
  NEXT_PUBLIC_PUSHER_KEY,
  PUSHER_SECRET,
  NEXT_PUBLIC_PUSHER_CLUSTER,
};

const missingVars = Object.entries(requiredVars)
  .filter(([, v]) => !v)
  .map(([k]) => k);

function hmacSha256Hex(value: string): string {
  return crypto
    .createHmac("sha256", PUSHER_SECRET!)
    .update(value)
    .digest("hex");
}

interface PusherRestClient {
  authorizeChannel(socketId: string, channelName: string): { auth: string };
  trigger(channel: string, event: string, data: unknown): Promise<void>;
}

let pusher: PusherRestClient | null = null;

if (missingVars.length > 0) {
  // Log once at startup. Missing vars in local dev are expected until
  // the developer populates .env.local; this should not block the build.
  console.warn(
    `[Pusher] REST helper NOT initialised. Missing environment variables: ${
      missingVars.join(", ")
    }. Real-time notifications will be skipped until these are set.`
  );
} else {
  pusher = {
    authorizeChannel(socketId: string, channelName: string) {
      const signature = hmacSha256Hex(`${socketId}:${channelName}`);
      return { auth: `${NEXT_PUBLIC_PUSHER_KEY}:${signature}` };
    },

    async trigger(channel: string, event: string, data: unknown) {
      const body = JSON.stringify({
        name: event,
        channels: [channel],
        data: JSON.stringify(data),
      });

      const bodyMd5 = crypto.createHash("md5").update(body).digest("hex");
      const path = `/apps/${PUSHER_APP_ID}/events`;
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const params = new URLSearchParams({
        auth_key: NEXT_PUBLIC_PUSHER_KEY!,
        auth_timestamp: timestamp,
        auth_version: "1.0",
        body_md5: bodyMd5,
      });

      const signature = hmacSha256Hex(`POST\n${path}\n${params.toString()}`);
      params.set("auth_signature", signature);

      const response = await fetch(
        `https://api-${NEXT_PUBLIC_PUSHER_CLUSTER}.pusher.com${path}?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      if (!response.ok) {
        throw new Error(`Pusher trigger failed with status ${response.status}`);
      }
    },
  };
}

export { pusher };

export function hasPusherConfigs(): boolean {
  return missingVars.length === 0;
}
