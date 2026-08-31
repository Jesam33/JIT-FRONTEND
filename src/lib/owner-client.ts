"use client";
// Owner (institute admin) client helpers. The owner session token is stored in
// localStorage under `lms_owner_token`; authenticated owner calls send it as a
// Bearer token so the backend binds the tenant from the session
// (ResolveTenantFromSession), exactly like the student/staff portals.

import { OWNER_BRANDING_COOKIE, OWNER_NAME_COOKIE, parseBrandingCookie, serializeBranding, type OwnerBranding } from "./owner-branding";

export const OWNER_TOKEN_KEY = "lms_owner_token";

export function getOwnerToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(OWNER_TOKEN_KEY);
}

export function setOwnerToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OWNER_TOKEN_KEY, token);
}

export function clearOwnerToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OWNER_TOKEN_KEY);
  // Drop the cosmetic branding cookie too, so a logged-out /lms/admin/login page
  // doesn't keep wearing the previous institute's colors.
  clearBrandingCookie();
  // …and the tab-title name cookie, so the logged-out login page goes neutral
  // ("Jorsas Tech") in the tab too, consistent with the colors being cleared.
  clearOwnerNameCookie();
}

export function ownerAuthHeaders(): Record<string, string> {
  const token = getOwnerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const BRANDING_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // ~180 days

// Persist the institute's branding so the server layout renders it in the first
// paint on the next refresh (see owner-branding.ts for why this is safe). Scoped
// to /lms/admin and to this (frontend) origin, so it never rides along on API
// calls to the Laravel backend.
export function writeBrandingCookie(branding: OwnerBranding | null | undefined): void {
  if (typeof document === "undefined") return;
  const value = serializeBranding(branding);
  if (!value) return;
  document.cookie = `${OWNER_BRANDING_COOKIE}=${encodeURIComponent(value)}; path=/lms/admin; max-age=${BRANDING_COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearBrandingCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${OWNER_BRANDING_COOKIE}=; path=/lms/admin; max-age=0; samesite=lax`;
}

// Persist the academy's display name so the owner server layout can render it in
// the browser-tab <title> on the next render (see OWNER_NAME_COOKIE). Without a
// server-side title the /lms/admin subtree inherits the root's "Jorsas Tech", and
// because the layout now ships an async generateMetadata (for the favicon) Next
// streams that inherited title in after hydration and clobbers the client's
// `document.title` — so the tab title has to come from the server too. Scoped to
// /lms/admin + this origin exactly like the branding cookie.
export function writeOwnerNameCookie(name: string | null | undefined): void {
  if (typeof document === "undefined") return;
  const clean = (name ?? "").trim();
  if (!clean) return;
  document.cookie = `${OWNER_NAME_COOKIE}=${encodeURIComponent(clean)}; path=/lms/admin; max-age=${BRANDING_COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearOwnerNameCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${OWNER_NAME_COOKIE}=; path=/lms/admin; max-age=0; samesite=lax`;
}

// Read the owner branding the shell already wrote to the /lms/admin cookie. This
// is a SYNCHRONOUS source for owner-admin pages that need the academy's label
// (academyLabel(readOwnerBranding())) but don't otherwise fetch branding — no
// extra round-trip, no loading flash, and it matches exactly what the server
// layout pre-paints from. Returns null server-side or before the cookie exists.
export function readOwnerBranding(): OwnerBranding | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${OWNER_BRANDING_COOKIE}=([^;]*)`));
  return m ? parseBrandingCookie(m[1]) : null;
}

// ─── Plan-limit / upgrade prompt ────────────────────────────────────────────
// When an owner action would exceed their plan (a 4th course on Free, an extra
// staff seat, a paid-only feature…), the backend answers HTTP 402 (Payment
// Required) with { message, feature, limit, plan, upgrade_required }. 402 is used
// deliberately: every owner page treats 401/403 as "auth is gone" and bounces to
// login, so reusing 403 here logged the owner out mid-action. 402 slips past those
// guards and we intercept it explicitly to raise a friendly upgrade modal instead.

export const UPGRADE_REQUIRED_EVENT = "owner-upgrade-required";

export type UpgradeInfo = {
  message: string;
  // Which cap/feature was hit: "courses" | "staff" | "students" | "chat" | "live_classes".
  feature?: string;
  limit?: number;
  // The institute's current plan name (e.g. "Free"), for the modal's context chip.
  plan?: string;
};

// Raise the global upgrade modal (mounted once in OwnerLayoutClient). Safe to call
// from anywhere on the client — server-side it's a no-op.
export function dispatchUpgradeRequired(info: UpgradeInfo): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(UPGRADE_REQUIRED_EVENT, { detail: info }));
}

// Intercept a plan-limit response. If `res` is a 402, parse its body, raise the
// upgrade modal, and return true so the caller can bail cleanly:
//
//     const res = await fetch(...);
//     if (await maybeUpgrade(res)) return;   // modal shown, stop here
//     if (res.status === 401 || res.status === 403) { ...logout }
//
// For any non-402 response it returns false immediately WITHOUT touching the body,
// so the caller's own `res.json()` still works. (On 402 we read a clone, so even a
// caller that later reads `res` is unaffected.)
export async function maybeUpgrade(res: Response): Promise<boolean> {
  if (res.status !== 402) return false;
  let info: UpgradeInfo = { message: "You've reached your plan's limit. Upgrade to continue." };
  try {
    const body = await res.clone().json();
    info = {
      message: typeof body?.message === "string" && body.message ? body.message : info.message,
      feature: typeof body?.feature === "string" ? body.feature : undefined,
      limit: typeof body?.limit === "number" ? body.limit : undefined,
      plan: typeof body?.plan === "string" ? body.plan : undefined,
    };
  } catch {
    /* keep the sensible default message */
  }
  dispatchUpgradeRequired(info);
  return true;
}
