"use client";

// The Monthly / Yearly switch above the plan cards (billing page, signup,
// public pricing). Yearly carries the discount pill ("Save 20%").

import type { BillingCycle } from "@/lib/plans";

export default function CycleToggle({
  value,
  onChange,
  saveText,
}: {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  saveText?: string | null;
}) {
  const option = (cycle: BillingCycle, label: string) => {
    const on = value === cycle;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => onChange(cycle)}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-white/30 ${
          on ? "bg-white text-black" : "text-white/70 hover:text-white"
        }`}
      >
        {label}
        {cycle === "yearly" && saveText ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              on ? "bg-emerald-600 text-[#fff]" : "bg-emerald-500/15 text-emerald-300"
            }`}
          >
            {saveText}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1">
      {option("monthly", "Monthly")}
      {option("yearly", "Yearly")}
    </div>
  );
}
