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
  // All three marks are TRANSPARENT (no square plate) — the old opaque black square
  // is gone. Google's favicon crawler ignores `media`, so the first entry is the one
  // it uses: the light-mode (dark J) mark, which stays visible on Google's white SERP
  // chip. The two theme-aware entries below refine browser TABS via prefers-color-scheme
  // — white J on dark tabs, dark J on light. /favicon.ico is the same dark-J transparent
  // square, kept as the universal fallback for clients that fetch it by convention.
  icons: {
    icon: [
      { url: "/images/jorsas-logo-light-mode.png", type: "image/png" },
      { url: "/images/jorsas-logo-white.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/images/jorsas-logo-light-mode.png", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon.ico?v=3" },
    ],
    shortcut: "/favicon.ico?v=3",
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
