"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import OwnerSidebar, { type OwnerIdentity } from "./OwnerSidebar";
import OwnerTopbar from "./OwnerTopbar";
import ErrorBoundary from "./ErrorBoundary";
import ToastProvider from "./ToastProvider";
import DynamicFavicon from "./DynamicFavicon";
import { OWNER_API } from "@/lib/api";
import { getOwnerToken, clearOwnerToken, ownerAuthHeaders, writeBrandingCookie } from "@/lib/owner-client";
import { brandingStyle, type OwnerBranding } from "@/lib/owner-branding";
import { tenantLoginPath, setTenantCookie, getTenantSlug } from "@/lib/tenant-client";
import { writeCachedBranding } from "@/lib/branding-cache";
import IdleLogout from "./IdleLogout";

// Pages that render before the owner has a session — no sidebar, no auth guard.
const PUBLIC_PATHS = ["/lms/admin/login", "/lms/admin/setup"];

export default function OwnerLayoutClient({
  children,
  initialBranding = null,
}: {
  children: React.ReactNode;
  // Branding read from the cookie by the server layout. Used as the branding
  // source until the live overview fetch resolves, so the shell paints the
  // institute's colors/font immediately on refresh (no default-theme flash).
  initialBranding?: OwnerBranding | null;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const [identity, setIdentity] = useState<OwnerIdentity | null>(null);

  // The customization page broadcasts saved branding so the shell (topbar logo,
  // colors, font) updates live without a reload — and we persist it to the
  // cookie so the next refresh is flash-free too.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as OwnerBranding;
      setIdentity((prev) => (prev ? { ...prev, branding: detail } : prev));
      writeBrandingCookie(detail);
      writeCachedBranding(getTenantSlug(), detail);
    };
    window.addEventListener("owner-branding-updated", handler);
    return () => window.removeEventListener("owner-branding-updated", handler);
  }, []);

  // The customization page also broadcasts a renamed institute so the sidebar +
  // topbar update the shown name without a reload.
  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent).detail?.name;
      if (typeof name === "string" && name) {
        setIdentity((prev) => (prev ? { ...prev, name } : prev));
      }
    };
    window.addEventListener("owner-identity-updated", handler);
    return () => window.removeEventListener("owner-identity-updated", handler);
  }, []);

  // Auth guard + institute identity for the chrome. Each page also fetches its
  // own data and handles 401s, but resolving identity here keeps the sidebar and
  // top bar populated across every owner page from one place.
  useEffect(() => {
    if (isPublic) return;
    if (!getOwnerToken()) {
      router.replace(tenantLoginPath("owner"));
      return;
    }
    let cancelled = false;
    fetch(OWNER_API.overview, { headers: ownerAuthHeaders() })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          clearOwnerToken();
          router.replace(tenantLoginPath("owner"));
          return;
        }
        if (r.ok) {
          const j = await r.json();
          if (!cancelled) {
            setIdentity({
              name: j?.tenant?.name ?? null,
              slug: j?.tenant?.slug ?? null,
              email: j?.owner?.email ?? null,
              plan: j?.plan ?? null,
              branding: j?.branding ?? null,
            });
            // Refresh the cookie so the next server render matches the latest
            // branding (kicks in from the very next refresh onward).
            writeBrandingCookie(j?.branding ?? null);
            // Pin the tenant cookie + per-institute localStorage cache so the
            // global pre-paint script (app/layout.tsx) keys off this institute
            // — self-heals owners logged in before the cookie fix shipped.
            if (j?.tenant?.slug) {
              setTenantCookie(j.tenant.slug);
              writeCachedBranding(j.tenant.slug, j?.branding ?? null);
            }
          }
        }
      })
      .catch(() => {
        /* leave identity null — the sidebar shows sensible placeholders */
      });
    return () => {
      cancelled = true;
    };
  }, [isPublic, router]);

  // Login / setup render full-page with no chrome.
  if (isPublic) return <>{children}</>;

  // Branding (per-institute colors + font) is applied to the whole owner shell
  // via CSS variables, so it cascades into the sidebar, topbar, and every page.
  // Until the live fetch resolves we fall back to the cookie-provided branding
  // (server + first client render agree on it, so there's no hydration mismatch
  // and no flash). Children render unconditionally — each page owns its own
  // data-loading state, and swapping them for a spinner on link mousedown would
  // interrupt the client-side navigation (that was the old "clicks bounce to
  // dashboard" bug).
  const branding = identity?.branding ?? initialBranding;
  return (
    <ToastProvider>
    <div className="section-divider pt-6" style={brandingStyle(branding)}>
      <DynamicFavicon href={branding?.logo_url ?? null} />
      <IdleLogout tokenKeys={["lms_owner_token"]} redirectTo={tenantLoginPath("owner")} />
      <div className="container-wide grid items-start gap-4 md:gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <OwnerSidebar identity={identity} />
        <main className="relative min-w-0 pb-8">
          <OwnerTopbar name={identity?.name} branding={branding ?? null} />
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
