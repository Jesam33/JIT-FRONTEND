"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_OPTIONS, readCookie } from "@/lib/currency";

// Subtle currency control for the storefront. It does NOT convert prices itself
// — it sets a cookie and asks Next to re-render the server view, so the backend
// (the single FX source) recomputes every price. Two jobs:
//
//  1. One-shot geo autodetect for hosts with no CDN geo header (Namecheap): if
//     the visitor has neither manually chosen a currency nor been geo-tagged,
//     hit /api/geo (which sets a `country` cookie) and refresh once.
//  2. Manual override: the guaranteed fallback for visitors whose country we
//     can't detect or whose local currency we don't map — pick any supported
//     currency, or "Auto" to clear the override and fall back to detection.

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const maxAge = days > 0 ? `; max-age=${days * 86400}` : "; max-age=0";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/${maxAge}`;
}

export default function CurrencySwitcher({ active }: { active: string }) {
  const router = useRouter();
  const [value, setValue] = useState("AUTO");
  const [busy, setBusy] = useState(false);

  // Reflect a manual override if one is already set (avoids a hydration mismatch
  // by starting at "AUTO" on both server and client, then syncing on mount).
  useEffect(() => {
    const forced = readCookie("currency");
    setValue(forced ? forced.toUpperCase() : "AUTO");
  }, []);

  // Autodetect once per tab when we have no hint at all.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (readCookie("currency") || readCookie("country")) return;
    if (sessionStorage.getItem("geo_checked")) return;
    sessionStorage.setItem("geo_checked", "1");
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d) => {
        if (d?.country) router.refresh();
      })
      .catch(() => {});
  }, [router]);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setValue(v);
    setBusy(true);
    if (v === "AUTO") setCookie("currency", "", -1);
    else setCookie("currency", v, 7);
    router.refresh();
    // router.refresh() returns void, so re-enable shortly after rather than await.
    setTimeout(() => setBusy(false), 600);
  }

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={busy}
      aria-label="Display currency"
      className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white outline-none transition focus:border-white/40 disabled:opacity-60"
    >
      <option value="AUTO" className="bg-[#0b0b0b]">
        Auto{active ? ` (${active})` : ""}
      </option>
      {CURRENCY_OPTIONS.map((c) => (
        <option key={c.code} value={c.code} className="bg-[#0b0b0b]">
          {c.code}
        </option>
      ))}
    </select>
  );
}
