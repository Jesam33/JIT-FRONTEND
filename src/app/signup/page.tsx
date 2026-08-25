"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";

// Pay-first: there is no free tier at signup. Every institute picks a paid plan
// and completes payment via Paystack before anything is provisioned. Feature
// lists are display-only (mirrors src/lib/content.ts pricingPlans) so owners
// understand what each plan includes before they pay.
const PLANS = [
  {
    slug: "basic",
    label: "Basic",
    price: "₦5,000",
    note: "/month",
    popular: true,
    tagline: "Everything you need to run your institute online.",
    features: [
      "Full LMS — courses, modules, tasks & grading",
      "Student & staff portals",
      "Attendance tracking & certificates",
      "Custom branding — your logo, colors & font",
      "Priority email support",
    ],
  },
  {
    slug: "pro",
    label: "Pro",
    price: "₦15,000",
    note: "/month",
    popular: false,
    tagline: "For growing institutes that want deeper insight and hands-on help.",
    features: [
      "Everything in Basic",
      "Dedicated onboarding & setup help",
      "Advanced reporting & analytics",
      "Early access to new features",
    ],
  },
];
const DEFAULT_PLAN = "basic";

// The domain each institute's public page lives under. Used only to preview the
// subdomain address on this form; the real front door is configured at deploy.
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "jorsastech.com";

function SignupInner() {
  const params = useSearchParams();
  const requestedPlan = (params.get("plan") || DEFAULT_PLAN).toLowerCase();
  const validPlan = PLANS.some((p) => p.slug === requestedPlan) ? requestedPlan : DEFAULT_PLAN;

  const [plan, setPlan] = useState(validPlan);
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: String(form.get("tenant_name") || "").trim(),
      slug: String(form.get("subdomain") || "").trim().toLowerCase() || undefined,
      admin_name: `${String(form.get("first_name") || "").trim()} ${String(form.get("last_name") || "").trim()}`.trim(),
      admin_email: String(form.get("email") || "").trim(),
      // No password here — the owner sets it via the emailed setup link after payment.
      plan: String(form.get("plan") || DEFAULT_PLAN),
    };

    try {
      const res = await fetch(OWNER_API.signup, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 422) {
        const first = json?.errors ? Object.values(json.errors)[0] : null;
        setError((Array.isArray(first) ? first[0] : json?.message) || "Please check the form and try again.");
        setLoading(false);
        return;
      }
      if (res.status !== 201) {
        setError(json?.message || `Signup failed (HTTP ${res.status}).`);
        setLoading(false);
        return;
      }

      // Success: the tenant is created `pending`. Hand off to Paystack to
      // collect payment — provisioning + the setup-link email happen only after
      // payment confirms (on the /signup/verify page and via the webhook).
      if (json?.authorization_url) {
        window.location.href = json.authorization_url as string;
        return; // keep the button disabled through navigation
      }

      setError("We couldn't start your payment. Please try again.");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white";

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-2xl rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Create your institute</h1>
        <p className="mb-6 text-sm text-site-muted">
          Register your school or training organisation to get a dedicated LMS. Choose a plan and complete payment —
          your institute is set up the moment your payment confirms.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/80">First name</label>
            <input name="first_name" required placeholder="First name" className={inputCls} />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Last name</label>
            <input name="last_name" placeholder="Last name" className={inputCls} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Email</label>
            <input name="email" required type="email" placeholder="you@example.com" className={inputCls} />
            <p className="mt-2 text-xs text-site-muted">
              After payment we&apos;ll email a setup link to this address so you can choose your password and sign in.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Choose your plan</label>
            <div className="grid gap-4 sm:grid-cols-2">
              {PLANS.map((p) => {
                const selected = plan === p.slug;
                return (
                  <button
                    type="button"
                    key={p.slug}
                    onClick={() => setPlan(p.slug)}
                    aria-pressed={selected}
                    className={`flex flex-col rounded-[20px] border p-5 text-left transition ${
                      selected
                        ? "border-white/45 bg-white/[0.08] ring-1 ring-site-primary"
                        : "border-white/20 bg-white/[0.04] hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold uppercase tracking-wide text-white">{p.label}</span>
                      {p.popular && (
                        <span className="rounded-full bg-site-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Most popular
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{p.price}</span>
                      <span className="text-xs text-site-muted">{p.note}</span>
                    </div>
                    <p className="mt-1 text-xs text-site-muted">{p.tagline}</p>
                    <ul className="mt-4 space-y-1.5 text-xs text-white/80">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <span className="mt-0.5 shrink-0 text-site-primary">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <span
                      className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold ${
                        selected ? "text-white" : "text-site-muted"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          selected ? "border-site-primary bg-site-primary" : "border-white/30"
                        }`}
                      >
                        {selected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-white">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {selected ? "Selected" : "Select"}
                    </span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="plan" value={plan} />
            <p className="mt-3 text-xs text-site-muted">
              Billed monthly. You can change plans any time from your dashboard.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Institute name</label>
            <input name="tenant_name" required placeholder="e.g. Acme Institute of Technology" className={inputCls} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Subdomain (optional)</label>
            <input
              name="subdomain"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="acme"
              className={inputCls}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-site-muted">
              <p className="text-white/80">This becomes your institute&apos;s own web address.</p>
              <p className="mt-1">
                It&apos;s the link you share with students and staff — they visit it to browse your courses and sign in,
                instead of the main Jorsas site. Your page will live at{" "}
                <span className="font-semibold text-white">
                  {subdomain || "yourschool"}.{APP_DOMAIN}
                </span>
                .
              </p>
              <p className="mt-1">
                Lowercase letters, numbers, and hyphens only. Leave blank and we&apos;ll create one from your institute name.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#ed180d] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Redirecting to payment…" : "Continue to payment"}
            </button>
            <p className="text-sm text-site-muted">
              Already have one?{" "}
              <Link href="/lms/admin/login" className="text-white underline">
                Sign in
              </Link>
            </p>
          </div>

          <p className="md:col-span-2 text-xs text-site-muted">
            Payments are processed securely by Paystack. You&apos;ll be redirected to complete your payment, then
            brought back here to finish setup.
          </p>
        </form>
      </div>
    </section>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<section className="section-pad section-divider" />}>
      <SignupInner />
    </Suspense>
  );
}
