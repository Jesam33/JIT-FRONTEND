"use client";

import { useEffect, useState } from "react";
import type { OwnerBranding } from "./owner-branding";
import { PUBLIC_API } from "./api";
import { tenantHeaders, getTenantSlug } from "./tenant-client";
import { writeCachedBranding } from "./branding-cache";

// Fetch the institute's white-label branding for a student/staff portal shell.
// The branding endpoint resolves the tenant from the caller's bearer session,
// so we send the portal token when present (harmless if absent — the backend
// falls back to the primary tenant's palette). Returns null until loaded, so
// callers should default with brandingStyle(null) meanwhile (no visible flash,
// since that just re-applies the site's own default font/colors).
//
// When there is no portal session (a public page like login / reset sitting
// inside this shell) and a `publicEndpoint` is given, we resolve branding from
// the public endpoint instead — keyed by the URL's invite/setup token and the
// tenant header — so unauthenticated institute pages still wear their colors.
export function usePortalBranding(endpoint: string, tokenKey: string, publicEndpoint?: string): OwnerBranding | null {
  const [branding, setBranding] = useState<OwnerBranding | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;

    let url = endpoint;
    const headers: Record<string, string> = { Accept: "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (publicEndpoint) {
      url = withUrlToken(publicEndpoint);
      Object.assign(headers, tenantHeaders());
    } else {
      // No session and no public fallback — keep the site's default theme.
      return;
    }

    fetch(url, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.branding) {
          setBranding(j.branding as OwnerBranding);
          // Cache under the active institute slug so the pre-paint script
          // (app/layout.tsx) can apply it before hydration on the next load,
          // killing the flash-of-default-theme on this portal.
          writeCachedBranding(getTenantSlug(), j.branding as OwnerBranding);
        }
      })
      .catch(() => {
        /* branding is decorative — ignore failures and keep the default theme */
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, tokenKey, publicEndpoint]);

  return branding;
}

// Resolve institute branding for an UNAUTHENTICATED public page (student/staff
// login, password setup + reset) that is NOT inside a portal shell. The tenant
// is resolved from the URL's invite/setup token when present (authoritative
// even on the bare apex domain, since the registration is tenant-stamped), else
// the tenant header (subdomain / ?tenant cookie); the backend falls back to the
// primary palette. Returns null until loaded — brandingStyle(null) is the
// default theme, so there is no visible flash.
export function usePublicInstituteBranding(): OwnerBranding | null {
  const [branding, setBranding] = useState<OwnerBranding | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(withUrlToken(PUBLIC_API.branding), { headers: { Accept: "application/json", ...tenantHeaders() } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.branding) {
          setBranding(j.branding as OwnerBranding);
          writeCachedBranding(getTenantSlug(), j.branding as OwnerBranding);
        }
      })
      .catch(() => {
        /* decorative — keep the default theme on failure */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return branding;
}

// Append the current page's invite/setup token (if any) to a branding URL, so
// the backend can resolve the institute even with no subdomain or cookie.
function withUrlToken(base: string): string {
  if (typeof window === "undefined") return base;
  const token = new URLSearchParams(window.location.search).get("token");
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

// A portal is "branded" (and thus tints its dark-mode accents via the
// [data-branded] rules in globals.css) only when the institute has chosen a
// primary color other than the default red. Un-branded institutes keep the
// original monochrome dark look.
export function isBranded(branding: OwnerBranding | null): boolean {
  const p = branding?.primary_color?.toLowerCase();
  return !!p && p !== "#ed180d";
}
