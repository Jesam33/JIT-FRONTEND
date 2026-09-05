import type { CSSProperties } from "react";

// White-label branding for an institute. Stored server-side in
// tenant.settings.branding and applied to the owner portal via CSS variables
// on the shell wrapper (so it composes with the existing light/dark theme).
export type OwnerBranding = {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  // Ambient glow behind the institute's public storefront. Null = standard theme.
  background_color?: string | null;
  font_family?: string | null;
  // What this academy calls itself — the customer-facing entity noun (e.g.
  // "Institute", "Academy", "School"). Resolved server-side (brandingArray):
  // "Institute" for the primary tenant, "Online Academy" for everyone else,
  // or the owner's own override. Text-only — never a code identifier.
  entity_label?: string | null;
  entity_label_plural?: string | null;
  // The academy's own display name (customer-facing text). Carried on the
  // fetched branding — NOT on the branding cookie (serializeBranding still
  // whitelists, so the cookie stays name-free; the owner name rides in its own
  // OWNER_NAME_COOKIE for first-paint). Public institute pages read this to
  // title the browser tab with the academy instead of "Jorsas Tech".
  name?: string | null;
};

// Concrete defaults (the current red/blue theme). Typed with plain-string
// colors/font — not Required<OwnerBranding>, whose `| null` would poison the
// `useState` inference in the customization form.
export const DEFAULT_BRANDING = {
  logo_url: null as string | null,
  primary_color: "#ed180d",
  secondary_color: "#2e82b5",
  background_color: null as string | null,
  font_family: "default",
};

// Curated font choices. We map a stored key to a robust CSS stack rather than
// storing raw font names — this keeps things reliable (no external font loads)
// and safe (nothing arbitrary is injected into styles).
export const FONT_OPTIONS: { key: string; label: string; stack: string }[] = [
  { key: "default", label: "Default (DM Sans)", stack: 'var(--font-body), "DM Sans", system-ui, sans-serif' },
  { key: "inter", label: "Inter", stack: 'var(--font-ui), "Inter", system-ui, sans-serif' },
  { key: "system", label: "System", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { key: "serif", label: "Serif", stack: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  { key: "mono", label: "Monospace", stack: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace' },
  { key: "rounded", label: "Rounded", stack: 'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", Quicksand, system-ui, sans-serif' },
];

export function fontStackFor(key?: string | null): string {
  return (FONT_OPTIONS.find((f) => f.key === key) ?? FONT_OPTIONS[0]).stack;
}

// Cookie that mirrors the institute's cosmetic branding so the owner route's
// server layout can render the right colors/font in the FIRST HTML — no flash of
// the default theme on refresh while the authenticated overview fetch is still
// in flight. It holds ONLY presentational fields (hex colors, a font-key, a logo
// URL), never a token; brandingStyle()/fontStackFor() sanitise every value
// downstream (hex regex + font-key whitelist), so even a tampered cookie cannot
// inject arbitrary CSS.
export const OWNER_BRANDING_COOKIE = "lms_owner_branding";

// Keep only the known string fields; drop anything else a client might send.
export function serializeBranding(b: OwnerBranding | null | undefined): string {
  if (!b) return "";
  return JSON.stringify({
    logo_url: b.logo_url ?? null,
    primary_color: b.primary_color ?? null,
    secondary_color: b.secondary_color ?? null,
    background_color: b.background_color ?? null,
    font_family: b.font_family ?? null,
    entity_label: b.entity_label ?? null,
    entity_label_plural: b.entity_label_plural ?? null,
  });
}

export function parseBrandingCookie(raw?: string | null): OwnerBranding | null {
  if (!raw) return null;
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    /* value wasn't percent-encoded — parse it as-is */
  }
  try {
    const o = JSON.parse(text) as Record<string, unknown>;
    if (!o || typeof o !== "object") return null;
    const pick = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : null);
    return {
      logo_url: pick("logo_url"),
      primary_color: pick("primary_color"),
      secondary_color: pick("secondary_color"),
      background_color: pick("background_color"),
      font_family: pick("font_family"),
      entity_label: pick("entity_label"),
      entity_label_plural: pick("entity_label_plural"),
    };
  } catch {
    return null;
  }
}

// A tiny companion cookie holding ONLY the academy's display name, so the owner
// server layout can render the correct browser-tab <title> in the first HTML —
// the same first-paint reasoning as the branding cookie, but the name is not a
// branding field (OwnerBranding has no `name`), so it rides in its own cookie.
// Written client-side once the authenticated overview resolves; read server-side
// in generateMetadata. Text-only, no secrets; length-capped so even a tampered
// cookie can't produce a runaway title. (Next escapes the title as text content,
// so there is no injection surface — the cap is just hygiene.)
export const OWNER_NAME_COOKIE = "lms_owner_name";

export function parseOwnerNameCookie(raw?: string | null): string | null {
  if (!raw) return null;
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    /* value wasn't percent-encoded — use it as-is */
  }
  text = text.trim();
  if (!text) return null;
  return text.length > 120 ? text.slice(0, 120) : text;
}

