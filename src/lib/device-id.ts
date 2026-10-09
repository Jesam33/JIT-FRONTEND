// A random, permanent id for THIS browser, sent as `X-Device-Id` so login
// alerts recognise the device itself rather than its network: on mobile data the
// IP changes constantly, and an IP-based check kept flagging people's own phones
// as "new". Backend: App\Support\LoginDeviceTracker.
//
// Not a secret and grants nothing on its own: it only lets the server tell "a
// browser this account has used before" from "one it hasn't". Clearing site data
// or a private window gets a new id, which correctly reads as a new device.

const KEY = "lms_device_id";

let memo: string | null = null;

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().replace(/-/g, "");
    }
  } catch {
    // fall through
  }
  let id = "";
  for (let i = 0; i < 32; i++) id += Math.floor(Math.random() * 16).toString(16);
  return id;
}

/** This browser's device id, created on first use. Null on the server. */
export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  if (memo) return memo;
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && /^[A-Za-z0-9_-]{16,64}$/.test(stored)) {
      memo = stored;
      return memo;
    }
    const fresh = randomId();
    localStorage.setItem(KEY, fresh);
    memo = fresh;
    return memo;
  } catch {
    // Storage blocked (private mode on some browsers): an id for this page
    // load only, so the request is still recognisable within the visit.
    memo = memo ?? randomId();
    return memo;
  }
}

/** `{ "X-Device-Id": id }`, or nothing on the server. Spread into fetch headers. */
export function deviceHeaders(): Record<string, string> {
  const id = getDeviceId();
  return id ? { "X-Device-Id": id } : {};
}
