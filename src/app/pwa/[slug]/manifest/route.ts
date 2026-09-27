import { NextRequest } from "next/server";

// Per-academy Web App Manifest, served at
// /pwa/{slug}/manifest?role=student|staff|agent.
//
// Each academy's students and staff install THEIR OWN app from inside the
// logged-in portal: a PFC student installs "PFC Academy" (its logo, its brand
// color), which opens straight to the student portal. This is only possible
// because a PWA's identity (name, icons, theme color, start_url) is read from
// the linked manifest AT INSTALL TIME — so the portal swaps its <link
// rel="manifest"> to this route (see lib/install-app.ts) and the browser
// installs the academy's app instead of the platform's.
//
// Served by a route handler (not app/manifest.ts) because the content is
// per-tenant; the root manifest.ts stays the platform's marketing-site
// manifest. Every value comes from the PUBLIC storefront payload
// (GET /api/frontend/i/{slug}), so no auth is involved.
//
// The `role` query param picks where the installed app opens:
//   student → /lms/app          (its guard bounces a logged-out user to login)
//   staff   → /lms/staff/app
//   agent   → /lms/agent/dashboard
// The roles are separate installs (distinct `id`), so a teacher who is also a
// student at the same academy can have both on their home screen.
// start_url carries ?tenant={slug} so the app pins the right academy even on
// deployments without subdomains (the portals read it via
// pinTenantFromLocation on mount).

export const dynamic = "force-dynamic";

type StorefrontPayload = {
  institute?: { name?: string | null };
  branding?: { logo_url?: string | null; primary_color?: string | null };
  profile?: { tagline?: string | null };
};

const FALLBACK_THEME = "#000000";

// Whitelisted so an unknown ?role= can never end up interpolated into a
// start_url (the value lands in the manifest, not in a query we control).
const ROLES = {
  student: { start: "/lms/app", portal: "learning portal" },
  staff: { start: "/lms/staff/app", portal: "staff portal" },
  agent: { start: "/lms/agent/dashboard", portal: "Admission Marketer portal" },
} as const;

type Role = keyof typeof ROLES;

function themeColor(hex?: string | null): string {
  return hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : FALLBACK_THEME;
}

function prettifiedSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const requested = request.nextUrl.searchParams.get("role");
  const role: Role = requested && requested in ROLES ? (requested as Role) : "student";

  let data: StorefrontPayload | null = null;
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/i/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) data = (await res.json()) as StorefrontPayload;
  } catch {
    // Backend slow/unreachable: fall through to slug-derived defaults so the
    // route still answers (the install sheet degrades, it never 500s).
  }

  const name = data?.institute?.name?.trim() || prettifiedSlug(slug);
  const logo = data?.branding?.logo_url ?? null;
  const theme = themeColor(data?.branding?.primary_color);

  const startUrl = `${ROLES[role].start}?tenant=${encodeURIComponent(slug)}`;

  // When the academy has a logo we declare it at the sizes Chrome's
  // installability check requires (an actual bitmap >= 144px). A logo-less
  // academy gets the generated initial-mark SVG at /pwa/{slug}/icon instead
  // (its initial on its brand color), mirroring the tab favicon behaviour.
  const icons = logo
    ? [
        { src: logo, sizes: "192x192", purpose: "any" },
        { src: logo, sizes: "512x512", purpose: "any" },
        { src: logo, sizes: "512x512", purpose: "maskable" },
      ]
    : [
        { src: `/pwa/${encodeURIComponent(slug)}/icon`, sizes: "any", type: "image/svg+xml", purpose: "any" },
        { src: `/pwa/${encodeURIComponent(slug)}/icon`, sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      ];

  const manifest = {
    id: `/?tenant=${encodeURIComponent(slug)}&role=${role}`,
    name,
    // The launcher label: the first word or two, kept short.
    short_name: name.split(/\s+/).slice(0, 2).join(" ").slice(0, 15) || name.slice(0, 15),
    // The academy's own tagline wins when it has one; otherwise name the
    // portal this particular install opens, so an agent's and a student's app
    // are not described identically on the home screen.
    description: data?.profile?.tagline?.trim() || `The ${name} ${ROLES[role].portal}`,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: theme,
    icons,
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=600",
    },
  });
}
