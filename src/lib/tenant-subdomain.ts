// ONE source of truth for "which tenant subdomain is this hostname?", shared by
// middleware.ts (server/edge) and the client chrome guards (AppChrome,
// BrandingGuard). Pure string logic, no window/document access at module level,
// so it is safe to import everywhere.
//
// Why this exists: the middleware REWRITES a subdomain root ({academy}.domain/)
// to the path-based storefront /i/{slug}. Rewrites never change the browser URL,
// so usePathname() returns "/" there — server-side AND after hydration — and
// every pathname-based "is this a branded area?" check misfires on a tenant
// subdomain origin. The HOST is the only signal there, and it is readable
// client-side only after mount (no window during SSR). See AppChrome.tsx and
// the branding-init pre-paint script in app/layout.tsx (which keeps a raw-JS
// copy of this logic; keep them in sync).

// Kept in sync with config/saas.php `reserved_slugs`. These never resolve as a
// tenant subdomain (they collide with infra hosts or app-level routes).
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www", "api", "app", "admin", "mail", "smtp", "ftp",
  "static", "assets", "cdn", "img", "images", "media",
  "dashboard", "billing", "signup", "login", "onboarding",
  "support", "help", "docs", "blog", "status", "default",
]);

// The raw label in front of the apex domain, WITHOUT the reserved-slug filter
// (callers that resolve /t/{slug} paths need to run their own RESERVED check on
// path-sourced slugs too).
export function subdomainForHost(hostname: string): string | null {
  const hostOnly = hostname.split(":")[0];

  // A raw IPv4 address (e.g. 127.0.0.1) has no subdomain, never treat its
  // first octet ("127") as a tenant slug. Without this guard, browsing on
  // http://127.0.0.1:3000 fires /api/tenant/resolve?slug=127 on every request
  // (a harmless but noisy 404). Use http://localhost:3000 or a real subdomain.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostOnly)) return null;

  // With APP_DOMAIN set, a true subdomain is any single label in front of it.
  // A multi-label prefix (deep.academy.domain) is NOT a tenant subdomain: the
  // middleware could never resolve it either (it would try the first label,
  // fail backend validation, and pass through), so chrome guards must not
  // treat it as one.
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "";
  if (appDomain) {
    if (hostOnly === appDomain || hostOnly === `www.${appDomain}`) return null;
    if (hostOnly.endsWith(`.${appDomain}`)) {
      const prefix = hostOnly.slice(0, -(appDomain.length + 1));
      return prefix && !prefix.includes(".") ? prefix : null;
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

// The full verdict for chrome/branding decisions: the tenant slug this host
// represents, or null when the host is the apex domain, www, a reserved label,
// or a bare IP address.
export function tenantSubdomainForHost(hostname: string): string | null {
  const slug = subdomainForHost(hostname);
  return slug && !RESERVED_SUBDOMAINS.has(slug.toLowerCase()) ? slug : null;
}
