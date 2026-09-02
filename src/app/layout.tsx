import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import AppChrome from "@/components/layout/AppChrome";
import BrandingGuard from "@/components/BrandingGuard";
import TopProgressBar from "@/components/TopProgressBar";

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
  // Default browser-tab + search-result icon, driven through metadata (served from
  // public/) rather than the app/favicon.ico file convention. File-convention icons
  // have HIGHER priority than generateMetadata and are injected on EVERY route, so a
  // per-tenant page could never override them — that's why institute storefronts kept
  // showing the Jorsas favicon. As metadata, a deeper segment (e.g. /i/[slug])
  // REPLACES this icons key, so each institute's own logo becomes the sole favicon on
  // its page.
  //
  // Theme handling WITHOUT feeding Google the white mark:
  //   • icon.svg is theme-adaptive on its own (dark J on light, WHITE J on dark, via an
  //     internal prefers-color-scheme media query). Modern browser TABS use it, so tabs
  //     get the right mark in both themes with no plate.
  //   • Google/Bing and older clients ignore SVG and take a raster. EVERY raster we now
  //     expose is the dark-J mark (favicon.ico + the PNG fallback), so search can only
  //     ever show the dark J — which stays visible on Google's light circular SERP chip.
  //     The white PNG is NO LONGER a crawlable <link rel=icon>; it lives only inside
  //     icon.svg, where Google can't grab it. This kills the washed-out "white circle"
  //     that appeared when Google served the white mark on its own light chip.
  // All marks are transparent — no square plate. favicon.ico is a crisp multi-size
  // (16/32/48/64) dark-J, regenerated from jorsas-logo-light-mode.png.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico?v=4", sizes: "any" },
      { url: "/images/jorsas-logo-light-mode.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico?v=4",
    apple: "/images/jorsas-logo-light-mode.png",
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
                  var theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
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
                  // Only the /lms portals and /i institute mini-sites wear an
                  // institute palette; every other route is the primary Jorsas
                  // marketing site and must stay on the default theme, so a stale
                  // 'tenant' cookie can't bleed institute colors onto the landing
                  // page. Mirrors the branded-area check in AppChrome.tsx.
                  var path = location.pathname;
                  if (!(path.startsWith('/lms') || path === '/i' || path.startsWith('/i/'))) return;
                  var m = document.cookie.match(/(?:^|;\\s*)tenant=([^;]*)/);
                  var slug = (m && m[1]) ? decodeURIComponent(m[1]) : ${JSON.stringify(process.env.NEXT_PUBLIC_PRIMARY_TENANT_SLUG ?? "jorsas")};
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
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        {/* Organization structured data — the canonical signal Google uses to pick
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
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <BrandingGuard />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
