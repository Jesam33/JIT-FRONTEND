"use client";

import { useCallback, useEffect, useState } from "react";
import { QA_API } from "@/lib/api";
import QaSignupForm from "./QaSignupForm";
import { qaBrandName, qaPrettyDate, type QaEventInfo, type QaSlotInfo } from "./types";

// The tester signup, as a popup on the marketing site.
//
// This is the entry point the iungo testers actually use: they land on
// jorsastech.com and are asked there and then, rather than being sent a link to
// a page they have to be told about. The standalone page at /qa/{event} still
// exists and still works, and this links to it for anyone who wants more room.
//
// Whether it appears at all is the SERVER's answer, not a build flag: it asks
// /api/frontend/qa/active, which returns null unless an event is switched on and
// inside its window. So the popup switches itself off at the end of the testing
// day, and no deploy is needed to take it down.

/** How long after landing before the popup appears. */
const SHOW_AFTER_MS = 1500;

/**
 * Paths where the visitor is buying or enrolling.
 *
 * The popup stands down on these. Someone comparing plans or part-way through
 * signup is the one visitor whose attention is worth more than a beta-tester
 * signup, and interrupting a purchase with an unrelated invitation is the single
 * place this costs more than it gains. Matched on the segment, so /plans and
 * /plans/anything both count.
 */
const PURCHASE_PATHS = ["/plans", "/pricing", "/signup", "/onboarding", "/training", "/institute"];

function onPurchasePath(pathname: string): boolean {
  return PURCHASE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type Phase = "idle" | "form" | "done";

export default function QaPopup() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [event, setEvent] = useState<QaEventInfo | null>(null);
  const [slots, setSlots] = useState<QaSlotInfo[]>([]);
  const [email, setEmail] = useState("");

  /**
   * Re-read the live event. Called on mount and again when a submit reports the
   * picked session was taken, so the picker is showing something real.
   */
  const load = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(QA_API.active);
      if (!res.ok) return false;

      const data = await res.json().catch(() => ({}));
      const found = (data?.event ?? null) as QaEventInfo | null;
      const open = ((data?.slots ?? []) as QaSlotInfo[]).filter((s) => s.is_open);

      if (!found) return false;

      // Recorded before the checks below, not after, so a refresh from inside the
      // open popup is honest about what is left: if the last session filled up
      // while the visitor was typing, the picker has to say so rather than keep
      // offering a session that is gone.
      setEvent(found);
      setSlots(open);

      // An event with every session full is not worth interrupting anyone for:
      // the form would open on a dead end and the visitor would just close it.
      if (open.length === 0) return false;
      if (dismissed(found.slug)) return false;

      return true;
    } catch {
      // A visitor who cannot reach the API gets the marketing site, uninterrupted.
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Read once, at mount, from the browser rather than from usePathname(): this
    // is a question about where the visitor LANDED, not about where they are now.
    // The chrome does not remount on a client-side navigation, so the decision is
    // taken once per page load and the popup cannot surface mid-session.
    if (onPurchasePath(window.location.pathname)) return;

    // The delay is deliberately not zero: the page should paint and settle first,
    // so the popup reads as an invitation rather than as a page that failed to
    // load. It is one number, change it here.
    const timer = window.setTimeout(() => {
      void load().then((show) => {
        if (show && !cancelled) setPhase("form");
      });
    }, SHOW_AFTER_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  /**
   * Close, and do not ask again on this device.
   *
   * Only ever reached from a deliberate action: the X, or Close after signing up.
   */
  const dismiss = useCallback(() => {
    setPhase("idle");
    if (event) rememberDismissed(event.slug);
  }, [event]);

  /**
   * Close for now, but keep the invitation for next time.
   *
   * What a background click and Esc get. On a phone the backdrop fills most of
   * the screen and a scroll that ends outside the card reads as a click, so
   * treating that as "dismissed forever" would let one stray thumb remove the
   * signup for everyone who uses it. Clicking away means not now, not never.
   */
  const hide = useCallback(() => setPhase("idle"), []);

  // Esc closes for now (see hide), and the page behind stops scrolling while the
  // modal is up.
  useEffect(() => {
    if (phase === "idle") return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") hide();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, hide]);

  if (phase === "idle" || !event) return null;

  const brand = qaBrandName(event);
  const when = qaPrettyDate(event.starts_at);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${event.name} signup`}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-6 sm:items-center sm:py-10"
      onClick={hide}
    >
      <div
        // The card is capped and scrolls internally so the form is usable on a
        // phone, where the virtual keyboard would otherwise push the submit
        // button off screen with no way to reach it.
        className="relative w-full max-w-lg rounded-2xl border border-site-border bg-site-surface p-5 text-site-text shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-site-muted transition hover:bg-site-bg hover:text-site-text"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex flex-wrap items-center gap-2 pr-8">
          <span className="text-base font-semibold tracking-tight">{brand}</span>
          <span className="text-xs text-site-muted">x</span>
          <span className="text-base font-semibold tracking-tight">Jorsas Tech</span>
        </div>

        {phase === "done" ? (
          <div className="mt-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-site-primary/15 text-2xl text-site-primary">✓</div>
            <h2 className="mt-4 text-xl font-semibold">You are on the list</h2>
            <p className="mt-3 text-sm text-site-muted">
              We sent your join link to <span className="font-medium text-site-text">{email}</span>. Open it at your session time and you
              will go straight into the room, no password needed.
            </p>
            <p className="mt-3 text-sm text-site-muted">
              Nothing in your inbox after a few minutes? Check spam first, then sign up again with the same email and we will send a fresh
              link.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-5 w-full rounded-full border border-site-border px-6 py-3 text-sm font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <h2 className="text-xl font-semibold leading-tight">{event.name}</h2>
            {when ? <p className="mt-1.5 text-sm text-site-muted">{when}</p> : null}
            <p className="mt-3 text-sm leading-relaxed text-site-muted">
              {event.blurb?.trim() ||
                `${brand} is testing its app with real people before launch, and the session runs over video. Pick a time below and we will email you the link.`}
            </p>

            <div className="mt-5">
              <QaSignupForm
                slug={event.slug}
                slots={slots}
                onDone={(submitted) => {
                  setEmail(submitted);
                  setPhase("done");
                  // Registered here, so never ask again on this device. The link is
                  // already in their inbox; a second popup is only in the way.
                  rememberDismissed(event.slug);
                }}
                onReload={load}
                // The event shut between load and submit. That is not the visitor
                // choosing to leave, so it closes the popup without recording a
                // dismissal.
                onClosed={hide}
              />
            </div>

            <p className="mt-4 text-center text-xs text-site-muted">
              <a href={`/qa/${event.slug}`} className="underline">
                Open this as a full page
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Dismissal is remembered per event, in this browser only. It is a convenience,
// never state we depend on: a visitor with storage blocked simply sees the popup
// again next time, which is the harmless direction to fail in. Every access is
// wrapped because localStorage throws rather than returns null in a private
// window and in some embedded browsers.

function dismissed(slug: string): boolean {
  try {
    return window.localStorage.getItem(`qa-popup-dismissed:${slug}`) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed(slug: string): void {
  try {
    window.localStorage.setItem(`qa-popup-dismissed:${slug}`, "1");
  } catch {
    /* not worth surfacing: the popup showing again is a minor annoyance */
  }
}
