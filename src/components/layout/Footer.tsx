"use client";

import Link from "next/link";
import { navLinks } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="py-14">
      <div className="container-wide space-y-9">
        <div className="grid gap-4 border-y border-site-border/30 py-8 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-site-text/60">Working Hours</p>
            <p className="mt-2 font-semibold">Mon - Sat: 8 am - 5 pm, Sunday: CLOSED</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-site-text/60">Email</p>
            <p className="mt-2 font-semibold">contact@jorsastech.com</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-site-text/60">WhatsApp Chat</p>
            <div className="mt-3 flex flex-col items-start gap-3">
              <a
                href="https://wa.me/2348034585459?text=Hello%20Jorsas%20Tech%2C%20I%27d%20like%20to%20make%20an%20enquiry."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-semibold transition hover:text-site-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                +234 803 458 5459
              </a>
              <a
                href="https://wa.me/447882144063?text=Hello%20Jorsas%20Tech%2C%20I%27d%20like%20to%20make%20an%20enquiry."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-semibold transition hover:text-site-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                +44 7882 144063
              </a>
            </div>
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
            <h4 className="mb-3 text-sm uppercase tracking-[0.2em] text-site-text/70">Quick Links</h4>
            <ul className="space-y-2 text-sm text-site-text/85">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="underline underline-offset-4 transition hover:text-site-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm uppercase tracking-[0.2em] text-site-text/70">Company</h4>
            <ul className="space-y-2 text-sm text-site-text/85">
              <li><Link href="/testimonials" className="underline underline-offset-4 transition hover:text-site-primary">Privacy Policy</Link></li>
              <li><Link href="/portfolio" className="underline underline-offset-4 transition hover:text-site-primary">Trademarks</Link></li>
              {/* <li><Link href="/portfolio">Cookies Policies</Link></li> */}
            </ul>
          </div>
        </div>

        <div className="border-t border-site-border/15 pt-6 text-sm text-site-text/70 md:flex md:items-center md:justify-between">
          <p>© 2026 Jorsas Tech. All right reserved.</p>
          {/* <p>Cookie Policy</p> */}
        </div>
      </div>
    </footer>
  );
}
