"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_API } from "@/lib/api";
import { getOwnerToken, ownerAuthHeaders } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";
import StorefrontPreview from "@/components/institute/StorefrontPreview";
import {
  academyLabel,
  DEFAULT_BRANDING,
  FONT_OPTIONS,
  fontStackFor,
  type OwnerBranding,
} from "@/lib/owner-branding";

const HEX = /^#[0-9a-fA-F]{6}$/;

// Let the shell (topbar/sidebar) re-apply branding immediately after a save.
function emitBranding(b: OwnerBranding) {
  window.dispatchEvent(new CustomEvent("owner-branding-updated", { detail: b }));
}

export default function BrandingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primary, setPrimary] = useState(DEFAULT_BRANDING.primary_color);
  const [secondary, setSecondary] = useState(DEFAULT_BRANDING.secondary_color);
  // null = use the standard theme glow; a hex = custom storefront background.
  const [background, setBackground] = useState<string | null>(DEFAULT_BRANDING.background_color);
  const [font, setFont] = useState(DEFAULT_BRANDING.font_family);
  const [instName, setInstName] = useState("");
  const [savingName, setSavingName] = useState(false);
  // Slug of this institute, for the live public-page preview (link + storefront).
  const [slug, setSlug] = useState<string | null>(null);
  // The customer-facing entity noun this academy calls itself ("Online Academy",
  // "Academy", "School", …). `entityLabel` is the editable field; `loadedLabel`
  // is the last-saved value used in THIS page's own copy — kept stable so the
  // surrounding wording doesn't shift under the owner while they type a new one.
  const [entityLabel, setEntityLabel] = useState("");
  const [loadedLabel, setLoadedLabel] = useState("Online Academy");
  const [savingLabel, setSavingLabel] = useState(false);

  // The branding exactly as the public page will apply it, assembled live from
  // the form state so the preview updates on every color/font/logo/bg change.
  const livePreviewBranding: OwnerBranding = useMemo(
    () => ({
      logo_url: logoUrl,
      primary_color: primary,
      secondary_color: secondary,
      background_color: background,
      font_family: font,
      // Preview the entity noun live too — once the storefront reads it, the
      // public-page preview names the entity exactly as the owner is typing it.
      entity_label: entityLabel.trim() || null,
    }),
    [logoUrl, primary, secondary, background, font, entityLabel],
  );

  const applyBranding = (b: OwnerBranding) => {
    setLogoUrl(b.logo_url ?? null);
    setPrimary(b.primary_color || DEFAULT_BRANDING.primary_color);
    setSecondary(b.secondary_color || DEFAULT_BRANDING.secondary_color);
    setBackground(b.background_color ?? null);
    setFont(b.font_family || DEFAULT_BRANDING.font_family);
  };

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace(tenantLoginPath("owner"));
      return;
    }
    fetch(OWNER_API.branding, { headers: ownerAuthHeaders() })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          router.replace(tenantLoginPath("owner"));
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((j) => {
        if (j?.branding) applyBranding(j.branding);
        if (typeof j?.name === "string") setInstName(j.name);
        const label = j?.branding?.entity_label;
        if (typeof label === "string" && label.trim()) {
          setEntityLabel(label);
          setLoadedLabel(label);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Slug for the live public-page preview (link + storefront fetch). Fire and
    // forget — the preview simply skips the storefront fetch until it arrives.
    fetch(OWNER_API.overview, { headers: ownerAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.tenant?.slug) setSlug(j.tenant.slug);
      })
      .catch(() => {});
  }, [router]);

  const saveColors = async () => {
    if (!HEX.test(primary) || !HEX.test(secondary)) {
      setMsg({ kind: "err", text: "Colors must be valid 6-digit hex values (e.g. #ed180d)." });
      return;
    }
    if (background !== null && !HEX.test(background)) {
      setMsg({ kind: "err", text: "Background must be a valid 6-digit hex value, or use the default." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const hasBg = background !== null && HEX.test(background);
      const res = await fetch(OWNER_API.brandingUpdate, {
        method: "POST",
        headers: { ...ownerAuthHeaders(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          primary_color: primary,
          secondary_color: secondary,
          font_family: font,
          // Send the hex when set; otherwise explicitly clear any stored value
          // (a skipped key would preserve it — mirrors remove_logo).
          ...(hasBg ? { background_color: background } : { remove_background: true }),
        }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ kind: "err", text: j?.message ?? "Could not save. Please try again." });
        return;
      }
      if (j?.branding) {
        applyBranding(j.branding);
        emitBranding(j.branding);
      }
      setMsg({ kind: "ok", text: "Branding saved." });
    } catch {
      setMsg({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const saveName = async () => {
    const name = instName.trim();
    if (name.length < 2) {
      setMsg({ kind: "err", text: `${loadedLabel} name must be at least 2 characters.` });
      return;
    }
    setSavingName(true);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.brandingUpdate, {
        method: "POST",
        headers: { ...ownerAuthHeaders(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ kind: "err", text: j?.message ?? `Could not save your ${loadedLabel} name.` });
        return;
      }
      if (typeof j?.name === "string") {
        setInstName(j.name);
        // Update the name shown in the sidebar/topbar without a reload.
        window.dispatchEvent(new CustomEvent("owner-identity-updated", { detail: { name: j.name } }));
      }
      setMsg({ kind: "ok", text: `${loadedLabel} name updated.` });
    } catch {
      setMsg({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setSavingName(false);
    }
  };

  // Persist the entity noun (what this academy calls itself). The backend derives
  // the plural (Str::plural) unless an override is stored, and re-resolves the
  // label for the primary institute — so we just send the singular the owner typed.
  const saveLabel = async () => {
    const label = entityLabel.trim();
    if (label.length < 2) {
      setMsg({ kind: "err", text: "Please enter what you call your organisation (at least 2 characters)." });
      return;
    }
    if (label.length > 40) {
      setMsg({ kind: "err", text: "Keep it short — 40 characters or fewer." });
      return;
    }
    setSavingLabel(true);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.brandingUpdate, {
        method: "POST",
        headers: { ...ownerAuthHeaders(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ entity_label: label }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ kind: "err", text: j?.message ?? "Could not save. Please try again." });
        return;
      }
      const saved = j?.branding?.entity_label;
      if (typeof saved === "string" && saved.trim()) {
        setEntityLabel(saved);
        setLoadedLabel(saved);
      }
      if (j?.branding) emitBranding(j.branding);
      setMsg({ kind: "ok", text: "Saved what you call your organisation." });
    } catch {
      setMsg({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setSavingLabel(false);
    }
  };

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(OWNER_API.brandingLogo, {
        method: "POST",
        headers: ownerAuthHeaders(), // do NOT set Content-Type — the browser adds the multipart boundary
        body: fd,
      });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ kind: "err", text: j?.message ?? "Upload failed. Use a PNG/JPG under 2MB." });
        return;
      }
      if (j?.branding) {
        applyBranding(j.branding);
        emitBranding(j.branding);
      }
      setMsg({ kind: "ok", text: "Logo updated." });
    } catch {
      setMsg({ kind: "err", text: "Network error while uploading." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeLogo = async () => {
    setUploading(true);
    setMsg(null);
    try {
      const res = await fetch(OWNER_API.brandingUpdate, {
        method: "POST",
        headers: { ...ownerAuthHeaders(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ remove_logo: true }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.branding) {
        applyBranding(j.branding);
        emitBranding(j.branding);
        setMsg({ kind: "ok", text: "Logo removed." });
      }
    } catch {
      setMsg({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setUploading(false);
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold text-white">Customization</h1>
        <p className="mt-1 text-sm text-site-muted">
          Make the portal yours — set your logo, brand colors, and font. Changes apply across your
          {" "}{loadedLabel}&apos;s admin area.
        </p>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Controls */}
        <div className="space-y-6">
          {/* What you call your organisation — the customer-facing entity noun */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-white">What you call your organisation</h2>
            <p className="mt-1 text-sm text-site-muted">
              The word used for your organisation across your public page, portals, and emails — for
              example “Academy”, “School”, “Institute”, or “Training Centre”. This is a label only; your
              web address and links never change.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={entityLabel}
                onChange={(e) => setEntityLabel(e.target.value)}
                placeholder="Online Academy"
                className={inputClass}
                maxLength={40}
              />
              <button
                type="button"
                onClick={saveLabel}
                disabled={savingLabel}
                className="shrink-0 rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {savingLabel ? "Saving..." : "Save label"}
              </button>
            </div>
            <p className="mt-3 text-xs text-site-muted">
              Preview:{" "}
              <span className="text-white/80">
                “About this {academyLabel({ entity_label: entityLabel.trim() || null }).singular}”
              </span>{" "}
              ·{" "}
              <span className="text-white/80">
                “Browse {academyLabel({ entity_label: entityLabel.trim() || null }).plural.toLowerCase()}”
              </span>
            </p>
          </section>

          {/* Organisation name */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-white">{loadedLabel} name</h2>
            <p className="mt-1 text-sm text-site-muted">
              The name shown across your portal and on your public page. Your web address (subdomain) stays the same.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder={`Your ${loadedLabel.toLowerCase()} name`}
                className={inputClass}
                maxLength={255}
              />
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                className="shrink-0 rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {savingName ? "Saving..." : "Save name"}
              </button>
            </div>
          </section>

          {/* Logo */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-white">Logo</h2>
            <p className="mt-1 text-sm text-site-muted">
              Shown in your admin topbar and sidebar, and used as your site&apos;s browser-tab icon
              (favicon) across your portal and public page. PNG or JPG, up to 2MB — a square image works best and is shown as a circle.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={`${loadedLabel} logo`} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-white/40">No logo</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-full bg-site-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    disabled={uploading}
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickLogo} className="hidden" />
            </div>
          </section>

          {/* Colors */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-white">Brand colors</h2>
            <p className="mt-1 text-sm text-site-muted">Primary drives buttons and highlights; secondary is used for accents.</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <ColorField label="Primary" value={primary} onChange={setPrimary} inputClass={inputClass} />
              <ColorField label="Secondary" value={secondary} onChange={setSecondary} inputClass={inputClass} />
            </div>
          </section>

          {/* Public page background */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-white">Public page background</h2>
            <p className="mt-1 text-sm text-site-muted">
              The ambient glow behind your {loadedLabel}&apos;s public storefront. Leave it on the standard theme,
              or tint it to your brand.
            </p>
            {background === null ? (
              <button
                type="button"
                onClick={() => setBackground(HEX.test(secondary) ? secondary : DEFAULT_BRANDING.secondary_color)}
                className="mt-4 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Set a custom background
              </button>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-5 sm:grid-cols-2">
                  <ColorField label="Background" value={background} onChange={setBackground} inputClass={inputClass} />
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">Preview</label>
                    <div
                      className="h-11 w-full rounded-lg border border-white/15"
                      style={{
                        background: HEX.test(background)
                          ? `radial-gradient(circle at 50% 0%, ${background}55, ${background}00 70%), #000`
                          : "#000",
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBackground(null)}
                  className="text-sm font-semibold text-white/60 underline transition hover:text-white/90"
                >
                  Use default theme
                </button>
              </div>
            )}
          </section>

          {/* Font */}
          <section className={cardClass}>
            <h2 className="text-lg font-semibold text-white">Font</h2>
            <p className="mt-1 text-sm text-site-muted">Applied across your admin area.</p>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className={`${inputClass} mt-4 max-w-xs`}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.key} value={f.key} className="bg-[#0b0b0b] text-white">
                  {f.label}
                </option>
              ))}
            </select>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveColors}
              disabled={saving}
              className="rounded-full bg-site-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className={`${cardClass} h-fit`} style={{ fontFamily: fontStackFor(font) }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Live preview</p>
          <div className="mt-4 flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" className="h-10 w-10 rounded-full object-contain ring-1 ring-white/20" />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-1 ring-white/20"
                style={{ backgroundColor: HEX.test(primary) ? primary : DEFAULT_BRANDING.primary_color }}
              >
                In
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-white">{instName || `Your ${loadedLabel}`}</p>
              <p className="text-xs text-white/55">Sample heading</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/75">
            This is how your body text will read in the selected font. Buttons and highlights use your brand colors.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: HEX.test(primary) ? primary : DEFAULT_BRANDING.primary_color }}
            >
              Primary action
            </button>
            <button
              type="button"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: HEX.test(secondary) ? secondary : DEFAULT_BRANDING.secondary_color }}
            >
              Secondary
            </button>
          </div>
        </div>
      </div>

      {/* Full public-page preview — the actual /i/{slug} storefront, live. The
          compact swatch above is a quick reference; this shows the real page. */}
      <section className="space-y-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Your public page</h2>
          <p className="mt-1 text-sm text-site-muted">
            A live preview of your {loadedLabel}&apos;s public page. Your logo, colors, font, and background update as
            you edit above — tap Save changes to publish them.
          </p>
        </div>
        <StorefrontPreview slug={slug} instituteName={instName} brandingOverride={livePreviewBranding} />
      </section>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  inputClass,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={HEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-white/15 bg-transparent p-1"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ed180d"
          className={inputClass}
        />
      </div>
    </div>
  );
}
