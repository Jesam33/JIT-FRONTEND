import type { NextRequest } from "next/server";

// Generated square icon for a LOGO-LESS academy: the academy's initial on its
// brand color, served as SVG at /pwa/{slug}/icon. Used by the per-academy
// manifest (pwa/[slug]/manifest) as the install icon when the academy has not
// uploaded a logo — the same "never leak the Jorsas mark" rule the generated
// tab favicon (lib/initial-mark.ts) follows, drawn server-side here because a
// manifest icon must be a real URL, not a data: URI.
//
// The letter and colors come from the PUBLIC storefront payload, so the route
// is unauthenticated. The letter is XML-escaped and the color is validated as
// a strict 6-digit hex, so nothing user-supplied can break out of the SVG.

export const dynamic = "force-dynamic";

type StorefrontPayload = {
  institute?: { name?: string | null };
  branding?: { primary_color?: string | null };
};

const FALLBACK_THEME = "#ed180d";

function themeColor(hex?: string | null): string {
  return hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : FALLBACK_THEME;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let data: StorefrontPayload | null = null;
  try {
    const baseUrl = process.env.LARAVEL_BACKEND_URL ?? "http://127.0.0.1:8000";
    const res = await fetch(`${baseUrl}/api/frontend/i/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) data = (await res.json()) as StorefrontPayload;
  } catch {
    // Fall through to slug-derived defaults.
  }

  const source = data?.institute?.name?.trim() || slug;
  const letter = escapeXml(source.charAt(0).toUpperCase() || "A");
  const color = themeColor(data?.branding?.primary_color);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">` +
    `<rect width="512" height="512" rx="112" fill="${color}"/>` +
    `<text x="256" y="256" fill="#ffffff" font-family="'Segoe UI', system-ui, sans-serif" font-size="272" font-weight="700" text-anchor="middle" dominant-baseline="central">${letter}</text>` +
    `</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=600",
    },
  });
}
