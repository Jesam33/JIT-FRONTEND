import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import AppChrome from "@/components/layout/AppChrome";
import BrandingGuard from "@/components/BrandingGuard";
import TopProgressBar from "@/components/TopProgressBar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jorsastech.com"),
  title: "Jorsas Tech",
  description: "Jorsas Tech digital consulting and engineering",
  applicationName: "Jorsas Tech",
  // Installed-app (PWA) presentation on iOS: open standalone (no Safari chrome)
  // when added to the Home Screen, with a translucent status bar over the black
  // app ground. The manifest (src/app/manifest.ts) covers Android and desktop.
  appleWebApp: {
    capable: true,
    title: "Jorsas Tech",
    statusBarStyle: "black-translucent",
  },
  // Default browser-tab + search-result icon, driven through metadata (served from
  // public/) rather than the app/favicon.ico file convention. File-convention icons
  // have HIGHER priority than generateMetadata and are injected on EVERY route, so a
  // per-tenant page could never override them, that's why institute storefronts kept
  // showing the Jorsas favicon. As metadata, a deeper segment (e.g. /i/[slug])
  // REPLACES this icons key, so each institute's own logo becomes the sole favicon on
  // its page.
  //
  // ONE mark for every surface, no theme switching. icon.svg, favicon.ico and the PNG
  // fallback are ALL the same transparent dark "J", we deliberately DON'T ship a
  // white/dark-mode variant. Google draws the SERP favicon on a WHITE circle no matter
  // the searcher's theme, but its crawler runs in dark mode, so a theme-adaptive SVG
  // handed it the white "J": the mark vanished on the white chip and only the red accent
  // survived, the "white circle with a red dot" bug. A single dark "J" stays visible on
  // Google's light chip and on light browser tabs; on a dark tab it's a touch quieter but
  // always legible (the red accent anchors it). All marks are transparent, no plate.
  // favicon.ico is a crisp multi-size (16/32/48/64) dark-J.
  icons: {
    icon: [
      { url: "/icon.svg?v=5", type: "image/svg+xml" },
      { url: "/favicon.ico?v=5", sizes: "any" },
      { url: "/images/jorsas-logo-light-mode.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico?v=5",
    // Home Screen icon on iOS. iOS paints a transparent PNG onto a black tile,
    // which would hide the dark favicon mark, so this is a dedicated opaque
    // brand tile (red ground, white mark) generated into public/icons.
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Jorsas Tech",
    title: "Jorsas Tech",
    description: "Jorsas Tech digital consulting and engineering",
    url: "https://jorsastech.com",
    images: [{ url: "/images/jorsas-logo-light-mode.png" }],
  },
};

export const viewport: Viewport = {
  // Browser UI tint (mobile address bar, task switcher) and PWA splash. Matches
  // the black app ground; the product runs in dark mode.
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Light mode is temporarily disabled while it is being finished:
                  // force dark on every load regardless of any previously saved
                  // preference, so a visitor who once switched to light is not
                  // stranded there with the toggle now hidden. Restore the
                  // stored-theme read (and the toggle buttons) to bring it back.
                  document.documentElement.classList.remove('light');
                } catch (e) {}
              })()
            `,
          }}
        />
        <Script
          id="branding-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Tenant-subdomain detection, mirroring lib/tenant-subdomain.ts
                  // (raw JS here, before hydration, so it cannot import it).
                  // On {academy}.domain the middleware rewrites the root to
                  // /i/{slug} while the browser URL stays "/", so pathname alone
                  // can't recognise the branded area — the HOST is the signal.
                  var host = location.hostname.split(':')[0];
                  var sub = null;
                  var APP_DOMAIN = ${JSON.stringify(process.env.NEXT_PUBLIC_APP_DOMAIN ?? "")};
                  var RESERVED = ["www","api","app","admin","mail","smtp","ftp","static","assets","cdn","img","images","media","dashboard","billing","signup","login","onboarding","support","help","docs","blog","status","default"];
                  if (!/^\\d{1,3}(\\.\\d{1,3}){3}$/.test(host)) {
                    if (APP_DOMAIN) {
                      if (host !== APP_DOMAIN && host !== 'www.' + APP_DOMAIN && host.endsWith('.' + APP_DOMAIN)) {
                        var pfx = host.slice(0, -(APP_DOMAIN.length + 1));
                        sub = (pfx && pfx.indexOf('.') === -1) ? pfx : null;
                      }
                    } else {
                      var parts = host.split('.');
                      if (parts.length >= 3) sub = parts[0];
                      else if (parts.length === 2 && host.endsWith('.localhost')) sub = parts[0];
                    }
                    if (sub && RESERVED.indexOf(sub.toLowerCase()) !== -1) sub = null;
                  }
                  if (sub) {
                    // The whole origin is this academy's mini-site: hide the
                    // Jorsas marketing chrome BEFORE first paint (globals.css
                    // gates on this attribute; AppChrome drops the chrome from
                    // the DOM after mount).
                    document.documentElement.setAttribute('data-tenant-subdomain', sub);
                  }

                  // Only the /lms portals and /i institute mini-sites wear an
                  // institute palette; every other route is the primary Jorsas
                  // marketing site and must stay on the default theme, so a stale
                  // 'tenant' cookie can't bleed institute colors onto the landing
                  // page. Mirrors the branded-area check in AppChrome.tsx.
                  var path = location.pathname;
                  if (!(sub || path.startsWith('/lms') || path === '/i' || path.startsWith('/i/'))) return;
                  var PRIMARY = ${JSON.stringify(process.env.NEXT_PUBLIC_PRIMARY_TENANT_SLUG ?? "jorsas")};
                  var m = document.cookie.match(/(?:^|;\\s*)tenant=([^;]*)/);
                  var slug = (m && m[1]) ? decodeURIComponent(m[1]) : PRIMARY;
                  var raw = localStorage.getItem('lms_branding:' + slug);
                  if (!raw) return;
                  var b = JSON.parse(raw);
                  var root = document.documentElement;
                  var hex = /^#[0-9a-fA-F]{6}$/;
                  if (b.primary_color && hex.test(b.primary_color)) root.style.setProperty('--color-primary', b.primary_color);
                  if (b.secondary_color && hex.test(b.secondary_color)) root.style.setProperty('--color-secondary', b.secondary_color);
                  if (b.font_stack) root.style.setProperty('--brand-font', b.font_stack);
                  if (b.primary_color && b.primary_color.toLowerCase() !== '#ed180d') root.setAttribute('data-branded', '');
                  if (b.logo_url) {
                    var link = document.createElement('link');
                    link.rel = 'icon';
                    link.setAttribute('data-brand-favicon', '');
                    link.href = b.logo_url;
                    document.head.appendChild(link);
                  } else if (slug && slug !== PRIMARY) {
                    // Logo-less NON-primary academy: draw a generated initial mark
                    // on its brand color so the tab never shows the Jorsas "J".
                    // Mirrors initialMarkDataUri() in lib/initial-mark.ts.
                    var mk = (slug.match(/[a-zA-Z0-9]/) || ['•'])[0].toUpperCase();
                    var col = (b.primary_color && hex.test(b.primary_color)) ? b.primary_color : '#ed180d';
                    var rr = parseInt(col.slice(1,3),16), gg = parseInt(col.slice(3,5),16), bb = parseInt(col.slice(5,7),16);
                    var tc = (0.299*rr + 0.587*gg + 0.114*bb) > 160 ? '#111111' : '#ffffff';
                    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
                      + '<rect width="64" height="64" rx="12" fill="' + col + '"/>'
                      + '<text x="32" y="32" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700" fill="' + tc + '" text-anchor="middle" dominant-baseline="central">' + mk + '</text>'
                      + '</svg>';
                    var link2 = document.createElement('link');
                    link2.rel = 'icon';
                    link2.setAttribute('data-brand-favicon', '');
                    link2.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
                    document.head.appendChild(link2);
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        {/* Organization structured data, the canonical signal Google uses to pick
            the logo it shows for the site (Knowledge Panel / rich results). Points at
            the correct brand mark so search stops surfacing the old favicon. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Jorsas Tech",
              url: "https://jorsastech.com",
              logo: "https://jorsastech.com/images/jorsas-logo-light-mode.png",
            }),
          }}
        />
      </head>
      <body className="min-h-full bg-site-bg text-site-text">
        <ServiceWorkerRegister />
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <BrandingGuard />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
