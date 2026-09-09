import { cookies, headers } from "next/headers";
import type { Metadata } from "next";
import { tenantSubdomainForHost } from "@/lib/tenant-subdomain";

// Server-side share metadata (tab title, browser-tab icon, and the link-preview
// "thumbnail" WhatsApp/X/iMessage cards read from og:image) for the public auth
// pages: /lms/login, /lms/staff/login, /lms/admin/login.
//
// WHY SERVER-SIDE: those pages swap the favicon and title in the browser via
// DynamicFavicon/AuthLayout, but link-preview crawlers never run JavaScript, so
// a shared https://{academy}.jorsastech.com/lms/login link rendered the generic
// Jorsas card (root metadata) with no trace of the academy. Emitting real
// <meta property="og:..."> tags, plus the academy logo as the tab icon the same
// way the /i/{slug} storefront does, makes the shared link wear the academy's
// brand with zero client work. A nested segment's metadata keys REPLACE the
// root layout's, so on these pages Next emits ONLY the academy icon, no Jorsas
// fallback link remains.
//
// Tenant resolution mirrors the middleware: the hostname subdomain is
// authoritative; the `tenant` cookie (written by the middleware on subdomain
// visits, or by pinTenantFromLocation after a ?tenant= link) is the fallback
// for apex-domain visits. The primary Jorsas tenant and unknown slugs return {}
// so the root layout's own metadata (Jorsas logo) applies untouched.

const PRIMARY = process.env.NEXT_PUBLIC_PRIMARY_TENANT_SLUG ?? "jorsas";

type StorefrontPayload = {
  institute?: { name?: string | null };
  branding?: { logo_url?: string | null };
  profile?: { tagline?: string | null; cover_url?: string | null };
};

const AREAS = {
  student: {
    title: "Student sign in",
    description: (name: string) => `Sign in to ${name} to continue your courses.`,
  },
  staff: {
    title: "Staff sign in",
    description: (name: string) => `Sign in to ${name} to teach and manage your classes.`,
  },
  owner: {
    title: "Owner sign in",
    description: (name: string) => `Sign in to manage ${name}.`,
  },
} as const;

export type AuthArea = keyof typeof AREAS;

export async function tenantAuthMetadata(area: AuthArea): Promise<Metadata> {
  const slug =
    tenantSubdomainForHost((await headers()).get("host") ?? "") ??
    (await cookies()).get("tenant")?.value ??
    null;

  if (!slug || slug === PRIMARY) return {};

  let data: StorefrontPayload | null = null;
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/i/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) data = (await res.json()) as StorefrontPayload;
  } catch {
    // Decorative: a slow or unreachable backend keeps the root Jorsas metadata.
  }

  const name = data?.institute?.name?.trim();
  if (!name) return {};

  const conf = AREAS[area];
  const title = `${name} | ${conf.title}`;
  const description = data?.profile?.tagline?.trim() || conf.description(name);
  // The share thumbnail prefers the academy's storefront cover, then its logo.
  const shareImage = data?.profile?.cover_url || data?.branding?.logo_url || null;

  return {
    title,
    description,
    ...(data?.branding?.logo_url ? { icons: { icon: data.branding.logo_url } } : {}),
    openGraph: {
      title,
      description,
      ...(shareImage ? { images: [{ url: shareImage }] } : {}),
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}
