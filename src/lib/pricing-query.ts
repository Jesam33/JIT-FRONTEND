import { cookies } from "next/headers";

// Build the ?currency=/?country= suffix the storefront server pages forward to
// Laravel, read from the visitor's cookies:
//   • `currency` — a manual selector override (wins; cosmetic display only)
//   • `country`  — the detected country hint (CDN header via middleware, or the
//                  /api/geo route)
// Neither present → "" (the backend shows the base NGN price). The amount is
// always server-authoritative; this only ever influences DISPLAY currency (and,
// once USD charging is enabled, which supported charge currency applies).
//
// Server-only: it reads next/headers, so import it from server components /
// route handlers, never from a "use client" module.
export async function pricingQuery(): Promise<string> {
  const jar = await cookies();
  const currency = (jar.get("currency")?.value || "").trim();
  const country = (jar.get("country")?.value || "").trim();

  const params = new URLSearchParams();
  if (currency) params.set("currency", currency);
  else if (country) params.set("country", country);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
