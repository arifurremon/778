import { getCsrfToken } from "next-auth/react";
import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") return null;
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
    return null;
  }

  if (!pusherClient) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      channelAuthorization: {
        transport: "ajax",
        endpoint: "/api/pusher/auth",
        headersProvider: async () => {
          const csrfToken = await getCsrfToken();
          return csrfToken ? { "x-csrf-token": csrfToken } : {};
        },
      },
    });
  }

  return pusherClient;
}
