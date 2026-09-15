"use client";

// Google/Netflix-style account memory for the LMS portals. When someone signs
// in on this browser we remember WHO they are (name, email, avatar, portal,
// institute — NEVER the password) so the logged-out account picker at
// /lms/accounts can offer one-tap return sign-ins: tap your card → login page
// with your email pre-filled and the right institute pinned, type only the
// password. Purely client-side, per-browser, per-device; clearing site data
// clears it. Emails are unique per-tenant, so the dedupe key is
// portal + tenant + email, not email alone.

import { STUDENT_API, STAFF_API, AGENT_API } from "./api";

export type SavedPortal = "student" | "staff" | "agent";

export type SavedAccount = {
  id: string;
  portal: SavedPortal;
  email: string;
  name: string;
  avatarUrl: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  savedAt: number;
};

const KEY = "lms_saved_accounts";
const MAX_ACCOUNTS = 5;
const PICKER_KEY = "lms_accounts_picker";

/**
 * Whether logging out should land on the account picker (default true). The
 * picker's own "Show this screen after logging out" checkbox writes this; the
 * sidebar logout handlers read it. Default-on so the picker just works.
 */
export function isPickerEnabled(): boolean {
  try {
    return localStorage.getItem(PICKER_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setPickerEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PICKER_KEY, enabled ? "1" : "0");
  } catch {
    // Storage disabled: logout keeps the default picker behavior.
  }
}

function read(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedAccount[]) : [];
    return Array.isArray(list) ? list.filter((a) => a && a.email && a.portal) : [];
  } catch {
    return [];
  }
}

function write(list: SavedAccount[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ACCOUNTS)));
  } catch {
    // Private mode / storage disabled: the picker just won't remember anyone.
  }
}

/** Saved accounts, most recently used first. Client-only (localStorage). */
export function savedAccounts(): SavedAccount[] {
  return read().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveSavedAccount(a: Omit<SavedAccount, "id" | "savedAt">): void {
  const id = `${a.portal}:${a.tenantSlug ?? "primary"}:${a.email.toLowerCase()}`;
  // Most-recent-first; a re-login of a known account bumps it to the top.
  write([{ ...a, id, savedAt: Date.now() }, ...read().filter((x) => x.id !== id)]);
}

export function removeSavedAccount(id: string): void {
  write(read().filter((a) => a.id !== id));
}

/** The login URL for a saved account: portal's login page with email + tenant
 *  pre-applied (the login pages pre-fill ?email and AuthLayout pins ?tenant). */
export function loginPathForAccount(a: Pick<SavedAccount, "portal" | "email" | "tenantSlug">): string {
  const base =
    a.portal === "staff" ? "/lms/staff/login" : a.portal === "agent" ? "/lms/agent/login" : "/lms/login";
  const params = new URLSearchParams();
  if (a.email) params.set("email", a.email);
  if (a.tenantSlug) params.set("tenant", a.tenantSlug);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Fire-and-forget: after a successful login, fetch the portal's `me` endpoint
 * with the fresh token and save the profile for the account picker. Called by
 * the student/staff/agent login pages right before they redirect; the redirect
 * never waits on this, and any failure is silently ignored (the picker is a
 * nicety, never a gate).
 */
export function recordLogin(
  portal: SavedPortal,
  email: string,
  token: string,
  tenant: { slug?: string | null; name?: string | null } | null | undefined,
): void {
  const meUrl =
    portal === "student" ? STUDENT_API.me : portal === "staff" ? STAFF_API.me : AGENT_API.me;

  fetch(meUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => (r.ok ? r.json() : null))
    .then((p) => {
      if (!p || typeof p !== "object") return;
      const fromParts = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      const name =
        (typeof p.name === "string" && p.name.trim()) || fromParts || email;
      saveSavedAccount({
        portal,
        email,
        name,
        avatarUrl: p.profile_photo_url ?? p.avatar ?? null,
        tenantSlug: tenant?.slug ?? null,
        tenantName: tenant?.name ?? null,
      });
    })
    .catch(() => {});
}
