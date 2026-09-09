import { NextRequest, NextResponse } from "next/server";
import { subdomainForHost, RESERVED_SUBDOMAINS } from "@/lib/tenant-subdomain";

const BACKEND = process.env.LARAVEL_BACKEND_URL || "http://127.0.0.1:8000";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  // Visitor country from a CDN geo header, if the host provides one (Cloudflare
  // `cf-ipcountry` / Vercel `x-vercel-ip-country`). Namecheap shared hosting
  // doesn't, so this is best-effort, the /api/geo route + manual currency
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
  let fromSubdomain = false;
  if (!tenantSlug) {
    tenantSlug = subdomainForHost(host);
    fromSubdomain = !!tenantSlug;
  }

  // Never resolve a reserved slug as a tenant.
  if (tenantSlug && RESERVED_SUBDOMAINS.has(tenantSlug.toLowerCase())) {
    tenantSlug = null;
    fromSubdomain = false;
  }

  if (tenantSlug) {
    // Validate the slug with the backend so a stale/typo'd subdomain doesn't
    // pin a bad cookie.
    try {
      const res = await fetch(`${BACKEND}/api/tenant/resolve?slug=${encodeURIComponent(tenantSlug)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const cookieVal = json?.tenant?.slug ?? tenantSlug;

        // A visitor on {academy}.domain asking for the ROOT should see that
        // academy's storefront, not the platform's marketing homepage — the
        // owner dashboard shares exactly this URL (tenantStorefrontUrl).
        // Rewrite (not redirect) to the path-based storefront route so the
        // browser URL stays https://{academy}.domain/ while the /i/{slug}
        // page renders. Other paths (e.g. /lms/login) pass through untouched.
        if (fromSubdomain && url.pathname === "/") {
          const rewritten = req.nextUrl.clone();
          rewritten.pathname = `/i/${cookieVal}`;
          const response = NextResponse.rewrite(rewritten);
          response.cookies.set("tenant", cookieVal, { path: "/" });
          return decorate(response);
        }

        const response = NextResponse.next();
        response.cookies.set("tenant", cookieVal, { path: "/" });
        return decorate(response);
      }
    } catch {
      // ignore, fall through without setting a cookie
    }
  }

  return decorate(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
