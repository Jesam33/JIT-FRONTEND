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
  title: "Jorsas Tech",
  description: "Jorsas Tech digital consulting and engineering",
  // Default browser-tab icon, driven through metadata (served from public/) rather
  // than the app/favicon.ico file convention. File-convention icons have HIGHER
  // priority than generateMetadata and are injected on EVERY route, so a per-tenant
  // page could never override them — that's why institute storefronts kept showing
  // the Jorsas favicon. As metadata, a deeper segment (e.g. /i/[slug]) REPLACES this
  // icons key, so each institute's own logo becomes the sole favicon on its page.
  icons: { icon: "/favicon.ico" },
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
