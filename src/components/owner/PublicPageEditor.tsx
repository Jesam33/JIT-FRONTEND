"use client";

// The "Public page" editor — cover image, intro (tagline + about), contact
// details, and social links, with a live StorefrontPreview of the real
// /i/{slug} mini-site. Extracted from the old standalone /lms/admin/profile
// page so it can live as a tab inside Customisation (page title/description are
// now owned by the tab host, so this component renders only the editor body).

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { getOwnerToken, ownerAuthHeaders, readOwnerBranding } from "@/lib/owner-client";
import { academyLabel, type OwnerBranding } from "@/lib/owner-branding";
import { type InstituteProfile } from "@/lib/institute-profile";
import StorefrontPreview from "@/components/institute/StorefrontPreview";

// Normalise a value coming back from the API (null/undefined) into a controlled
// input's string, and vice-versa on save (empty string → the backend maps to
// null). Keeps every field a controlled component.
const s = (v: string | null | undefined): string => v ?? "";

// Social fields are validated as URLs server-side. Owners routinely type
// "facebook.com/acme" without a scheme, so prefix https:// before saving to
// avoid a confusing validation error. Left blank stays blank.
function withScheme(url: string): string {
  const t = url.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

type Contact = { email: string; phone: string; whatsapp: string; address: string };
type Socials = { website: string; facebook: string; instagram: string; twitter: string; linkedin: string };

export default function PublicPageEditor() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [slug, setSlug] = useState<string | null>(null);
  const [branding, setBranding] = useState<OwnerBranding | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [contact, setContact] = useState<Contact>({ email: "", phone: "", whatsapp: "", address: "" });
  const [socials, setSocials] = useState<Socials>({
    website: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
  });

  const applyProfile = (p: InstituteProfile) => {
    setCoverUrl(p.cover_url ?? null);
    setTagline(s(p.tagline));
    setAbout(s(p.about));
    setContact({
      email: s(p.contact?.email),
      phone: s(p.contact?.phone),
      whatsapp: s(p.contact?.whatsapp),
      address: s(p.contact?.address),
    });
    setSocials({
      website: s(p.socials?.website),
      facebook: s(p.socials?.facebook),
      instagram: s(p.socials?.instagram),
      twitter: s(p.socials?.twitter),
      linkedin: s(p.socials?.linkedin),
    });
  };

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace("/lms/admin/login");
      return;
    }
    // Load the profile (form data) and the overview (only for the tenant slug, so
    // we can link to the live public page) in parallel.
    Promise.all([
      fetch(OWNER_API.profile, { headers: ownerAuthHeaders() })
        .then((r) => {
          if (r.status === 401 || r.status === 403) {
            router.replace("/lms/admin/login");
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .then((j) => {
          if (j?.profile) applyProfile(j.profile);
        })
        .catch(() => {}),
      fetch(OWNER_API.overview, { headers: ownerAuthHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j?.tenant?.slug) setSlug(j.tenant.slug);
          if (j?.branding) setBranding(j.branding);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [router]);

  // This academy's configurable noun (Jorsas → "Institute", others → their own
  // label). From the loaded overview branding, with the shell cookie as a
  // synchronous fallback so copy reads correctly before the fetch resolves.
  const label = academyLabel(branding ?? readOwnerBranding()).singular;

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.profileUpdate, {
        method: "POST",
        headers: { ...ownerAuthHeaders(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          tagline,
          about,
          contact,
          socials: {
            website: withScheme(socials.website),
            facebook: withScheme(socials.facebook),
            instagram: withScheme(socials.instagram),
            twitter: withScheme(socials.twitter),
            linkedin: withScheme(socials.linkedin),
          },
        }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        // Surface the first validation message if present.
        const firstErr = j?.errors ? (Object.values(j.errors)[0] as string[])?.[0] : null;
        setMsg({ kind: "err", text: firstErr ?? j?.message ?? "Could not save. Please try again." });
        return;
      }
      if (j?.profile) applyProfile(j.profile);
      setMsg({ kind: "ok", text: "Public page saved." });
    } catch {
      setMsg({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const onPickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(OWNER_API.profileCover, {
        method: "POST",
        headers: ownerAuthHeaders(), // no Content-Type — the browser sets the multipart boundary
        body: fd,
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/lms/admin/login");
        return;
      }
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ kind: "err", text: j?.message ?? "Upload failed. Use a PNG/JPG under 4MB." });
        return;
      }
      if (j?.profile) applyProfile(j.profile);
      setMsg({ kind: "ok", text: "Cover image updated." });
    } catch {
      setMsg({ kind: "err", text: "Network error while uploading." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeCover = async () => {
    setUploading(true);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.profileUpdate, {
        method: "POST",
        headers: { ...ownerAuthHeaders(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ remove_cover: true }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.profile) {
        applyProfile(j.profile);
        setMsg({ kind: "ok", text: "Cover image removed." });
      }
    } catch {
      setMsg({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  // The profile exactly as it will look on the public page, built live from the
  // form state so the preview reflects every keystroke/cover change before Save.
  // socials get withScheme() so preview links match what gets stored.
  const livePreviewProfile: InstituteProfile = useMemo(
    () => ({
      tagline: tagline || null,
      about: about || null,
      cover_url: coverUrl,
      contact: {
        email: contact.email || null,
        phone: contact.phone || null,
        whatsapp: contact.whatsapp || null,
        address: contact.address || null,
      },
      socials: {
        website: withScheme(socials.website) || null,
        facebook: withScheme(socials.facebook) || null,
        instagram: withScheme(socials.instagram) || null,
        twitter: withScheme(socials.twitter) || null,
        linkedin: withScheme(socials.linkedin) || null,
      },
    }),
    [tagline, about, coverUrl, contact, socials],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
        <div className="h-64 animate-pulse rounded-[20px] bg-white/[0.04]" />
      </div>
    );
  }

  const cardClass = "rounded-[20px] border border-white/20 bg-white/[0.04] p-6";
  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:bg-white/10";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-site-muted">
          The mini-site prospective students see before they enrol: your cover image, a short intro, and how to
          reach you. Leave anything blank to hide it.
        </p>
        {slug ? (
          <a
            href={`/i/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          >
            View public page ↗
          </a>
        ) : null}
      </div>

      {msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            msg.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Editor on the left, a live preview of the real public page on the right
          (stacks on smaller screens). The preview reflects unsaved edits. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(400px,520px)] xl:items-start">
        {/* Editor column */}
        <div className="space-y-6">

      {/* Cover image */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-white">Cover image</h2>
        <p className="mt-1 text-sm text-site-muted">The banner across the top of your public page. PNG or JPG, up to 4MB. Wide images (e.g. 1600×500) look best.</p>
        <div className="mt-4">
          <div className="flex aspect-[16/6] w-full items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-white/40">No cover image</span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : coverUrl ? "Replace cover" : "Upload cover"}
            </button>
            {coverUrl && (
              <button
                type="button"
                onClick={removeCover}
                disabled={uploading}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickCover} className="hidden" />
        </div>
      </section>

      {/* Hero text */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-white">Introduction</h2>
        <p className="mt-1 text-sm text-site-muted">A short tagline and an about paragraph shown in your page hero.</p>
        <div className="mt-4 space-y-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Tagline</label>
              <span className="text-[11px] text-white/35">{tagline.length}/160</span>
            </div>
            <input
              type="text"
              value={tagline}
              maxLength={160}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Practical tech training for the next generation"
              className={inputClass}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/50">About</label>
              <span className="text-[11px] text-white/35">{about.length}/5000</span>
            </div>
            <textarea
              value={about}
              maxLength={5000}
              onChange={(e) => setAbout(e.target.value)}
              rows={5}
              placeholder={`Tell prospective students who you are, what you teach, and what makes your ${label} different.`}
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-white">Contact details</h2>
        <p className="mt-1 text-sm text-site-muted">Ways for prospective students to reach you. Each appears only if filled.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Email" inputClass={inputClass} type="email" value={contact.email} placeholder="hello@yourdomain.com" onChange={(v) => setContact({ ...contact, email: v })} />
          <Field label="Phone" inputClass={inputClass} value={contact.phone} placeholder="+234 800 000 0000" onChange={(v) => setContact({ ...contact, phone: v })} />
          <Field label="WhatsApp" inputClass={inputClass} value={contact.whatsapp} placeholder="+234 800 000 0000" onChange={(v) => setContact({ ...contact, whatsapp: v })} />
          <Field label="Address" inputClass={inputClass} value={contact.address} placeholder="Street, city, state" onChange={(v) => setContact({ ...contact, address: v })} />
        </div>
      </section>

      {/* Socials */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-white">Social links</h2>
        <p className="mt-1 text-sm text-site-muted">Full links, e.g. https://facebook.com/yourpage. We&apos;ll add https:// if you forget.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Website" inputClass={inputClass} value={socials.website} placeholder="https://yourwebsite.com" onChange={(v) => setSocials({ ...socials, website: v })} />
          <Field label="Facebook" inputClass={inputClass} value={socials.facebook} placeholder="https://facebook.com/..." onChange={(v) => setSocials({ ...socials, facebook: v })} />
          <Field label="Instagram" inputClass={inputClass} value={socials.instagram} placeholder="https://instagram.com/..." onChange={(v) => setSocials({ ...socials, instagram: v })} />
          <Field label="X (Twitter)" inputClass={inputClass} value={socials.twitter} placeholder="https://x.com/..." onChange={(v) => setSocials({ ...socials, twitter: v })} />
          <Field label="LinkedIn" inputClass={inputClass} value={socials.linkedin} placeholder="https://linkedin.com/company/..." onChange={(v) => setSocials({ ...socials, linkedin: v })} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
        </div>

        {/* Live public-page preview — mirrors /i/{slug}, updates as you edit */}
        <div className="space-y-2 xl:sticky xl:top-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Live preview</p>
          <StorefrontPreview slug={slug} profileOverride={livePreviewProfile} />
          <p className="text-[11px] text-white/40">
            This is your live public page. Your edits show here instantly; tap Save to publish them.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputClass,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}
