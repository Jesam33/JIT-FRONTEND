"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/content";

export default function Header() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

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
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-black/55 [html.light_&]:bg-site-bg/75 backdrop-blur-md">
        <div className="container-wide flex items-center justify-between gap-6 py-5 md:py-6">
          <Link href="/" className="inline-flex items-center" aria-label="Jorsas home">
            <img src="/images/jorsas-logo-white.png" alt="Jorsas" className="h-7 w-auto sm:h-9 [html.light_&]:hidden" />
            <img src="/images/jorsas-logo-light-mode.png" alt="Jorsas" className="hidden h-7 w-auto sm:h-9 [html.light_&]:block" />
          </Link>

          <nav className="hidden items-center gap-14 text-sm text-white lg:flex [html.light_&]:text-site-text">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={active ? "font-bold text-white [html.light_&]:text-site-text" : "text-white/75 transition hover:text-white [html.light_&]:text-site-text/75 [html.light_&]:hover:text-site-text"}
                >
                  {link.label}
                </Link>
              );
            })}
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

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 [html.light_&]:border-site-border/35 [html.light_&]:text-site-text [html.light_&]:hover:bg-site-text/10"
              >
                Create your Online Academy
              </Link>

              <Link
                href="/qoute"
                className="inline-flex items-center rounded-full bg-[#ed180d] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Request a Qoute
              </Link>

              <button
                type="button"
                aria-label="Open contact drawer"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/35 text-white transition hover:bg-white/10 [html.light_&]:border-site-border/35 [html.light_&]:text-site-text [html.light_&]:hover:bg-site-text/10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

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
              <span className="text-sm font-semibold tracking-wider uppercase" style={{ fontFamily: "var(--font-display)" }}>
                Menu
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
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-white/10 text-white [html.light_&]:bg-site-text/10 [html.light_&]:text-site-text"
                        : "text-white/70 hover:bg-white/5 hover:text-white [html.light_&]:text-site-text/70 [html.light_&]:hover:bg-site-text/5 [html.light_&]:hover:text-site-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto space-y-3 pt-6">
              <Link
                href="/signup"
                onClick={() => setMobileNavOpen(false)}
                className="flex w-full items-center justify-center rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 [html.light_&]:border-site-border/35 [html.light_&]:text-site-text [html.light_&]:hover:bg-site-text/10"
              >
                Create your Online Academy
              </Link>
              <Link
                href="/qoute"
                onClick={() => setMobileNavOpen(false)}
                className="flex w-full items-center justify-center rounded-full bg-[#ed180d] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Request a Qoute
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Contact & Socials drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close drawer backdrop"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/55"
          />
          <aside className="absolute right-0 top-0 h-full w-[min(360px,88vw)] border-l border-white/15 bg-[#0b0b0b] p-6 text-white shadow-2xl [html.light_&]:border-site-border/30 [html.light_&]:bg-site-surface [html.light_&]:text-site-text">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Contact & Socials
              </h3>
              <button
                type="button"
                aria-label="Close drawer"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 [html.light_&]:border-site-border/35 [html.light_&]:text-site-text"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/65 [html.light_&]:text-site-text/65">Email Address</p>
              <a href="mailto:contactus@jorsastech.com" className="block text-base font-medium text-white [html.light_&]:text-site-text">
                contactus@jorsastech.com
              </a>
            </div>

            <div className="mt-8">
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-white/65 [html.light_&]:text-site-text/65">Social Links</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Facebook", href: "https://www.facebook.com/", glyph: "f" },
                  { label: "Instagram", href: "https://www.instagram.com/", glyph: "◎" },
                  { label: "X (Twitter)", href: "https://www.x.com/", glyph: "x" },
                  { label: "YouTube", href: "https://www.youtube.com/", glyph: "▶" },
                  { label: "Pinterest", href: "https://www.pinterest.com/", glyph: "p" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold text-white transition hover:bg-white hover:text-black [html.light_&]:border-site-border/35 [html.light_&]:text-site-text [html.light_&]:hover:bg-site-text [html.light_&]:hover:text-site-bg"
                  >
                    {social.glyph}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}