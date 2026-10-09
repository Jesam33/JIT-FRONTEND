"use client";

import { useEffect, useRef, useState } from "react";
import { PUBLIC_API } from "@/lib/api";
import { tenantHeaders } from "@/lib/tenant-client";
import { formatPrice, readCookie } from "@/lib/currency";
import { academyLabel, type OwnerBranding } from "@/lib/owner-branding";
import { referralCodeFor } from "@/lib/referral";
import { useCourseMode } from "@/components/institute/course-mode";
import { useMyEnrolment, studentPortalHref } from "@/lib/my-enrolment";

type CourseDetail = {
  id: number;
  slug: string;
  title: string;
  price: number;
  // The academy's own currency (the price is in it).
  currency?: string;
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
  // Optional cheaper price for the pre-recorded mode (null when the course
  // charges one price for both). `_display` mirrors the FX path used for the
  // live `price_display`. The button below shows whichever the chosen mode
  // costs; the backend re-derives the authoritative charge from learning_mode.
  prerecorded_price?: number | null;
  prerecorded_price_display?: number | null;
  // Cohort registration window (see LmsTrack::registrationOpen). False hides
  // the form (see InstituteCourseDetail); kept optional so any older caller
  // still type-checks. The backend independently rejects a direct submit.
  registration_open?: boolean;
  // "monthly": the price is the first month; the student pays again each month.
  billing_type?: "one_time" | "monthly";
  // One-on-one: private sessions with a teacher, at its own price.
  is_one_on_one_available?: boolean;
  one_on_one_price?: number | null;
  one_on_one_price_display?: number | null;
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
  learning_mode: "live" | "pre_recorded" | "one_on_one";
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
// creating the registration, essential on /i/{slug} storefronts, which carry
// no tenant cookie (the page was server-rendered). Absent → backend falls back
// to the header/primary tenant, preserving the apex flow's behaviour.
// `branding` threads this academy's configurable noun into visitor-facing copy.
export default function CourseRegisterClient({
  course,
  slug,
  academySlug,
  branding,
}: {
  course: CourseDetail;
  slug?: string;
  // The academy this page belongs to (also set on the apex primary page, where
  // `slug` is not), used to recognise a logged-in student of THIS academy.
  academySlug?: string;
  branding?: OwnerBranding | null;
}) {
  const label = academyLabel(branding).singular;
  // A logged-in student of this academy sees where they stand instead of the
  // form: enrolled here → "Go to my course"; enrolled in another course here →
  // one course per academy, so no form. (undefined while checking.)
  const mine = useMyEnrolment(academySlug ?? slug);
  // Pre-recorded is a paid feature; the backend only sets this true when the
  // academy's plan unlocks it. Defaults true when absent so the apex/NGN flow
  // (which doesn't send the flag) keeps both modes.
  const preRecordedAvailable = course.is_prerecorded_available !== false;
  const [form, setForm] = useState<FormData>(initialForm);
  const [step, setStep] = useState<"form" | "paying" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  // Set when the email typed is already enrolled at this academy (checked as
  // soon as the email field is left, and again by the server on submit). The
  // form then offers "Log in" instead of a registration that would be refused.
  const [enrolledNotice, setEnrolledNotice] = useState<{ message: string; portalPath: string } | null>(null);
  const lastCheckedEmail = useRef("");

  const portalSlug = academySlug ?? slug;
  function loginHref(portalPath: string): string {
    const base = portalSlug ? studentPortalHref(portalSlug, "/lms/login") : "/lms/login";
    return `${base}${base.includes("?") ? "&" : "?"}next=${encodeURIComponent(portalPath)}`;
  }

  // Turn an "already enrolled" answer (early check, or a 409 on submit) into the
  // notice; returns whether it was one.
  function showEnrolledNotice(data: { already_enrolled?: boolean; enrolled_elsewhere?: boolean; message?: string; portal_path?: string } | null): boolean {
    if (!data?.already_enrolled && !data?.enrolled_elsewhere) return false;
    setEnrolledNotice({
      message: data.message ?? "This email is already enrolled at this academy.",
      portalPath: data.portal_path ?? "/lms/app",
    });
    return true;
  }

  // Early check when the visitor leaves the email field. Best-effort: any
  // failure just leaves the form as it was (the submit check still applies).
  async function checkEmail(email: string) {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.toLowerCase() === lastCheckedEmail.current) return;
    lastCheckedEmail.current = trimmed.toLowerCase();
    try {
      const res = await fetch(PUBLIC_API.trainingCheckEnrolment, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...tenantHeaders() },
        body: JSON.stringify({ email: trimmed, course_id: course.id, institute_slug: slug }),
      });
      if (!res.ok) return;
      const data = await res.json();
      // Ignore a stale answer if the email changed while it was in flight.
      if (lastCheckedEmail.current !== trimmed.toLowerCase()) return;
      if (!showEnrolledNotice(data)) setEnrolledNotice(null);
    } catch {
      // Network hiccup: nothing to show; the server re-checks on submit.
    }
  }

  // Which price the chosen delivery mode costs. Pre-recorded uses its own
  // cheaper price when the course sets one, else falls back to the live price.
  // Display-only, LmsIntakeController::register() re-derives the charge from
  // learning_mode server-side, so the button can never disagree with the bill.
  const usePrerecordedPrice =
    form.learning_mode === "pre_recorded" && course.prerecorded_price != null;
  const useOneOnOnePrice = form.learning_mode === "one_on_one" && course.one_on_one_price != null;
  // The pay button shows what is actually charged: the academy's own price in
  // its own currency (the approximate local price is shown above it).
  const chargePrice = usePrerecordedPrice
    ? course.prerecorded_price ?? course.price
    : useOneOnOnePrice
      ? course.one_on_one_price ?? course.price
      : course.price;
  const chargeCurrency = course.charge_currency ?? course.currency ?? "NGN";

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // A student who arrived through an Admission Marketer's shared link gets the
  // referral code filled in for them (see lib/referral). Prefilled, not locked:
  // it is optional, and the visitor can correct or clear it. Read after mount
  // because it comes from the URL and storage, neither of which exists on the
  // server, so doing it during render would mismatch the server's HTML.
  useEffect(() => {
    const code = referralCodeFor(slug);
    if (!code) return;
    setForm((prev) => (prev.referral_code ? prev : { ...prev, referral_code: code }));
  }, [slug]);

  // Publish the chosen delivery mode so the price headline above follows it
  // (CourseAside). Null outside a provider, so this is a no-op when the form is
  // rendered somewhere with no price panel.
  const courseMode = useCourseMode();
  const publishMode = courseMode?.setMode;
  useEffect(() => {
    publishMode?.(form.learning_mode);
  }, [form.learning_mode, publishMode]);

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
          // Country HINT only (never sets the amount, the server freezes the
          // charge currency from this). Mirrors the storefront's display hint.
          country: readCookie("country") || undefined,
        }),
      });

      const regData = await regResponse.json();

      if (!regResponse.ok) {
        if (showEnrolledNotice(regData)) return;
        setMessage(regData?.message ?? "Registration failed.");
        return;
      }

      // Always hand the registration to the payment endpoint — even for a FREE
      // course. The backend's free path (handleZeroPayment) is what approves
      // the registration, creates the student account and emails the setup
      // link; skipping it used to leave free registrations stuck at "pending"
      // with the student never receiving anything. For a free course it
      // responds with a success message and NO authorization_url.
      const payResponse = await fetch(PUBLIC_API.paystackInitialize, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tenantHeaders() },
        body: JSON.stringify({ registration_id: regData.registration_id }),
      });

      const payData = await payResponse.json();

      if (!payResponse.ok) {
        if (showEnrolledNotice(payData)) return;
        setMessage(payData?.message ?? "Could not complete registration.");
        return;
      }

      // Free course: no payment URL comes back, the registration is already
      // complete on the server — show the backend's success message.
      if (!payData.authorization_url) {
        setStep("done");
        setMessage(payData?.message ?? regData?.message ?? "Registration complete!");
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

  if (mine && (academySlug ?? slug)) {
    const portalSlug = (academySlug ?? slug) as string;
    const thisCourse = mine.courseId === course.id;
    const billing = mine.billing?.monthly ? mine.billing : null;
    const paidUntil = billing?.paid_until
      ? new Date(billing.paid_until).toLocaleDateString(undefined, { day: "numeric", month: "short" })
      : null;

    return (
      <div className="mt-6 space-y-3 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-50">
        {thisCourse ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Enrolled</p>
            <p>
              You&apos;re enrolled in this course.
              {billing && billing.status !== "ended"
                ? billing.locked
                  ? " Your monthly payment is overdue, so your access is paused until you pay."
                  : paidUntil
                    ? ` Paid until ${paidUntil}.`
                    : ""
                : ""}
            </p>
          </>
        ) : (
          <p>
            You&apos;re already enrolled in <span className="font-semibold">{mine.courseTitle}</span> at this{" "}
            {label.toLowerCase()}. Each student can take one course per {label.toLowerCase()}.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <a
            href={studentPortalHref(portalSlug)}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Go to my course
          </a>
          {thisCourse && billing && billing.status !== "ended" && (billing.locked || billing.due) ? (
            <a
              href={studentPortalHref(portalSlug, "/lms/app/billing")}
              className="rounded-md border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Pay for this month
            </a>
          ) : null}
        </div>
      </div>
    );
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

  // Cohort registration window closed (every cohort's cutoff has passed).
  // Defense in depth: InstituteCourseDetail normally hides this whole client,
  // this catches a stale page or a direct render after the deadline passed.
  if (course.registration_open === false) {
    return (
      <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
        Registration for this course has closed. Please check back for the next cohort.
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
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => {
              updateField("email", e.target.value);
              // A different email gets a fresh check when the field is left.
              if (enrolledNotice) setEnrolledNotice(null);
              lastCheckedEmail.current = "";
            }}
            onBlur={(e) => checkEmail(e.target.value)}
            placeholder="Email"
            className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
        </div>
        <input required value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="WhatsApp Number" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
        <div className="flex flex-wrap gap-3">
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
          {/* One-on-one: private live sessions with a teacher, at its own price.
              Shown only when the course (and the academy's plan) offers it. */}
          {course.is_one_on_one_available ? (
            <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white">
              <input
                type="radio"
                name="mode"
                value="one_on_one"
                checked={form.learning_mode === "one_on_one"}
                onChange={() => updateField("learning_mode", "one_on_one")}
              />
              One-on-one
            </label>
          ) : null}
        </div>
        {form.learning_mode === "one_on_one" ? (
          <p className="text-xs text-white/60">
            Private live sessions with your own teacher, who schedules them with you after you register.
          </p>
        ) : null}
        <input value={form.referral_code} onChange={(e) => updateField("referral_code", e.target.value)} placeholder="Referral Code (optional - get 5% discount)" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white" />
        {enrolledNotice ? (
          <div className="space-y-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-50">
            <p>{enrolledNotice.message}</p>
            <a
              href={loginHref(enrolledNotice.portalPath)}
              className="inline-block rounded-md bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Log in
            </a>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading || !!enrolledNotice}
          className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          {loading
            ? "Processing..."
            : course.price <= 0
              ? "Register Free"
              : course.billing_type === "monthly"
                ? `Register & Pay ${formatPrice(chargePrice, chargeCurrency)} for month 1`
                : `Register & Pay ${formatPrice(chargePrice, chargeCurrency)}`}
        </button>
        {message ? <p className="text-xs text-rose-200">{message}</p> : null}
      </form>
    </div>
  );
}
