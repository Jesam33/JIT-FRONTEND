import Pusher from "pusher-js";
import { api } from "./api";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "";

let pusherInstance: Pusher | null = null;

/**
 * True when a Pusher/Reverb key is configured at build time. When false the
 * chat pages skip the (doomed) WebSocket entirely and rely on interval polling,
 * so real-time chat works out-of-the-box with zero infra and upgrades to instant
 * push the moment NEXT_PUBLIC_PUSHER_KEY (+ a broadcaster) is set.
 */
export function isRealtimeConfigured(): boolean {
  return PUSHER_KEY.length > 0;
}

/**
 * Returns the shared Pusher connection, or null when broadcasting isn't
 * configured. Callers must null-check and fall back to polling.
 */
export function getPusher(token: string): Pusher | null {
  if (!PUSHER_KEY) return null;
  if (pusherInstance) return pusherInstance;

  pusherInstance = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    forceTLS: true,
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    channelAuthorization: {
      transport: "ajax",
      // Absolute (via api()) so the presence-channel auth POST reaches the
      // Laravel backend even when the frontend is served from another origin.
      endpoint: api("/api/frontend/lms/broadcasting/auth"),
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

/**
 * Whether the live socket is currently connected. The polling fallback checks
 * this so it stays inert while push delivery is active.
 */
export function isPusherConnected(): boolean {
  return pusherInstance?.connection?.state === "connected";
}
