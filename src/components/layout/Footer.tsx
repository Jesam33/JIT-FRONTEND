"use client";

import Link from "next/link";
import { navLinks } from "@/lib/content";

const WhatsAppIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#25D366]" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const whatsappNumbers = [
  { value: "+234 803 458 5459", href: "https://wa.me/2348034585459?text=Hello%20Jorsas%20Tech%2C%20I%27d%20like%20to%20make%20an%20enquiry." },
  { value: "+44 7882 144063", href: "https://wa.me/447882144063?text=Hello%20Jorsas%20Tech%2C%20I%27d%20like%20to%20make%20an%20enquiry." },
];

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>,
  },
  {
    label: "X (Twitter)",
    href: "https://www.x.com/",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  },
];

const colHeading = "text-[10px] font-semibold uppercase tracking-[0.25em] text-site-text/50";

/**
 * Editorial footer: no big wordmark, no closing statement (the landing CTA
 * section owns that). A quiet four-column band — brand, contact, explore,
 * company — over a baseline that echoes the hero headline in the serif.
 */
export default function Footer() {
  return (
    <footer className="global-marketing-footer border-t border-site-border/15">
      <div className="container-wide py-14">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.7fr_0.8fr] lg:gap-10">
          {/* Brand */}
          <div>
            <Link href="/" aria-label="Jorsas home" className="inline-flex items-center">
              <img src="/images/jorsas-logo-white.png" alt="Jorsas Tech" className="h-7 w-auto [html.light_&]:hidden" />
              <img src="/images/jorsas-logo-light-mode.png" alt="Jorsas Tech" className="hidden h-7 w-auto [html.light_&]:block" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-site-text/65">
              A team of experts across every strata of software development,
              giving your business the clear insight it needs to create an
              amazing future.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-site-border/35 text-site-text transition hover:border-site-primary hover:bg-site-primary hover:text-[#fff]"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <div>
              <p className={colHeading}>Email</p>
              <a
                href="mailto:contact@jorsastech.com"
                className="mt-2.5 inline-block text-sm font-medium transition hover:text-site-primary"
              >
                contact@jorsastech.com
              </a>
            </div>
            <div>
              <p className={colHeading}>WhatsApp</p>
              <div className="mt-2.5 space-y-2 space-x-2">
                {whatsappNumbers.map((wa) => (
                  <a
                    key={wa.value}
                    href={wa.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium transition hover:text-site-primary"
                  >
                    <WhatsAppIcon />
                    {wa.value}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className={colHeading}>Working hours</p>
              <p className="mt-2.5 text-sm font-medium">Mon - Sat: 8 am - 5 pm</p>
              <p className="mt-1 text-sm text-site-text/55">Sunday: Closed</p>
            </div>
          </div>

          {/* Explore */}
          <nav>
            <p className={colHeading}>Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-site-text/80 underline decoration-site-border/50 underline-offset-4 transition hover:text-site-primary hover:decoration-site-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <div>
            <p className={colHeading}>Company</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/policies?policy=privacy-policy" className="text-site-text/80 underline decoration-site-border/50 underline-offset-4 transition hover:text-site-primary hover:decoration-site-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies?policy=intellectual-property" className="text-site-text/80 underline decoration-site-border/50 underline-offset-4 transition hover:text-site-primary hover:decoration-site-primary">
                  Trademarks
                </Link>
              </li>
              <li>
                <Link href="/policies?policy=terms-and-conditions" className="text-site-text/80 underline decoration-site-border/50 underline-offset-4 transition hover:text-site-primary hover:decoration-site-primary">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Baseline */}
        <div className="mt-12 flex flex-col gap-3 border-t border-site-border/15 pt-7 text-xs text-site-text/55 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Jorsas Tech. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