// The customer-facing entity noun for this academy, with a safe fallback for the
// loading/failure window (branding is null). Backend always resolves a concrete
// label once loaded ("Institute" for Jorsas, "Online Academy" otherwise, or the
// owner's override), so this fallback only shows for a frame before branding
// arrives — "Online Academy" is the product-wide default noun.
export function academyLabel(b?: OwnerBranding | null): { singular: string; plural: string } {
  const singular = (b?.entity_label && b.entity_label.trim()) || "Online Academy";
  const plural =
    (b?.entity_label_plural && b.entity_label_plural.trim()) ||
    (singular === "Online Academy" ? "Online Academies" : `${singular}s`);
  return { singular, plural };
}

const HEX = /^#[0-9a-fA-F]{6}$/;

// Build the inline style that rebrands everything inside a portal/public shell:
// override the theme's primary/secondary tokens and set the institute font.
// Stays NEUTRAL for null/loading branding (returns no fontFamily) so it never
// overrides the pre-painted `--brand-font` (:root, from the branding-init cache)
// or the site default while the branding fetch is still in flight — that
// override was the last remaining source of the font flash. When the institute
// picked a font we set both the inline fontFamily (this subtree) and
// `--brand-font` (so descendants reading the var stay consistent).
export function brandingStyle(b?: OwnerBranding | null): CSSProperties {
  const style: Record<string, string> = {};
  if (b?.primary_color && HEX.test(b.primary_color)) style["--color-primary"] = b.primary_color;
  if (b?.secondary_color && HEX.test(b.secondary_color)) style["--color-secondary"] = b.secondary_color;
  if (b?.font_family && b.font_family !== "default") {
    const stack = fontStackFor(b.font_family);
    style["--brand-font"] = stack;
    style.fontFamily = stack;
  }
  return style as CSSProperties;
}

// The storefront's ambient background. This is applied as a REAL `background`
// (not a CSS variable) on the /i/{slug} layout wrapper, because that wrapper is
// a descendant of `.site-shell`/`body` — the elements that actually paint the
// page background — and CSS variables only inherit downward, never back up to a
// painting ancestor. Returns `{}` when no custom color is set, so the standard
// theme glow (from `.site-shell`) shows through the transparent wrapper.
//
// The glow reuses the exact radial-gradient shape of the default theme (the
// "blue bill" at the top of the page) but tinted to the institute's chosen
// color, over the theme's own `--color-bg` base so light/dark still work. The
// 8-digit hex suffixes are alpha: `55` ≈ 0.33 opacity at the center, `00`
// fully transparent at the edge.
export function storefrontBackgroundStyle(b?: OwnerBranding | null): CSSProperties {
  const c = b?.background_color;
  if (!c || !HEX.test(c)) return {};
  return {
    background: `radial-gradient(circle at 50% 0%, ${c}55, ${c}00 42%), var(--color-bg)`,
    minHeight: "100dvh",
  };
}
