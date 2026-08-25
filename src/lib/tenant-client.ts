// Tenant header for UNAUTHENTICATED browser requests — login, password reset,
// and public course intake. The backend's ResolveTenant middleware reads
// `X-Tenant-Slug` to bind the organisation before any credential is known.
//
// Authenticated calls (apiFetch / apiFetchStaff) deliberately do NOT use this:
// the backend derives the tenant from the session bearer token
// (ResolveTenantFromSession), which is authoritative and overrides any header.
//
// The slug is resolved in order:
//   1. the `tenant` cookie — set by middleware.ts (from a subdomain) or by
//      SetTenantFromQuery (from a ?tenant= query param), then
//   2. NEXT_PUBLIC_PRIMARY_TENANT_SLUG — the bare-domain default, so the primary
//      organisation (JIT) still resolves when no cookie is present.

export function getTenantSlug(): string {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|;\s*)tenant=([^;]*)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return process.env.NEXT_PUBLIC_PRIMARY_TENANT_SLUG ?? "";
}

export function tenantHeaders(): Record<string, string> {
  const slug = getTenantSlug();
  return slug ? { "X-Tenant-Slug": slug } : {};
}

// Pin the `tenant` cookie to an explicit institute slug. Called on successful
// login with the slug the backend resolved for the authenticated account, so
// the whole authenticated session — every portal fetch AND any inactivity →
// login redirect (which reads getTenantSlug()) — stays on the right institute
// instead of falling back to the primary slug (`jorsas`). This is the fix for
// a customised institute's user landing on a `?tenant=jorsas` login that then
// rejects their (correct) credentials. Safe with an empty/undefined slug —
// it simply no-ops rather than writing a blank cookie.
export function setTenantCookie(slug?: string | null): void {
  if (typeof document !== "undefined" && slug) {
    document.cookie = `tenant=${encodeURIComponent(slug)}; path=/; max-age=${60 * 60 * 24 * 7}`;
  }
}

// Pin the tenant cookie from the current URL's ?tenant= (if present), WITHOUT
// touching any other query params or reloading — unlike SetTenantFromQuery,
// which clears the whole query string (that would strip the email/token an
// invite or reset link carries). The public auth pages (login, forgot/reset/
// setup password) call this on mount so an emailed link's ?tenant={slug} keeps
// the visitor pinned to the right institute all the way through set-password →
// login, instead of the cookie falling back to the primary slug. No reload is
// needed: these pages resolve the tenant client-side via the X-Tenant-Slug
// header (tenantHeaders), read from this cookie at call time. Safe to call when
// no ?tenant= is present — it simply no-ops. Returns the effective slug.
export function pinTenantFromLocation(): string {
  if (typeof window !== "undefined") {
    const tenant = new URL(window.location.href).searchParams.get("tenant");
    if (tenant) {
      document.cookie = `tenant=${encodeURIComponent(tenant)}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
  }
  return getTenantSlug();
}

// Build the public login URLs a tenant shares with its students/staff/owner.
// With NEXT_PUBLIC_APP_DOMAIN set, these are true subdomains
// (https://{slug}.{domain}/…). Without it (local dev, or before wildcard DNS is
// live), fall back to the current origin plus ?tenant={slug} so the backend can
// still resolve the organisation.
export function tenantLoginUrls(slug: string): { student: string; staff: string; owner: string } {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (domain && slug) {
    const base = `https://${slug}.${domain}`;
    return {
      student: `${base}/lms/login`,
      staff: `${base}/lms/staff/login`,
      owner: `${base}/lms/admin/login`,
    };
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const q = slug ? `?tenant=${encodeURIComponent(slug)}` : "";
  return {
    student: `${origin}/lms/login${q}`,
    staff: `${origin}/lms/staff/login${q}`,
    owner: `${origin}/lms/admin/login${q}`,
  };
}

// The CURRENT tenant's login path (relative — path + query), for same-origin
// navigation from inside a portal (router.push / router.replace / location.href
// after a session expires). On a real institute subdomain the bare path already
// keeps the user on the right institute; on the bare domain (local dev / before
// wildcard DNS) we append ?tenant={slug} so the backend still resolves the
// institute after the redirect. Relative (not absolute) so it never bounces the
// user cross-origin — the fix for expired student sessions landing on JIT login.
export function tenantLoginPath(portal: "student" | "staff" | "owner" = "student"): string {
  const base =
    portal === "staff"
      ? "/lms/staff/login"
      : portal === "owner"
        ? "/lms/admin/login"
        : "/lms/login";
  // On a true subdomain the origin already pins the tenant, so the bare path is
  // correct. Only the bare-domain fallback needs the explicit ?tenant= hint.
  if (process.env.NEXT_PUBLIC_APP_DOMAIN) return base;
  const slug = getTenantSlug();
  return slug ? `${base}?tenant=${encodeURIComponent(slug)}` : base;
}

// The public storefront URL an institute shares so prospective students can
// browse its courses and self-register (its own "jorsastech.com"-style page).
// With NEXT_PUBLIC_APP_DOMAIN set this is the pretty subdomain
// (https://{slug}.{domain}); without it (local dev / before wildcard DNS) it
// falls back to the path-based /i/{slug} that already works today.
export function tenantStorefrontUrl(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (domain && slug) return `https://${slug}.${domain}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/i/${slug}`;
}
