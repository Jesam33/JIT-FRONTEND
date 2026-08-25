"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { OwnerBranding } from "@/lib/owner-branding";

// The top navigation for a per-institute mini-site (/i/{slug} and its course
// pages). It deliberately mirrors the global site Header's visual language —
// sticky, blurred bar; the same theme toggle; the same rounded controls — but
// every link stays INSIDE the institute's own context (the logo and "Courses"
// go to the institute storefront, never back to jorsastech). This is what makes
// each institute read as its own "jorsastech.com"-style site rather than the
// primary marketing site with a course injected into it.
//
// Rendered by app/i/[slug]/layout.tsx, which wraps this subtree in
// brandingStyle(branding) — so `--color-primary`/`--color-secondary`/font are
// the institute's, and the logo below carries their identity.

type InstituteHeaderProps = {
  institute: { name: string; slug: string };
  branding: OwnerBranding;
  hrefBase: string; // "/i/{slug}" — the institute's home/storefront
  showContact?: boolean; // only offer the Contact anchor when a contact block exists
};

export default function InstituteHeader({ institute, branding, hrefBase, showContact = false }: InstituteHeaderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
  };

  // Where returning students sign in. With a wildcard domain this is the pretty
  // subdomain; otherwise a relative path with ?tenant= so the LMS login binds
  // the right institute (SetTenantFromQuery). Deterministic (no window) so it
  // renders identically on server and client — no hydration mismatch.
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  const studentLoginHref = appDomain
    ? `https://${institute.slug}.${appDomain}/lms/login`
    : `/lms/login?tenant=${encodeURIComponent(institute.slug)}`;

  const navLinks: { href: string; label: string }[] = [
    { href: hrefBase, label: "Courses" },
    ...(showContact ? [{ href: `${hrefBase}#contact`, label: "Contact" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-md [html.light_&]:border-site-border/30 [html.light_&]:bg-site-bg/80">
        <div className="container-wide flex items-center justify-between gap-6 py-5 md:py-6">
          <Link href={hrefBase} className="inline-flex items-center gap-3" aria-label={`${institute.name} home`}>
            {branding.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo_url} alt={institute.name} className="h-8 w-auto object-contain sm:h-10" />
            ) : (
              <span
                className="text-lg font-bold text-white [html.light_&]:text-site-text sm:text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {institute.name}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-12 text-sm text-white lg:flex [html.light_&]:text-site-text">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-white/75 transition hover:text-white [html.light_&]:text-site-text/75 [html.light_&]:hover:text-site-text"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 text-white transition hover:bg-white/10 [html.light_&]:border-site-border/35 [html.light_&]:text-site-text [html.light_&]:hover:bg-site-text/10"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>

            <Link
              href={studentLoginHref}
              className="hidden items-center rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 md:inline-flex [html.light_&]:border-site-border/35 [html.light_&]:text-site-text [html.light_&]:hover:bg-site-text/10"
            >
              Student Login
            </Link>

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-white transition hover:bg-white/10 lg:hidden [html.light_&]:border-site-border/35 [html.light_&]:text-site-text [html.light_&]:hover:bg-site-text/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/55"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(300px,80vw)] flex-col border-l border-white/15 bg-[#0b0b0b] p-6 text-white shadow-2xl [html.light_&]:border-site-border/30 [html.light_&]:bg-site-surface [html.light_&]:text-site-text">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
                {institute.name}
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 [html.light_&]:border-site-border/35 [html.light_&]:text-site-text"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white [html.light_&]:text-site-text/70 [html.light_&]:hover:bg-site-text/5 [html.light_&]:hover:text-site-text"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-6">
              <Link
                href={studentLoginHref}
                onClick={() => setMobileNavOpen(false)}
                className="flex w-full items-center justify-center rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 [html.light_&]:border-site-border/35 [html.light_&]:text-site-text [html.light_&]:hover:bg-site-text/10"
              >
                Student Login
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
