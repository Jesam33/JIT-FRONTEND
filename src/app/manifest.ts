import type { MetadataRoute } from "next";

// Web App Manifest, served by Next at /manifest.webmanifest and auto-linked into
// every page's <head>. This is what makes the site installable (Add to Home
// Screen on mobile, Install App on desktop) and defines how it looks once
// launched standalone. The service worker (public/sw.js, registered by
// ServiceWorkerRegister) supplies the offline fallback.
//
// Colors mirror the app shell: the product runs on a black ground with a red
// accent (globals.css --color-bg #000000, --color-primary #ed180d), so the
// splash screen and status bar stay on brand. Icons are a solid red tile with
// the white Jorsas mark (generated into public/icons), distinct from the small
// dark favicon by design: an app badge reads best as a filled brand tile.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Jorsas Tech",
    short_name: "Jorsas",
    description: "Jorsas Tech learning platform and digital engineering",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["education", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
