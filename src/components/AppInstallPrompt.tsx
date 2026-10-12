"use client";

import { useEffect, useState } from "react";
import { getTenantSlug } from "@/lib/tenant-client";
import { applyAcademyInstallIdentity } from "@/lib/install-app";
import { isMobileDevice, isStandalone, manualInstallKind, promptInstall, useInstallState } from "@/lib/install-state";

// "Install the app" banner shown INSIDE the logged-in student/staff portals
// (never on login or marketing pages — the user installs after signing in, so
// the installed app opens straight into their LMS). Shows when:
//   - Chrome / Edge (desktop or Android): the browser says the app can be
//     installed (lib/install-state holds its one-time install prompt), or
//   - iPhone/iPad or Mac Safari: always, as short instructions, because Safari
//     never offers a web page its own install button.
// A dismissal is remembered for a week; the sidebar's "Install app" row stays
// available meanwhile. Never shown inside the installed app itself.
//
// The identity swap in lib/install-app.ts (per-academy manifest +
// apple-touch-icon + apple title) makes every install route produce the
// ACADEMY's app: its logo, its name, opening its portal.

// One week: a "Not now" shouldn't nag on every login, but shouldn't be forever.
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function IosShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block align-[-2px]">
      <path d="M12 3v11" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}

/** Step-by-step instructions for the browsers with no install prompt. */
export function ManualInstallSteps({ kind }: { kind: "ios" | "mac-safari" }) {
  return kind === "ios" ? (
    <ol className="space-y-1.5 rounded-xl bg-white/5 p-3 text-xs text-white/75">
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
    <ol className="space-y-1.5 rounded-xl bg-white/5 p-3 text-xs text-white/75">
      <li>
        <span className="font-semibold text-white">1.</span> In Safari&apos;s menu bar, click <span className="font-semibold text-white">File</span>.
      </li>
      <li>
        <span className="font-semibold text-white">2.</span> Choose <span className="font-semibold text-white">Add to Dock</span>, then <span className="font-semibold text-white">Add</span>.
      </li>
      <li>
        <span className="font-semibold text-white">3.</span> Open it from your Dock or Launchpad like any app.
      </li>
    </ol>
  );
}

export default function AppInstallPrompt({
  role,
  name,
  logoUrl,
}: {
  role: "student" | "staff" | "agent";
  name?: string | null;
  logoUrl?: string | null;
}) {
  const { canPrompt } = useInstallState();
  const [slug, setSlug] = useState<string | null>(null);
  const [manual, setManual] = useState<"ios" | "mac-safari" | null>(null);
  const [mobile, setMobile] = useState(true);
  const [allowed, setAllowed] = useState(false); // not standalone, not recently dismissed
  const [busy, setBusy] = useState(false);

  const academyName = name?.trim() || (slug ? slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "the academy");

  useEffect(() => {
    // Running as the installed app already: never prompt.
    if (isStandalone()) return;

    const resolved = getTenantSlug();
    if (!resolved) return;

    // Always point the page's install identity at this academy, even when the
    // banner itself is suppressed: a user installing from the browser menu (or
    // the sidebar row) should still get the academy's app.
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

    // Async so the state updates land after the effect (and after a recent "Not now" check).
    (async () => {
      setSlug(resolved);
      setManual(manualInstallKind());
      setMobile(isMobileDevice());
      let recentlyDismissed = false;
      try {
        const dismissedAt = Number(localStorage.getItem(`lms_install_dismissed:${resolved}:${role}`) ?? 0);
        recentlyDismissed = !!dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
      } catch {
        /* private mode etc.: just show it */
      }
      setAllowed(!recentlyDismissed);
    })();

    return () => document.removeEventListener("lms-tenant-pinned", onPinned);
  }, [role, name, logoUrl]);

  if (!allowed || (!canPrompt && !manual)) return null;

  const dismiss = () => {
    setAllowed(false);
    try {
      if (slug) localStorage.setItem(`lms_install_dismissed:${slug}:${role}`, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    setBusy(true);
    const outcome = await promptInstall();
    setBusy(false);
    if (outcome === "dismissed") dismiss(); // said no on the native sheet: treat as "Not now"
    else if (outcome === "accepted") setAllowed(false);
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
              {mobile
                ? "Add it to your home screen and open it in one tap, full screen."
                : "Get it as a desktop app: its own window and icon, one click from your desktop or taskbar."}
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

        {!canPrompt && manual ? (
          <div className="mt-3">
            <ManualInstallSteps kind={manual} />
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={install}
              disabled={busy || !canPrompt}
              className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:brightness-90 disabled:opacity-50"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Opening...
                </span>
              ) : mobile ? (
                "Install app"
              ) : (
                "Install desktop app"
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
