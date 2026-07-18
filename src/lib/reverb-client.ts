import Pusher from "pusher-js";

const REVERB_APP_KEY = "b574917226809fed8ceb4eeacac7fbee";
const REVERB_HOST = "127.0.0.1";
const REVERB_PORT = 8080;
const WS_URL = `ws://${REVERB_HOST}:${REVERB_PORT}/app/${REVERB_APP_KEY}`;

let pusherInstance: Pusher | null = null;

export function getPusher(token: string): Pusher {
  if (pusherInstance) return pusherInstance;

  pusherInstance = new Pusher(REVERB_APP_KEY, {
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: false,
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    cluster: "",
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
