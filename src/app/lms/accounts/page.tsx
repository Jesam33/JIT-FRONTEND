"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  savedAccounts,
  removeSavedAccount,
  loginPathForAccount,
  isPickerEnabled,
  setPickerEnabled,
  type SavedAccount,
} from "@/lib/saved-accounts";
import { pinTenantFromLocation, getTenantSlug, tenantStorefrontUrl } from "@/lib/tenant-client";
import { usePublicInstituteBranding } from "@/lib/use-portal-branding";
import { brandingStyle } from "@/lib/owner-branding";
import DynamicFavicon from "@/components/DynamicFavicon";

// The logged-out account picker, styled after Chrome's profile-selection
// screen: logo + "Welcome back" heading, a row of circular profile cards (one
// per account that has signed in on this browser), each with a ⋮ menu, an
// "Add account" card, playful scattered shapes behind everything, a
// browse-without-signing-in option bottom-left, and a "show after logging out"
// checkbox bottom-right that actually controls where logout lands. Passwords
// are never stored anywhere — only who the person is (see lib/saved-accounts).

const portalLabel: Record<SavedAccount["portal"], string> = {
  student: "Student",
  staff: "Staff",
  agent: "Marketer",
};

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

// Google-onboarding-style confetti: scattered abstract shapes (squares,
// circles, a triangle, a paperclip squiggle) in blue/green/orange/gray, kept
// translucent so they read as decoration on light AND dark themes and never
// sit over the cards (pointer-events-none, z-0 behind the content layer).
function BackgroundShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <span className="absolute left-[7%] top-[16%] h-10 w-10 rounded-full bg-[#4285F4]/25" />
      <span className="absolute left-[16%] top-[68%] h-3 w-3 rounded-full bg-[#FBBC04]/40" />
      <span className="absolute right-[9%] top-[20%] h-14 w-14 rotate-12 rounded-lg bg-[#34A853]/20" />
      <span className="absolute right-[18%] bottom-[26%] h-4 w-4 rotate-45 bg-[#4285F4]/30" />
      <svg className="absolute left-[12%] bottom-[18%] h-16 w-16 text-[#FBBC04]/30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3l9 16H3z" />
      </svg>
      <svg className="absolute right-[12%] top-[58%] h-20 w-20 text-[#9AA0A6]/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M8 3v10a4 4 0 0 0 8 0V6a3 3 0 0 0-6 0v8a6 6 0 0 0 12 0v-3" />
      </svg>
      <span className="absolute left-[30%] top-[10%] h-2.5 w-2.5 rounded-full bg-[#34A853]/35" />
      <span className="absolute right-[32%] top-[9%] h-6 w-6 rounded-md bg-[#9AA0A6]/20" />
      <span className="absolute left-[24%] bottom-[10%] h-2 w-2 rounded-full bg-[#4285F4]/35" />
    </div>
  );
}

