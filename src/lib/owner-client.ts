"use client";
// Owner (institute admin) client helpers. The owner session token is stored in
// localStorage under `lms_owner_token`; authenticated owner calls send it as a
// Bearer token so the backend binds the tenant from the session
// (ResolveTenantFromSession), exactly like the student/staff portals.

import { OWNER_BRANDING_COOKIE, serializeBranding, type OwnerBranding } from "./owner-branding";

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
