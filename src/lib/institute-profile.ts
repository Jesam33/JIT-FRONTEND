// An institute's public-page profile — the hero copy, contact details, and
// social links that turn its /i/{slug} storefront into a real mini-site rather
// than a bare course list. Stored server-side in tenant.settings.profile and
// returned (fully keyed) by the storefront + owner endpoints. Parallels
// owner-branding.ts. Every field is optional here because the apex fallback
// storefront renders with no profile at all.

export type InstituteContact = {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
};

export type InstituteSocials = {
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
};

export type InstituteProfile = {
  tagline?: string | null;
  about?: string | null;
  cover_url?: string | null;
  contact?: InstituteContact | null;
  socials?: InstituteSocials | null;
};

// Empty shape used to seed the owner editor's form state.
export const DEFAULT_PROFILE: InstituteProfile = {
  tagline: null,
  about: null,
  cover_url: null,
  contact: { email: null, phone: null, whatsapp: null, address: null },
  socials: { website: null, facebook: null, instagram: null, twitter: null, linkedin: null },
};

// True when there's at least one contact detail or social link worth rendering,
// so the storefront can omit the whole contact section when nothing is set.
export function hasContactInfo(p?: InstituteProfile | null): boolean {
  if (!p) return false;
  const c = p.contact ?? {};
  const s = p.socials ?? {};
  return Boolean(
    c.email || c.phone || c.whatsapp || c.address ||
      s.website || s.facebook || s.instagram || s.twitter || s.linkedin,
  );
}

// Turn a free-form WhatsApp number into a wa.me link (digits only). Returns null
// when there's nothing dial-able, so callers can skip rendering the link.
export function whatsappHref(num?: string | null): string | null {
  if (!num) return null;
  const digits = num.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}