function AccountCard({
  account,
  onPick,
  onRemove,
}: {
  account: SavedAccount;
  onPick: () => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onPick}
        className="group flex w-40 flex-col items-center gap-3 rounded-2xl border border-transparent px-4 py-6 transition hover:border-site-border hover:bg-site-surface hover:shadow-md"
      >
        {account.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={account.avatarUrl}
            alt=""
            className="h-[72px] w-[72px] rounded-full object-cover ring-2 ring-transparent transition group-hover:ring-site-primary/40"
          />
        ) : (
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-site-surface text-xl font-semibold text-site-text ring-1 ring-site-border transition group-hover:ring-site-primary/40">
            {initialsOf(account.name)}
          </span>
        )}
        <span className="w-full truncate text-center text-sm font-semibold text-site-text">{account.name}</span>
        <span className="w-full truncate text-center text-xs text-site-muted">
          {portalLabel[account.portal]}{account.tenantName ? ` · ${account.tenantName}` : ""}
        </span>
      </button>

      {/* ⋮ menu (Chrome-style): remove this account from the browser. */}
      <button
        type="button"
        aria-label={`Options for ${account.name}`}
        onClick={() => setMenuOpen((v) => !v)}
        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-site-muted transition hover:bg-site-surface hover:text-site-text"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
      </button>
      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-2 top-11 z-50 w-48 overflow-hidden rounded-xl border border-site-border bg-site-surface py-1 shadow-lg">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onRemove(); }}
              className="w-full px-3.5 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-500/10"
            >
              Remove from this device
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [ready, setReady] = useState(false);
  const [showOnLogout, setShowOnLogout] = useState(true);
  // Guest link depends on the tenant COOKIE, which only exists in the browser:
  // computing it during render makes the server HTML (/i/<primary>) mismatch
  // the client (/i/<pinned>) — the classic hydration diff. Resolve it on mount.
  const [guestHref, setGuestHref] = useState<string | null>(null);
  // The institute's white-label branding (logo + plan's "Powered by" gate),
  // resolved from the pinned tenant. Null until it loads; the logo block
  // renders a neutral mark meanwhile so no wrong logo ever flashes.
  const branding = usePublicInstituteBranding();

  // localStorage is client-only; load after mount so SSR/first paint matches.
  useEffect(() => {
    // An emailed ?tenant= link still pins the institute from this screen.
    pinTenantFromLocation();
    setAccounts(savedAccounts());
    setShowOnLogout(isPickerEnabled());
    setGuestHref(tenantStorefrontUrl(getTenantSlug()));
    setReady(true);
  }, []);

  // Swap the browser tab's title to the academy's name. This screen sits
  // outside every portal shell, so without this the inherited root "Jorsas
  // Tech" stays in the tab on a customised academy's picker. Gated on the
  // backend's authoritative is_primary flag (NOT the tenant cookie, which can
  // be stale), same as AuthLayout/StudentLayoutClient/StaffLayoutClient.
  useEffect(() => {
    const name = branding?.name?.trim();
    if (name && branding && branding.is_primary === false) {
      document.title = name;
    }
  }, [branding]);

  function pick(account: SavedAccount) {
    router.push(loginPathForAccount(account));
  }

  function remove(id: string) {
    removeSavedAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col bg-site-bg"
      style={brandingStyle(branding)}
    >
      <BackgroundShapes />

      <DynamicFavicon
        href={branding?.logo_url ?? null}
        fallbackColor={branding?.primary_color ?? null}
        isPrimary={branding?.is_primary ?? null}
        markText={branding?.name ?? null}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-14">
        {/* Logo: the ACADEMY's logo (this screen belongs to the institute, not
            the platform). Only the primary/Jorsas tenant shows the Jorsas
            wordmark; an academy with no logo gets the neutral education mark
            (same fallback as the auth screens), never the Jorsas logo. While
            branding is still loading the neutral mark shows, so nothing wrong
            ever flashes in. */}
        {branding?.is_primary ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/jorsas-logo-white.png" alt="Jorsas Tech" className="h-9 w-auto [html.light_&]:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/jorsas-logo-light-mode.png" alt="Jorsas Tech" className="hidden h-9 w-auto [html.light_&]:block" />
          </>
        ) : branding?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logo_url}
            alt={branding.name ?? "Academy"}
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
        <h1 className="mt-7 text-center text-3xl font-semibold text-site-text" style={{ fontFamily: "var(--font-display)" }}>
          Welcome back
        </h1>
        <p className="mt-2.5 max-w-md text-center text-sm leading-6 text-site-muted">
          Pick an account to continue. Each account keeps its own courses, classes, chats and progress separate.
        </p>

        {/* The cards */}
        {ready && accounts.length === 0 ? (
          <p className="mt-10 rounded-xl border border-site-border bg-site-surface/70 px-5 py-3.5 text-center text-sm text-site-muted">
            No saved accounts on this device yet.
          </p>
        ) : (
          <div className="mt-10 flex flex-wrap items-start justify-center gap-3 sm:gap-4">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onPick={() => pick(account)}
                onRemove={() => remove(account.id)}
              />
            ))}

            {/* Add account: a fresh sign-in (starts on the student login; the
                links below cover staff / admission marketer). */}
            <Link
              href="/lms/login"
              className="flex w-40 flex-col items-center gap-3 rounded-2xl border border-transparent px-4 py-6 transition hover:border-site-border hover:bg-site-surface hover:shadow-md"
            >
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-dashed border-site-border text-site-muted">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="text-sm font-semibold text-site-text">Add account</span>
            </Link>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-site-muted">
          Signing in as staff?{" "}
          <Link href="/lms/staff/login" className="font-semibold text-site-text/80 underline underline-offset-4 transition hover:text-site-text">
            Staff sign in
          </Link>
          {" · "}
          <Link href="/lms/agent/login" className="font-semibold text-site-text/80 underline underline-offset-4 transition hover:text-site-text">
            Marketer sign in
          </Link>
        </p>
      </div>

      {/* Bottom bar: browse-without-signing-in (left) + show-after-logout (right) */}
      <div className="relative z-10 flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        {/* "Guest mode" equivalent: browse this institute's public course
            catalogue without signing in. guestHref resolves on mount (cookie). */}
        {guestHref ? (
          <a
            href={guestHref}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-site-border bg-site-surface px-4 py-2 text-sm font-medium text-site-text/85 transition hover:border-site-primary/50 hover:text-site-text"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 0c-4 0-7 2.5-7 6h14c0-3.5-3-6-7-6z" />
            </svg>
            Browse courses
          </a>
        ) : (
          <span className="w-fit" />
        )}

        <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-site-muted">
          <input
            type="checkbox"
            checked={showOnLogout}
            onChange={(e) => {
              setShowOnLogout(e.target.checked);
              setPickerEnabled(e.target.checked);
            }}
            className="h-4 w-4 accent-[color:var(--color-primary)]"
          />
          Show this screen after logging out
        </label>
      </div>

      {/* White-label gate: only academies whose plan does NOT include
          remove_branding (i.e. free) carry the "Powered by Jorsastech"
          credit. Paid plans bought the badge off — same rule as the public
          storefront footer. Rendered only once branding resolves, so a
          white-label academy never flashes the credit in. */}
      {branding?.show_powered_by ? (
        <p className="relative z-10 pb-5 text-center text-xs text-site-muted/70">
          Powered by{" "}
          <a
            href="https://jorsastech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-site-muted transition hover:text-site-text"
          >
            Jorsastech
          </a>
        </p>
      ) : null}
    </div>
  );
}
