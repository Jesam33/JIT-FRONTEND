import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.LARAVEL_BACKEND_URL || "http://127.0.0.1:8000";
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "";

// Kept in sync with config/saas.php `reserved_slugs`. These never resolve as a
// tenant subdomain (they collide with infra hosts or app-level routes).
const RESERVED = new Set([
  "www", "api", "app", "admin", "mail", "smtp", "ftp",
  "static", "assets", "cdn", "img", "images", "media",
  "dashboard", "billing", "signup", "login", "onboarding",
  "support", "help", "docs", "blog", "status", "default",
]);

function subdomainFor(host: string): string | null {
  const hostOnly = host.split(":")[0];

  // A raw IPv4 address (e.g. 127.0.0.1) has no subdomain — never treat its
  // first octet ("127") as a tenant slug. Without this guard, browsing on
  // http://127.0.0.1:3000 fires /api/tenant/resolve?slug=127 on every request
  // (a harmless but noisy 404). Use http://localhost:3000 or a real subdomain.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostOnly)) return null;

  // With APP_DOMAIN set, a true subdomain is any single label in front of it.
  if (APP_DOMAIN) {
    if (hostOnly === APP_DOMAIN || hostOnly === `www.${APP_DOMAIN}`) return null;
    if (hostOnly.endsWith(`.${APP_DOMAIN}`)) {
      const prefix = hostOnly.slice(0, -(APP_DOMAIN.length + 1));
      return prefix.split(".")[0] || null;
    }
    return null;
  }

  // Local dev / no APP_DOMAIN: fall back to the label heuristic
  // (tenant.localhost, or sub.example.com with 3+ labels).
  const hostParts = hostOnly.split(".");
  if (hostParts.length >= 3) return hostParts[0];
  if (hostParts.length === 2 && hostOnly.endsWith("localhost")) return hostParts[0];
  return null;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Visitor country from a CDN geo header, if the host provides one (Cloudflare
  // `cf-ipcountry` / Vercel `x-vercel-ip-country`). Namecheap shared hosting
  // doesn't, so this is best-effort — the /api/geo route + manual currency
  // selector are the guaranteed fallback. Set once; never clobber a value the
  // client already resolved. `decorate()` stamps it onto whichever response we
  // ultimately return so it applies with or without a tenant match.
  const geoHeader =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    "";
  const country =
    /^[A-Za-z]{2}$/.test(geoHeader) && geoHeader.toUpperCase() !== "XX"
      ? geoHeader.toUpperCase()
      : "";
  const hasCountryCookie = req.cookies.has("country");
  const decorate = (res: NextResponse): NextResponse => {
    if (country && !hasCountryCookie) {
      res.cookies.set("country", country, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    }
    return res;
  };

  // 1) Path-based tenant: /t/{slug}/...
  const parts = url.pathname.split("/").filter(Boolean);
  let tenantSlug: string | null = null;
  if (parts[0] === "t" && parts[1]) {
    tenantSlug = parts[1];
  }

  // 2) Otherwise, hostname subdomain.
  if (!tenantSlug) {
    tenantSlug = subdomainFor(host);
  }

  // Never resolve a reserved slug as a tenant.
  if (tenantSlug && RESERVED.has(tenantSlug.toLowerCase())) {
    tenantSlug = null;
  }

  if (tenantSlug) {
    // Validate the slug with the backend so a stale/typo'd subdomain doesn't
    // pin a bad cookie.
    try {
      const res = await fetch(`${BACKEND}/api/tenant/resolve?slug=${encodeURIComponent(tenantSlug)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const cookieVal = json?.tenant?.slug ?? tenantSlug;
        const response = NextResponse.next();
        response.cookies.set("tenant", cookieVal, { path: "/" });
        return decorate(response);
      }
    } catch {
      // ignore — fall through without setting a cookie
    }
  }

  return decorate(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
