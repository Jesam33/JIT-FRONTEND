"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UPGRADE_REQUIRED_EVENT, type UpgradeInfo } from "@/lib/owner-client";

// A single global modal that any owner page can raise by dispatching the
// `owner-upgrade-required` window event (see maybeUpgrade() in owner-client.ts).
// Mounted once in OwnerLayoutClient so every gated action — a 4th course on Free,
// an extra staff seat, a paid-only feature — surfaces the same calm upgrade
// prompt instead of a raw error or (the old bug) a surprise logout.

// Per-cap headline. Falls back to a generic title for anything unmapped.
const FEATURE_TITLES: Record<string, string> = {
  courses: "You've reached your course limit",
  staff: "You've reached your team limit",
  students: "You've reached your student limit",
  chat: "Messaging is a paid feature",
  live_classes: "Live classes are a paid feature",
};

export default function UpgradeModal() {
  const router = useRouter();
  const [info, setInfo] = useState<UpgradeInfo | null>(null);

  // Listen for upgrade prompts raised anywhere in the owner portal.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as UpgradeInfo | undefined;
      setInfo(detail ?? { message: "You've reached your plan's limit. Upgrade to continue." });
    };
    window.addEventListener(UPGRADE_REQUIRED_EVENT, handler);
    return () => window.removeEventListener(UPGRADE_REQUIRED_EVENT, handler);
  }, []);

  // Escape to dismiss + lock body scroll while open, so the prompt feels like a
  // proper modal rather than a floating card over a scrollable page.
  useEffect(() => {
    if (!info) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfo(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [info]);

  if (!info) return null;

  const title = (info.feature && FEATURE_TITLES[info.feature]) || "Upgrade to keep going";

  const goToBilling = () => {
    setInfo(null);
    router.push("/lms/admin/billing");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      {/* Backdrop — click to dismiss. */}
      <button
        type="button"
        aria-label="Close"
        onClick={() => setInfo(null)}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-site-border bg-site-surface text-site-text shadow-2xl">
        {/* Brand accent bar (uses the institute's primary color). */}
        <div className="h-1.5 w-full" style={{ background: "var(--color-primary, #6366f1)" }} />

        <div className="p-6 sm:p-7">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-site-bg"
            style={{ color: "var(--color-primary, #6366f1)" }}
          >
            {/* Spark / upgrade mark */}
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2 4.5 12.5H11l-1 8L19.5 10H13z" />
            </svg>
          </div>

          <h2 id="upgrade-modal-title" className="text-lg font-semibold text-site-text">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-site-muted">{info.message}</p>

          {info.plan ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-site-border bg-site-bg px-3 py-1 text-xs text-site-muted">
              Current plan:
              <span className="font-semibold text-site-text">{info.plan}</span>
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setInfo(null)}
              className="rounded-xl border border-site-border px-4 py-2.5 text-sm font-medium text-site-text transition hover:bg-site-bg"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={goToBilling}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ background: "var(--color-primary, #6366f1)" }}
            >
              See plans &amp; upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
