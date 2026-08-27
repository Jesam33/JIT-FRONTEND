"use client";

import { useState } from "react";

// A 5-point star (viewBox 0 0 24 24), filled with currentColor so the caller's
// text color drives it. Sized by the width/height classes passed in.
const STAR_PATH =
  "M12 .587l3.668 7.431 8.2 1.192-5.934 5.783 1.401 8.169L12 18.896l-7.335 3.866 1.401-8.169L.132 9.21l8.2-1.192z";

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`shrink-0 ${className ?? ""}`}>
      <path d={STAR_PATH} />
    </svg>
  );
}

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
} as const;

type StarRatingProps = {
  /**
   * The fill baseline out of 5. Read-only mode fills fractionally (e.g. 4.6);
   * interactive mode uses it (rounded) as the currently-selected rating.
   */
  value?: number;
  /** Rating count; rendered as "(N)" in read-only mode when provided. */
  count?: number;
  /** When given, the component is INTERACTIVE: clicking star n calls onRate(n). */
  onRate?: (n: number) => void;
  size?: keyof typeof SIZES;
  /** Read-only only: hide the "4.6 (N)" numeric label, render bare stars. */
  hideValue?: boolean;
  /** Interactive only: disable input (e.g. while a rating request is in flight). */
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
};

/**
 * Amber star rating, in two modes:
 *   - read-only  (no onRate)  — fractional-fill stars + "value.toFixed(1) (count)"
 *   - interactive (onRate set) — five clickable stars with hover/focus preview
 *
 * Stars are conventional amber (independent of the institute's brand color, which
 * would make a 3-star look "on-brand" rather than "meh"). Empty states (count 0 /
 * value 0) are the caller's call — this just renders what it's given.
 */
export default function StarRating({
  value = 0,
  count,
  onRate,
  size = "md",
  hideValue = false,
  disabled = false,
  className = "",
  labelClassName = "",
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = typeof onRate === "function" && !disabled;
  const starClass = SIZES[size];

  // ── Interactive: five buttons, filled up to hover ?? current rating. ──
  if (interactive) {
    const active = hover ?? Math.round(value);
    return (
      <div className={`inline-flex items-center gap-1 ${className}`} onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
            aria-pressed={Math.round(value) === n}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => onRate!(n)}
            className="rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
          >
            <Star className={`${starClass} ${n <= active ? "text-amber-400" : "text-site-text/25"}`} />
          </button>
        ))}
      </div>
    );
  }

  // ── Read-only: a muted base row with an amber overlay clipped to the % fill. ──
  const clamped = Math.max(0, Math.min(5, value));
  const pct = (clamped / 5) * 100;
  const label = count != null ? ` from ${count} rating${count === 1 ? "" : "s"}` : "";

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5${label}`}
    >
      <span className="relative inline-flex">
        <span className="inline-flex text-site-text/20">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={starClass} />
          ))}
        </span>
        <span
          className="absolute inset-0 inline-flex overflow-hidden text-amber-400"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={starClass} />
          ))}
        </span>
      </span>
      {!hideValue ? (
        <span className={`text-xs font-medium tabular-nums ${labelClassName}`}>
          <span className="text-amber-400">{clamped.toFixed(1)}</span>
          {count != null ? <span className="text-site-text/50"> ({count.toLocaleString()})</span> : null}
        </span>
      ) : null}
    </div>
  );
}
