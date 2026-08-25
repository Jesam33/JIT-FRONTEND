import {
  hasContactInfo,
  whatsappHref,
  type InstituteProfile,
} from "@/lib/institute-profile";

// Contact + socials block for the institute mini-site, shared by the storefront
// and the course-detail page so both carry the same "get in touch" footer.
// Renders nothing when the institute has set no contact details or social links,
// and each row/link appears only when its value is present. Uses the site's own
// semantic tokens (site-*) so it reads consistently under any tenant branding.

type ContactRow = { icon: React.ReactNode; label: string; href: string | null };
type SocialLink = { icon: React.ReactNode; label: string; href: string };

export default function InstituteContactFooter({
  profile,
  instituteName,
}: {
  profile?: InstituteProfile | null;
  instituteName: string;
}) {
  if (!hasContactInfo(profile)) return null;

  const contact = profile?.contact ?? {};
  const socials = profile?.socials ?? {};
  const wa = whatsappHref(contact.whatsapp);

  const rows: ContactRow[] = [];
  if (contact.email) rows.push({ icon: <MailIcon />, label: contact.email, href: `mailto:${contact.email}` });
  if (contact.phone) rows.push({ icon: <PhoneIcon />, label: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, "")}` });
  if (wa) rows.push({ icon: <ChatIcon />, label: contact.whatsapp ?? "WhatsApp", href: wa });
  if (contact.address) rows.push({ icon: <PinIcon />, label: contact.address, href: null });

  const links: SocialLink[] = [];
  if (socials.website) links.push({ icon: <GlobeIcon />, label: "Website", href: socials.website });
  if (socials.facebook) links.push({ icon: <FacebookIcon />, label: "Facebook", href: socials.facebook });
  if (socials.instagram) links.push({ icon: <InstagramIcon />, label: "Instagram", href: socials.instagram });
  if (socials.twitter) links.push({ icon: <TwitterIcon />, label: "X (Twitter)", href: socials.twitter });
  if (socials.linkedin) links.push({ icon: <LinkedInIcon />, label: "LinkedIn", href: socials.linkedin });

  return (
    <section id="contact" className="section-pad border-t border-site-border/30">
      <div className="container-wide">
        <h2 className="text-2xl font-bold text-site-text" style={{ fontFamily: "var(--font-display)" }}>
          Get in touch
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-site-text/70">
          Have a question about a program at {instituteName}? Reach out through any of the channels below.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {rows.length > 0 ? (
            <ul className="space-y-4">
              {rows.map((row, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-site-border/30 bg-site-surface-soft text-site-text/70">
                    {row.icon}
                  </span>
                  {row.href ? (
                    <a
                      href={row.href}
                      target={row.href.startsWith("http") ? "_blank" : undefined}
                      rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="pt-1.5 text-sm text-site-text/85 transition hover:text-site-text"
                    >
                      {row.label}
                    </a>
                  ) : (
                    <span className="pt-1.5 text-sm text-site-text/85">{row.label}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {links.length > 0 ? (
            <div className={rows.length > 0 ? "md:justify-self-end" : ""}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-site-text/50">Follow us</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-site-border/30 bg-site-surface-soft text-site-text/75 transition hover:border-site-border/60 hover:bg-site-surface hover:text-site-text"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── icons (inline so the component has no dependency) ──────────────────────

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.2 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.53 8.6L23 22h-6.8l-5-6.55L5.42 22H2.3l8.05-9.2L1 2h6.97l4.52 5.98L18.9 2zm-1.2 18h1.68L7.36 3.72H5.56L17.7 20z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5A2.5 2.5 0 002.5 6a2.5 2.5 0 002.48 2.5A2.5 2.5 0 007.5 6 2.5 2.5 0 004.98 3.5zM3 9h4v12H3zM10 9h3.8v1.71h.05c.53-1 1.82-2.06 3.75-2.06 4.01 0 4.75 2.64 4.75 6.07V21h-4v-5.39c0-1.28-.02-2.94-1.79-2.94-1.79 0-2.06 1.4-2.06 2.85V21H10z" />
    </svg>
  );
}
