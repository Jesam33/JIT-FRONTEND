"use client";

import { useEffect, useState } from "react";
import { getTenantSlug } from "@/lib/tenant-client";
import { applyAcademyInstallIdentity } from "@/lib/install-app";

// "Install the app" prompt shown INSIDE the logged-in student/staff portals
// (never on login or marketing pages — the user installs after signing in, so
// the installed app opens straight into their LMS). Renders nothing until:
//   - Android / desktop Chrome: the browser fired beforeinstallprompt (we
//     captured it), or
//   - iOS: always, because Safari never fires it (see below).
// A dismissal is remembered for a week, and the prompt never appears when the
// page is already running as the installed app (display-mode: standalone).
//
// THE iOS WORKAROUND: Apple does not allow any website to trigger its own
// install dialog on iPhone/iPad. The only path is the user manually tapping
// Share, then "Add to Home Screen". So on iOS the same slot shows a short
// step-by-step instruction sheet instead of an Install button, and the
// identity swap in lib/install-app.ts (per-academy manifest + apple-touch-icon
// + apple title) makes that manual add produce the ACADEMY's app: its logo,
// its name, opening its portal.

// One week: a "Not now" shouldn't nag on every login, but shouldn't be forever.
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function IosShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block align-[-2px]">
      <path d="M12 3v11" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}

export default function AppInstallPrompt({
  role,
  name,
  logoUrl,
}: {
  role: "student" | "staff";
  name?: string | null;
  logoUrl?: string | null;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const academyName = name?.trim() || (slug ? slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "the academy");

  useEffect(() => {
    // Running as the installed app already: never prompt.
    if (isStandalone()) return;

    const resolved = getTenantSlug();
    if (!resolved) return;
    setSlug(resolved);

    // Always point the page's install identity at this academy, even when the
    // banner itself is suppressed: a user installing from the browser menu
    // should still get the academy's app.
    applyAcademyInstallIdentity(resolved, role, { name, logoUrl });

    // The portal layouts server-render the manifest link from the tenant
    // cookie, but that cookie can be stale at first load (the guard re-pins it
    // from the authenticated session a moment later). When it is (re)pinned,
    // re-apply the identity so an install never points at the wrong academy.
    const onPinned = (event: Event) => {
      const fresh = (event as CustomEvent<{ slug?: string }>).detail?.slug || getTenantSlug();
      if (!fresh) return;
      setSlug(fresh);
      applyAcademyInstallIdentity(fresh, role, { name, logoUrl });
    };
    document.addEventListener("lms-tenant-pinned", onPinned);

    // Respect a recent "Not now".
    const key = `lms_install_dismissed:${resolved}:${role}`;
    try {
      const dismissedAt = Number(localStorage.getItem(key) ?? 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;
    } catch {
      /* private mode etc.: just show it */
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      try {
        localStorage.setItem(key, String(Date.now()));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIosSafari()) {
      setIos(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      document.removeEventListener("lms-tenant-pinned", onPinned);
    };
  }, [role, name, logoUrl]);

  if (!visible || (!deferred && !ios)) return null;

  const storageKey = slug ? `lms_install_dismissed:${slug}:${role}` : "";
  const dismiss = () => {
    setVisible(false);
    try {
      if (storageKey) localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "dismissed") {
        // The user said no on the native sheet: treat it like "Not now".
        dismiss();
      } else {
        setVisible(false);
      }
    } catch {
      /* the native sheet failed to open: keep the banner for a retry */
    } finally {
      setDeferred(null);
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(94vw,26rem)] -translate-x-1/2">
      <div className="rounded-2xl border border-white/15 bg-black/85 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
              {academyName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Install {academyName}</p>
            <p className="mt-0.5 text-xs text-white/60">
              Add it to your home screen and open it in one tap, full screen.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Not now"
            className="ml-auto shrink-0 rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {ios ? (
          <ol className="mt-3 space-y-1.5 rounded-xl bg-white/5 p-3 text-xs text-white/75">
            <li>
              <span className="font-semibold text-white">1.</span> In Safari, tap the <IosShareIcon /> Share button.
            </li>
            <li>
              <span className="font-semibold text-white">2.</span> Scroll down and tap <span className="font-semibold text-white">Add to Home Screen</span>.
            </li>
            <li>
              <span className="font-semibold text-white">3.</span> Tap <span className="font-semibold text-white">Add</span>.
            </li>
          </ol>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={install}
              disabled={busy || !deferred}
              className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:brightness-90 disabled:opacity-50"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Opening...
                </span>
              ) : (
                "Install app"
              )}
            </button>
            <button type="button" onClick={dismiss} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10">
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
