"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-14">
      <div className="container-wide space-y-9">
        <div className="grid gap-4 border-y border-site-border/30 py-8 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-site-text/60">Location</p>
            <p className="mt-2 font-semibold">Mon - Sat: 8 am - 5 pm, Sunday: CLOSED</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-site-text/60">Email</p>
            <p className="mt-2 font-semibold">contactus@jorsas.com</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-site-text/60">Phone</p>
            <p className="mt-2 font-semibold">Jorsas Tech</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.7fr_0.8fr]">
          <div>
            <h3 className="mb-3 text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Jorsas Tech
            </h3>
            <p className="max-w-sm text-sm text-site-text/70">
              We have a team of experts across different strata of Software Development and would provide you with the clear insight your business needs to create an amazing future.
            </p>
            <div className="mt-5 flex gap-3 text-sm text-site-text/80">
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-site-border/35 text-sm font-semibold text-site-text transition hover:bg-site-text hover:text-site-bg"
                >
                  {social.glyph}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm uppercase tracking-[0.2em] text-site-text/70">Company</h4>
            <ul className="space-y-2 text-sm text-site-text/85">
              <li><Link href="/testimonials">Testimonials</Link></li>
              <li><Link href="/portfolio">Our Portfolio</Link></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-site-border/25 p-4">
            <p className="text-sm text-site-text/70">Our Newsletters: Signup to our newsletters</p>
            <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <div className="flex items-center rounded-full border border-site-border/35 bg-site-surface-soft px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-site-text/65" aria-hidden="true">
                  <path d="M4 6H20V18H4V6Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M4 7L12 13L20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-transparent px-3 py-3 text-sm text-site-text placeholder:text-site-text/55 outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ed180d] text-white"
                  aria-label="Subscribe"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 6L18 12L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-site-border/15 pt-6 text-sm text-site-text/70 md:flex md:items-center md:justify-between">
          <p>© 2026 Jorsas Tech. All right reserved.</p>
          <p>Cookie Policy</p>
        </div>
      </div>
    </footer>
  );
}
