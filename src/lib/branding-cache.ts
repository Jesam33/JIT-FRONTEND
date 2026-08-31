import type { OwnerBranding } from "./owner-branding";
import { fontStackFor } from "./owner-branding";

// Per-institute branding cache in localStorage, keyed by tenant slug. This is
// what kills the flash-of-default-theme (FOUC) on the student/staff/admin
// portals: those shells fetch branding client-side (null on first paint), so
// without a cache the FIRST frame always shows the primary Jorsas palette and
// only swaps to the institute's colors once the fetch resolves.
//
// The `branding-init` inline <Script> in the root layout reads this cache
// BEFORE hydration (see app/layout.tsx) and pre-paints :root, so a returning
// visitor to a customised institute never sees the Jorsas theme. The portal
// branding hooks write the cache on every successful fetch, so it self-heals
// and stays fresh. First-ever visit (empty cache) still shows the default for
// one frame — an accepted trade-off, mirroring the owner cookie approach.
//
// We store a RESOLVED font stack (not the font-key) so the pre-paint script can
// apply it without importing fontStackFor. Only presentational fields live here
// — never a token — and the init script re-validates every hex before use.
export type CachedBranding = {
  primary_color: string | null;
  secondary_color: string | null;
  font_stack: string | null;
  logo_url: string | null;
  // The academy's entity label, cached so a portal shell can render it on the
  // first frame (no "Online Academy" → custom-label text flash). Presentational
  // text only — no identifier, no token.
  entity_label: string | null;
  entity_label_plural: string | null;
};

export function brandingCacheKey(slug: string): string {
  return `lms_branding:${slug}`;
}

export function writeCachedBranding(slug: string | null | undefined, b: OwnerBranding | null | undefined): void {
  if (typeof window === "undefined" || !slug || !b) return;
  try {
    const payload: CachedBranding = {
      primary_color: b.primary_color ?? null,
      secondary_color: b.secondary_color ?? null,
      // Resolve "default"/unknown to null so the pre-paint script leaves the
      // site font untouched rather than pinning the default stack redundantly.
      font_stack: b.font_family && b.font_family !== "default" ? fontStackFor(b.font_family) : null,
      logo_url: b.logo_url ?? null,
      entity_label: b.entity_label ?? null,
      entity_label_plural: b.entity_label_plural ?? null,
    };
    localStorage.setItem(brandingCacheKey(slug), JSON.stringify(payload));
  } catch {
    /* storage full / disabled — the cache is an optimisation, so ignore */
  }
}

export function readCachedBranding(slug: string | null | undefined): CachedBranding | null {
  if (typeof window === "undefined" || !slug) return null;
  try {
    const raw = localStorage.getItem(brandingCacheKey(slug));
    return raw ? (JSON.parse(raw) as CachedBranding) : null;
  } catch {
    return null;
  }
}

// Drop a slug's cached branding. Used when an institute is no longer valid for
// this browser (e.g. it was deleted, or we're on a platform page that must show
// the default theme), so the pre-paint script stops re-applying its colors.
export function clearCachedBranding(slug: string | null | undefined): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    localStorage.removeItem(brandingCacheKey(slug));
  } catch {
    /* storage disabled — nothing to clear */
  }
}

// Revert the LIVE :root to the default Jorsas theme by undoing exactly what the
// `branding-init` pre-paint script (app/layout.tsx) sets. Removing the inline
// custom properties lets the stylesheet's own defaults (--color-primary #ed180d,
// etc.) take back over — so this needs no hardcoded palette. Call this on
// platform pages that must always look default (e.g. the owner setup page),
// where a stale tenant cookie + cache would otherwise bleed a deleted
// institute's colors through the pre-paint.
export function resetBrandingToDefault(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  try {
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--color-secondary");
    root.style.removeProperty("--brand-font");
    root.removeAttribute("data-branded");
    document.querySelectorAll("link[data-brand-favicon]").forEach((el) => el.remove());
  } catch {
    /* defensive — never let a cosmetic reset throw */
  }
}
