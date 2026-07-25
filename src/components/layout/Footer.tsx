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
            <div className="mt-5 flex gap-3">
              {[
                { 
                  label: "Facebook", href: "https://www.facebook.com/",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                },
                { 
                  label: "Instagram", href: "https://www.instagram.com/",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                },
                { 
                  label: "X (Twitter)", href: "https://www.x.com/",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                },
                { 
                  label: "YouTube", href: "https://www.youtube.com/",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                },
                { 
                  label: "Pinterest", href: "https://www.pinterest.com/",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.936 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" /></svg>
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-site-border/35 text-site-text transition hover:bg-site-text hover:text-site-bg"
                >
                  {social.icon}
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
