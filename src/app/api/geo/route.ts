import { NextRequest, NextResponse } from "next/server";

// Best-effort visitor geolocation for hosts WITHOUT a CDN geo header (Namecheap
// shared hosting). The storefront calls this once client-side when it has no
// country/currency cookie; we resolve the country from the forwarded IP via a
// free, no-key provider, stash it in a 7-day cookie, and return it so the page
// can re-render localized. Every failure path is silent — the manual currency
// selector is the guaranteed fallback, so the storefront never depends on this.

export async function GET(req: NextRequest) {
  // Prefer an explicit CDN header when one is present.
  const hdr =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    "";
  let country =
    /^[A-Za-z]{2}$/.test(hdr) && hdr.toUpperCase() !== "XX" ? hdr.toUpperCase() : "";

  if (!country) {
    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0].trim();
    const provider = process.env.GEO_IP_PROVIDER_URL || "https://ipwho.is/";
    try {
      // ipwho.is/{ip} and ip-api.com/json/{ip} both accept a trailing IP; with
      // no IP (local dev) the provider geolocates the caller, which is fine.
      const url = ip ? `${provider}${encodeURIComponent(ip)}` : provider;
      const r = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const d = await r.json();
        const cc = String(d?.country_code ?? d?.countryCode ?? "").toUpperCase();
        if (/^[A-Z]{2}$/.test(cc)) country = cc;
      }
    } catch {
      // ignore — fall through to no country
    }
  }

  const res = NextResponse.json({ country });
  if (country) {
    res.cookies.set("country", country, { path: "/", maxAge: 60 * 60 * 24 * 7 });
  }
  return res;
}
