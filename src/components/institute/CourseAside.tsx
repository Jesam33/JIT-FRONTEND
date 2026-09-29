"use client";

import { useCallback, useMemo, useState } from "react";
import CurrencySwitcher from "@/components/institute/CurrencySwitcher";
import { CourseModeContext, type LearningMode } from "@/components/institute/course-mode";
import { formatPrice } from "@/lib/currency";

// What the price panel needs from a course. Structural (not the page's
// DetailCourse) so this file and the page stay independent.
type PriceCourse = {
  price: number;
  display_currency?: string;
  price_display?: number;
  is_base_currency?: boolean;
  charge_currency?: string;
  prerecorded_price?: number | null;
  prerecorded_price_display?: number | null;
  original_price?: number | null;
  original_price_display?: number | null;
  is_live_available: boolean;
  is_prerecorded_available: boolean;
  billing_type?: "one_time" | "monthly";
};

// The price the chosen mode actually costs, in DISPLAY currency. Pre-recorded
// falls back to the live price when the course charges one price for both modes.
function priceFor(course: PriceCourse, mode: LearningMode): number {
  if (mode === "pre_recorded") {
    const pre = course.prerecorded_price_display ?? course.prerecorded_price ?? null;
    if (pre != null) return pre;
  }

  return course.price_display ?? course.price;
}

// The same price in the BASE currency, which is what the buyer is charged. The
// server re-derives the authoritative charge from learning_mode, so this only
// has to agree with it, never replace it.
function basePriceFor(course: PriceCourse, mode: LearningMode): number {
  if (mode === "pre_recorded" && course.prerecorded_price != null) {
    return course.prerecorded_price;
  }

  return course.price;
}

// The struck-through "was" price beside the headline, only when a real original
// was entered AND it beats what the chosen mode costs, compared in the same
// currency space. Checked against the CURRENT mode, so picking a cheaper
// pre-recorded price cannot leave a "was" figure that no longer describes it.
function originalPriceFor(course: PriceCourse, mode: LearningMode): string | null {
  if (course.price <= 0) return null;
  const orig = course.original_price_display ?? course.original_price ?? null;
  if (orig == null || !(orig > priceFor(course, mode))) return null;

  return formatPrice(orig, course.display_currency ?? "NGN");
}

// The price panel of a course page: the headline price, the struck "was" price,
// the charge note and the currency switcher, then whatever the caller passes in
// beneath them (capacity rows, then the register form or a closed/full notice).
//
// It is a client component because the headline FOLLOWS the delivery mode chosen
// in the register form below it: selecting Pre-recorded reprices the headline
// itself rather than printing a second "or X pre-recorded" line under it.
//
// `children` and `footer` are server-rendered elements handed straight through,
// so moving the price here did not make the rest of the page client-side.
export default function CourseAside({
  course,
  children,
  footer,
}: {
  course: PriceCourse;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [mode, setMode] = useState<LearningMode>("live");
  const setModeStable = useCallback((next: LearningMode) => setMode(next), []);
  const value = useMemo(() => ({ mode, setMode: setModeStable }), [mode, setModeStable]);

  const original = originalPriceFor(course, mode);
  // Only worth naming the mode when there IS a choice; on a single-mode course
  // the price can only mean one thing.
  const bothModes = course.is_live_available && course.is_prerecorded_available;
  const monthly = course.price > 0 && course.billing_type === "monthly";

  return (
    <CourseModeContext.Provider value={value}>
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {course.price <= 0 ? "Free" : formatPrice(priceFor(course, mode), course.display_currency ?? "NGN")}
          {monthly ? <span className="text-base font-medium text-white/60"> /month</span> : null}
        </p>
        {original ? <span className="text-lg text-white/40 line-through">{original}</span> : null}
        {bothModes ? (
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-wide text-white/60">
            {mode === "pre_recorded" ? "Pre-recorded" : "Live"}
          </span>
        ) : null}
      </div>

      {monthly ? (
        <p className="mt-1 text-xs text-white/60">
          Billed monthly. Pay each month to keep your access, and stop any time.
        </p>
      ) : null}

      {course.price > 0 && course.is_base_currency === false ? (
        <p className="mt-1 text-xs text-white/60">
          Approx. shown in {course.display_currency} · you&apos;ll be charged{" "}
          {course.charge_currency === "USD"
            ? "in USD"
            : formatPrice(basePriceFor(course, mode), "NGN")}
        </p>
      ) : null}

      {course.price > 0 ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
          <span>Show price in</span>
          <CurrencySwitcher active={course.display_currency ?? "NGN"} />
        </div>
      ) : null}

      {children}
      {footer}
    </CourseModeContext.Provider>
  );
}
