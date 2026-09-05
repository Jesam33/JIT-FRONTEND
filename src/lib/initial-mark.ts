// A generated favicon for a LOGO-LESS academy: the academy's initial drawn in
// white (or near-black on a very light brand color) on its brand color, returned
// as an SVG data URI. Used so a non-primary portal / storefront WITHOUT an
// uploaded logo shows its own mark instead of leaking the Jorsas "J".
//
// Consumers: DynamicFavicon (client, /lms portals), the /i/[slug] storefront
// generateMetadata (server), and — mirrored inline as vanilla JS — the
// `branding-init` pre-paint in app/layout.tsx. Keep those three in sync.
//
// Deliberately dependency-free (no React, no browser globals beyond the
// universally available encodeURIComponent) so it imports cleanly on both the
// server and the client.

const HEX6 = /^#[0-9a-fA-F]{6}$/;

// The single character to stamp: the first alphanumeric of the given text
// (academy name or slug), uppercased. Falls back to a neutral dot so the mark is
// never blank.
export function markInitial(text: string | null | undefined): string {
  const match = (text ?? "").match(/[a-zA-Z0-9]/);
  return match ? match[0].toUpperCase() : "•";
}

// White text unless the brand color is very light (luminance-weighted), then
// near-black — so the initial stays legible on any brand color.
function readableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#111111" : "#ffffff";
}

export function initialMarkDataUri(
  text: string | null | undefined,
  color: string | null | undefined,
): string {
  const fill = color && HEX6.test(color) ? color : "#ed180d";
  const initial = markInitial(text);
  const textColor = readableTextColor(fill);
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    `<rect width="64" height="64" rx="12" fill="${fill}"/>` +
    `<text x="32" y="32" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${initial}</text>` +
    "</svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
