"use client";

import { useState } from "react";
import { PUBLIC_API } from "@/lib/api";
import { tenantHeaders } from "@/lib/tenant-client";
import { formatPrice, readCookie } from "@/lib/currency";
import { academyLabel, type OwnerBranding } from "@/lib/owner-branding";

type CourseDetail = {
  id: number;
  slug: string;
  title: string;
  price: number;
  // Localized display fields + the purchasable gate (optional; defaults keep
  // the apex/NGN flow byte-for-byte unchanged when they're absent).
  price_display?: number;
  display_currency?: string;
  is_base_currency?: boolean;
  charge_currency?: string;
  purchasable?: boolean;
  // Delivery modes the academy's plan actually offers. Pre-recorded is a paid
  // feature, so a Free academy sends false and the radio below is disabled.
  is_live_available?: boolean;
  is_prerecorded_available?: boolean;
};

const qualifications = [
  "SSCE / WAEC / NECO",
  "GCE / O-Level",
  "ND / OND",
  "NCE",
  "HND",
  "Bachelor's Degree (B.Sc / B.A / B.Ed)",
  "Postgraduate Diploma (PGD)",
  "Master's Degree (M.Sc / M.A / M.Ed)",
  "Doctorate (PhD)",
  "Professional Certification",
  "Others",
];

type FormData = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  qualification_level: string;
  phone_number: string;
  email: string;
  whatsapp: string;
  learning_mode: "live" | "pre_recorded";
  referral_code: string;
};

const initialForm: FormData = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  qualification_level: "",
  phone_number: "",
  email: "",
  whatsapp: "",
  learning_mode: "live",
  referral_code: "",
};

// `slug` is the institute's tenant slug. When present it is sent as
// `institute_slug` so the backend binds THIS institute as the tenant before
// creating the registration — essential on /i/{slug} storefronts, which carry
// no tenant cookie (the page was server-rendered). Absent → backend falls back
// to the header/primary tenant, preserving the apex flow's behaviour.
// `branding` threads this academy's configurable noun into visitor-facing copy.
export default function CourseRegisterClient({
  course,
  slug,
  branding,
}: {
  course: CourseDetail;
  slug?: string;
  branding?: OwnerBranding | null;
}) {
  const label = academyLabel(branding).singular;
  // Pre-recorded is a paid feature; the backend only sets this true when the
  // academy's plan unlocks it. Defaults true when absent so the apex/NGN flow
  // (which doesn't send the flag) keeps both modes.
  const preRecordedAvailable = course.is_prerecorded_available !== false;
  const [form, setForm] = useState<FormData>(initialForm);
  const [step, setStep] = useState<"form" | "paying" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const regResponse = await fetch(PUBLIC_API.trainingRegister, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tenantHeaders() },
        body: JSON.stringify({
          ...form,
          course_id: course.id,
          course_name: course.title,
          referral_code: form.referral_code,
          institute_slug: slug,
          // Country HINT only (never sets the amount — the server freezes the
          // charge currency from this). Mirrors the storefront's display hint.
          country: readCookie("country") || undefined,
        }),
      });

      const regData = await regResponse.json();

      if (!regResponse.ok) {
        setMessage(regData?.message ?? "Registration failed.");
        return;
      }

      if (course.price <= 0) {
        setStep("done");
        setMessage(regData?.message ?? "Registration complete!");
        return;
      }

      const payResponse = await fetch(PUBLIC_API.paystackInitialize, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tenantHeaders() },
        body: JSON.stringify({ registration_id: regData.registration_id }),
      });

      const payData = await payResponse.json();

      if (!payResponse.ok || !payData.authorization_url) {
        setMessage(payData?.message ?? "Could not initialize payment.");
        return;
      }

      setStep("paying");
      window.location.href = payData.authorization_url;
    } catch (err) {
      console.error("Registration/payment error:", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mt-6 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
        {message || "Registration submitted! Check your email for next steps."}
      </div>
    );
  }

  if (step === "paying") {
    return (
      <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
        Redirecting to payment...
      </div>
    );
  }

  // A non-primary institute that hasn't linked a payout bank can't take money
  // for a paid course yet (mirrors the backend 409 gate in initializePayment).
  // `purchasable` is only ever false for a paid course, so free courses still
  // show the form.
  if (course.purchasable === false) {
    return (
      <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-4 text-sm text-white/70">
        Registration for this course isn&apos;t open yet. The {label} is finishing its payment
        setup. Please check back soon.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} placeholder="First Name" className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
          <input required value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} placeholder="Last Name" className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required type="date" value={form.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
          <select required value={form.qualification_level} onChange={(e) => updateField("qualification_level", e.target.value)} className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white">
            <option value="">Qualification</option>
            {qualifications.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={form.phone_number} onChange={(e) => updateField("phone_number", e.target.value)} placeholder="Phone Number" className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
          <input required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Email" className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
        </div>
        <input required value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="WhatsApp Number" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
        <div className="flex gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white">
            <input type="radio" name="mode" value="live" checked={form.learning_mode === "live"} onChange={() => updateField("learning_mode", "live")} />
            Live
          </label>
          {/* Pre-recorded is a paid-plan feature. When this academy's plan doesn't
              offer it the radio is disabled (not clickable) and reads "not
              available" so a Free academy's visitors can't pick a mode it can't
              deliver. */}
          <label
            className={`flex items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 ${
              preRecordedAvailable ? "text-white" : "cursor-not-allowed text-white/40"
            }`}
            title={preRecordedAvailable ? undefined : "Pre-recorded classes are not available for this course"}
          >
            <input
              type="radio"
              name="mode"
              value="pre_recorded"
              disabled={!preRecordedAvailable}
              checked={form.learning_mode === "pre_recorded"}
              onChange={() => updateField("learning_mode", "pre_recorded")}
            />
            Pre-recorded{preRecordedAvailable ? "" : " (not available)"}
          </label>
        </div>
        <input value={form.referral_code} onChange={(e) => updateField("referral_code", e.target.value)} placeholder="Referral Code (optional - get 5% discount)" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
        <button type="submit" disabled={loading} className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60">
          {loading
            ? "Processing..."
            : course.price <= 0
              ? "Register Free"
              : `Register & Pay ${formatPrice(course.price_display ?? course.price, course.display_currency ?? "NGN")}`}
        </button>
        {message ? <p className="text-xs text-rose-200">{message}</p> : null}
      </form>
    </div>
  );
}
