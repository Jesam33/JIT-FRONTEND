import Pusher from "pusher-js";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "";

let pusherInstance: Pusher | null = null;

export function getPusher(token: string): Pusher {
  if (pusherInstance) return pusherInstance;

  pusherInstance = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    forceTLS: true,
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    channelAuthorization: {
      transport: "ajax",
      endpoint: "/api/frontend/lms/broadcasting/auth",
      headersProvider: () => ({
        Authorization: `Bearer ${token}`,
      }),
    },
  });

  return pusherInstance;
}

export function disconnectPusher(): void {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
