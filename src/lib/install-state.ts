// Whether this browser can install the academy's app right now, shared by
// every install surface (the post-login banner and the sidebar's "Install
// app" button) so they agree and use the browser's one-time install prompt.
//
// Chrome / Edge (desktop and Android) fire `beforeinstallprompt` once the page
// is installable; we keep that event and replay it on a click. It can only be
// prompted once, so it's held here, not in a component that might unmount.
// Safari never fires it: iPhone/iPad installs by Share → Add to Home Screen,
// Mac Safari by File → Add to Dock, so those get instructions instead.

import { useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = { canPrompt: boolean; installed: boolean };

let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = { canPrompt: false, installed: false };
const SERVER_STATE: InstallState = { canPrompt: false, installed: false };
const listeners = new Set<() => void>();

function set(next: Partial<InstallState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // our own button/banner offers it instead
    deferred = event as BeforeInstallPromptEvent;
    set({ canPrompt: true });
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    set({ canPrompt: false, installed: true });
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Live install state for components. */
export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** Open the browser's install dialog. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const event = deferred;
  if (!event) return "unavailable";
  deferred = null; // a prompt can only be used once
  set({ canPrompt: false });
  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") set({ installed: true });
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}

/** Already running as the installed app (its own window / home-screen app). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** Which manual route this browser needs, when there's no install prompt. */
export function manualInstallKind(): "ios" | "mac-safari" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // Safari on a Mac (not Chrome/Edge/Firefox, which also say "Safari").
  if (/macintosh/i.test(ua) && /safari/i.test(ua) && !/chrome|chromium|crios|edg|firefox|fxios/i.test(ua)) return "mac-safari";
  return null;
}

/** A phone or tablet rather than a computer (for "desktop app" wording). */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}
