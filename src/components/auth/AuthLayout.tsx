"use client";

import React, { useEffect, useState } from "react";
import { brandingStyle, storefrontBackgroundStyle } from "@/lib/owner-branding";
import { usePublicInstituteBranding, isBranded } from "@/lib/use-portal-branding";
import { pinTenantFromLocation } from "@/lib/tenant-client";
import DynamicFavicon from "@/components/DynamicFavicon";

// A warm, neutral sign-in shell shared by the student, staff and owner auth
// screens. Deliberately un-techy: a clean surface card sitting over the site's
// soft ambient glow (tinted to the institute when branded), the institute's own
// logo, a soft brand-tinted primary action — no dark glass, no gradient/display
// headings. It still white-labels via brandingStyle() (institute
// primary/secondary/font as CSS variables) and shows the institute logo when set,
// so each institute keeps its identity without the "developer console" look.
//
// Structural notes (why a <div>, not a <main>, and how the background works):
//   - The root AppChrome already renders a single <main> around every page and
//     wraps it in `.site-shell` (the site's soft ambient "pill" glow). This
//     component is therefore a plain <div> (never nest a second <main>) and does
//     NOT paint an opaque background — so that ambient glow shows through behind
//     the card instead of a flat black canvas. A branded institute gets its own
//     tinted glow via storefrontBackgroundStyle() (opaque, so it replaces the
//     default), matching the staff/student/owner portal shells.
//   - Owner login renders chrome-free (OwnerLayoutClient returns bare children on
//     public paths); every staff auth screen is rendered bare too (StaffLayoutClient
//     short-circuits the sidebar shell for its public paths); student auth sits
//     under the pass-through /lms layout. So this shell owns the whole screen
//     everywhere, giving one consistent experience.

// Neutral input styling shared by every field on the auth screens: a calm inset
// field (page-bg inside the surface card) with a soft brand-tinted focus ring.
export const authInputClass =
  "w-full rounded-xl border border-site-border bg-site-bg px-4 py-2.5 text-sm text-site-text placeholder:text-site-muted/70 outline-none transition focus:border-site-primary focus:ring-2 focus:ring-site-primary/25";

type AuthFieldProps = { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>;

// A labelled text/email input.
export function AuthField({ label, hint, className, ...props }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-site-text/80">{label}</span>
      <input {...props} className={`${authInputClass} ${className ?? ""}`.trim()} />
      {hint ? <p className="mt-1.5 text-xs text-site-muted">{hint}</p> : null}
    </label>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M3 3l18 18" /> : null}
    </svg>
  );
}

// A labelled password input with an inline show/hide toggle (self-contained).
export function AuthPasswordField({ label, hint, className, ...props }: AuthFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-site-text/80">{label}</span>
      <div className="relative">
        <input {...props} type={show ? "text" : "password"} className={`${authInputClass} pr-11 ${className ?? ""}`.trim()} />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-3 flex items-center text-site-muted transition hover:text-site-text"
        >
          <EyeIcon off={show} />
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-site-muted">{hint}</p> : null}
    </label>
  );
}

// The full-width primary submit button — soft brand primary with a spinner while
// the request is in flight.
export function AuthSubmitButton({
  loading,
  children,
  disabled,
  ...props
}: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      {...props}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}

// A message strip (error / warning / success). Colors are inline hex so they read
// correctly in both light and dark themes without depending on token overrides.
export function AuthMessage({
  tone = "error",
  children,
}: {
  tone?: "error" | "warn" | "success";
  children: React.ReactNode;
}) {
  const color = tone === "success" ? "#059669" : tone === "warn" ? "#d97706" : "#dc2626";
  const bg = tone === "success" ? "rgba(5,150,105,0.10)" : tone === "warn" ? "rgba(217,119,6,0.10)" : "rgba(220,38,38,0.10)";
  return (
    <div className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ color, backgroundColor: bg, borderColor: `${color}40` }}>
      {children}
    </div>
  );
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const branding = usePublicInstituteBranding();

  // Pin the institute from an emailed link's ?tenant= so a reset/invite → login
  // journey stays on the right portal instead of defaulting to the primary slug.
  useEffect(() => {
    pinTenantFromLocation();
  }, []);

  // Surface the "signed out due to inactivity" hint (?timeout=1, set by
  // <IdleLogout />) here so every login screen shows it in the theme-correct
  // style, replacing the old amber-on-dark banner that vanished in light mode.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setTimedOut(new URLSearchParams(window.location.search).get("timeout") === "1");
  }, []);

  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-6 px-4 py-10"
      style={{ ...brandingStyle(branding), ...storefrontBackgroundStyle(branding) }}
      data-branded={isBranded(branding) ? "" : undefined}
    >
      <DynamicFavicon href={branding?.logo_url ?? null} />

      <div className="w-full max-w-md">
        {/* Institute logo (or a neutral education mark when none is set). */}
        <div className="mb-6 flex justify-center">
          {branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo_url}
              alt=""
              className="h-16 w-16 rounded-full bg-site-surface object-contain p-1.5 ring-1 ring-site-border"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-site-surface text-site-muted ring-1 ring-site-border">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 10L12 5 2 10l10 5 10-5z" />
                <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
              </svg>
            </div>
          )}
        </div>

        {/* The card. */}
        <div className="rounded-2xl border border-site-border bg-site-surface p-7 shadow-sm sm:p-8">
          {timedOut ? (
            <AuthMessage tone="warn">You were signed out due to inactivity. Please sign in again.</AuthMessage>
          ) : null}

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-site-text">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-site-muted">{subtitle}</p> : null}
          </div>

          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-site-muted">{footer}</div> : null}
      </div>
    </div>
  );
}
