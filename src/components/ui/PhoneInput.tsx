"use client";

// A phone number field with a country code picker (flag + "+234"). The value
// handed back is the full international number, e.g. "+234 8012345678": the
// local number's leading 0 (how many countries write numbers at home) is
// dropped, since it isn't dialled after the country code.

import { DIAL_CODES, flagOf, dialFor } from "@/lib/dial-codes";

/** Split a stored value back into country + local number (best effort). */
function parse(value: string, fallbackIso: string): { iso: string; local: string } {
  const m = value.trim().match(/^\+(\d{1,4})\s*(.*)$/);
  if (m) {
    // Prefer the fallback country when it shares the code (e.g. +1 US/Canada).
    const fb = dialFor(fallbackIso);
    const hit = fb && fb.dial === m[1] ? fb : DIAL_CODES.find((d) => d.dial === m[1]);
    if (hit) return { iso: hit.iso, local: m[2] };
  }
  return { iso: fallbackIso, local: value };
}

function compose(iso: string, local: string): string {
  const dial = dialFor(iso)?.dial ?? "";
  const digits = local.replace(/[^\d]/g, "").replace(/^0+/, "");
  return digits ? `+${dial} ${digits}` : "";
}

export default function PhoneInput({
  value,
  onChange,
  country,
  onCountryChange,
  placeholder = "Phone number",
  required,
  className = "",
}: {
  value: string;
  onChange: (full: string) => void;
  /** The selected country (ISO code); owned by the parent so two fields can share a default. */
  country: string;
  onCountryChange: (iso: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const { local } = parse(value, country);
  const current = dialFor(country);

  return (
    <div className={`flex overflow-hidden rounded-lg border border-white/20 bg-black/30 focus-within:border-white/40 ${className}`}>
      {/* Closed it shows just "🇳🇬 +234"; the real (invisible) select on top
          opens the full list with country names. */}
      <div className="relative flex shrink-0 items-center gap-1 border-r border-white/15 px-2.5 text-white">
        <span aria-hidden="true">{current ? flagOf(current.iso) : "🌐"}</span>
        <span className="text-sm tabular-nums">+{current?.dial ?? ""}</span>
        <svg viewBox="0 0 24 24" className="h-3 w-3 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <select
          aria-label="Country code"
          value={country}
          onChange={(e) => {
            onCountryChange(e.target.value);
            onChange(compose(e.target.value, local));
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {DIAL_CODES.map((d) => (
            <option key={d.iso} value={d.iso}>
              {flagOf(d.iso)} {d.name} (+{d.dial})
            </option>
          ))}
        </select>
      </div>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        value={local.replace(/^\+\d+\s*/, "")}
        onChange={(e) => onChange(compose(country, e.target.value))}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-white placeholder-white/40 outline-none"
      />
    </div>
  );
}
