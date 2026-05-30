/**
 * src/lib/pusher.ts
 *
 * Server-side Pusher client singleton.
 *
 * Safe initialisation contract:
 *   - If any required environment variable is absent, `pusher` is exported as
 *     `null` and a warning is logged at module load time.
 *   - All call sites that use `pusher` must guard with `pusher?.trigger(...)`,
 *     so the absence of credentials degrades gracefully (no real-time delivery)
 *     without crashing the build or API routes.
 *   - This module must NEVER be imported from Edge Runtime files — the Pusher
 *     Node.js SDK uses `http`/`https` which are unavailable in the Edge.
 *     Use it only in Node.js runtime route handlers (src/app/api/**).
 */

import Pusher from "pusher";

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

let pusher: Pusher | null = null;

if (missingVars.length > 0) {
  // Log once at startup. Missing vars in local dev are expected until
  // the developer populates .env.local; this should not block the build.
  console.warn(
    `[Pusher] Server client NOT initialised. Missing environment variables: ${
      missingVars.join(", ")
    }. Real-time notifications will be skipped until these are set.`
  );
} else {
  pusher = new Pusher({
    appId: PUSHER_APP_ID!,
    key: NEXT_PUBLIC_PUSHER_KEY!,
    secret: PUSHER_SECRET!,
    cluster: NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true, // All traffic encrypted in transit — non-negotiable
  });
}

export { pusher };
