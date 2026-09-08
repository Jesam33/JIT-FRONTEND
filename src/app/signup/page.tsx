"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { ACADEMY_NICHES, OTHER_NICHE } from "@/lib/niches";
import { isContactSalesPlan, type Plan } from "@/lib/plans";
import PlanCardBody from "@/components/plans/PlanCardBody";

// The plan cards here are the SAME cards as the billing page (/lms/admin/billing):
// both render the shared PlanCardBody from the shared lib/plans helpers, and the
// data comes from the same backend source (App\Support\PlanCatalogue, served
// publicly at /api/plans), so prices, limits, commission and the feature
// checklist can never drift between the two surfaces. Registering is still free
// to start: owners can pick the free tier (no payment, provisioned instantly)
// or a paid plan and pay via Paystack up front.
const DEFAULT_PLAN = "free";

// Minimal offline fallback if /api/plans is unreachable, mirroring the config
// defaults: enough shape for the shared card body (no feature checklist, the
// backend normally supplies it).
const FALLBACK_PLANS: Plan[] = [
  { slug: "free", name: "Free", price: 0, commission_percent: 5, limits: { courses: 3, students: 1, staff: 1 } },
  { slug: "basic", name: "Basic", price: 5000, commission_percent: 3, limits: { courses: 10, students: null, staff: 5 } },
  { slug: "pro", name: "Pro", price: 15000, commission_percent: 0, limits: { courses: 50, students: null, staff: 25 } },
];

// The domain each institute's public page lives under. Used only to preview the
// subdomain address on this form; the real front door is configured at deploy.
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "jorsastech.com";

function SignupInner() {
  const params = useSearchParams();
  const requestedPlan = (params.get("plan") || DEFAULT_PLAN).toLowerCase();

  const [plan, setPlan] = useState(requestedPlan);
  // The plan catalogue from /api/plans (same source as the billing cards);
  // falls back to the config-mirrored list if the fetch fails.
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [subdomain, setSubdomain] = useState("");
  // What the academy teaches, drives the public Campuses directory filter.
  // "Other" swaps the dropdown for the free-text field below it.
  const [niche, setNiche] = useState("");
  const [nicheOther, setNicheOther] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set on a successful FREE signup, the tenant is provisioned inline (no
  // payment), so we show an inline "check your email" panel instead of
  // redirecting to Paystack.
  const [done, setDone] = useState<{ message: string; email: string } | null>(null);

  const isFreePlan = plan === "free";

  // Load the plan catalogue (public endpoint, no auth). Contact-sales tiers
  // (Enterprise) are excluded from the selectable grid, they stay in the
  // contact-sales tile below it. If the requested ?plan= slug isn't a
  // selectable tier once the catalogue lands, fall back to free.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loaded: Plan[] = FALLBACK_PLANS;
      try {
        const res = await fetch(OWNER_API.plans, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.plans) && json.plans.length > 0) {
            loaded = json.plans as Plan[];
          }
        }
      } catch {
        // Keep the mirrored fallback.
      }
      if (!cancelled) {
        setPlans(loaded);
        setPlan((current) =>
          loaded.some((p) => p.slug === current && !isContactSalesPlan(p)) ? current : DEFAULT_PLAN,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Niche is required. "Other" swaps the dropdown for the free-text value.
    const resolvedNiche = (niche === OTHER_NICHE ? nicheOther : niche).trim();
    if (!resolvedNiche) {
      setError("Please choose what your academy teaches.");
      setLoading(false);
      return;
    }

    const form = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: String(form.get("tenant_name") || "").trim(),
      slug: String(form.get("subdomain") || "").trim().toLowerCase() || undefined,
      admin_name: `${String(form.get("first_name") || "").trim()} ${String(form.get("last_name") || "").trim()}`.trim(),
      admin_email: String(form.get("email") || "").trim(),
      // No password here, the owner sets it via the emailed setup link after payment.
      plan: String(form.get("plan") || DEFAULT_PLAN),
      niche: resolvedNiche,
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

      // Free plan: the institute is provisioned immediately (no payment). Show
      // an inline "check your email for your setup link" success instead of
      // redirecting to a payment page.
      if (json?.free === true) {
        setDone({
          message: json?.message || "Your Online Academy is ready. Check your email for your setup link.",
          email: payload.admin_email,
        });
        setLoading(false);
        return;
      }

      // Paid plan: the tenant is created `pending`. Hand off to Paystack to
      // collect payment, provisioning + the setup-link email happen only after
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

  // Free-plan success: the institute is live and the setup email is on its way.
  if (done) {
    return (
      <section className="section-pad section-divider">
        <div className="container-wide max-w-xl rounded-[20px] border border-white/20 bg-white/[0.04] p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Your Online Academy is ready</h1>
          <p className="mb-4 text-sm text-site-muted">{done.message}</p>
          <p className="mb-6 text-sm text-site-muted">
            We&apos;ve emailed a setup link to <span className="font-semibold text-white">{done.email}</span>. Open it to
            choose your password and sign in. Don&apos;t see it? Check your spam folder.
          </p>
          <Link
            href="/lms/admin/login"
            className="inline-flex rounded-full bg-[#ed180d] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Go to sign in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-pad section-divider">
      <div className="container-wide max-w-3xl rounded-[20px] border border-white/20 bg-white/[0.04] p-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Create your Online Academy</h1>
        <p className="mb-6 text-sm text-site-muted">
          Register your school or training organisation to get a dedicated LMS. Start free in minutes, or choose a
          paid plan for more features. Free Online Academies are ready right away; paid plans are set up the moment
          your payment is confirmed.
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
            {plans === null ? (
              // Skeleton while the catalogue loads.
              <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-[20px] border border-white/10 bg-white/[0.04]" />
                ))}
              </div>
            ) : (
              <div className="grid items-start gap-4 sm:grid-cols-3">
                {plans
                  .filter((p) => !isContactSalesPlan(p))
                  .map((p) => {
                    const selected = plan === p.slug;
                    return (
                      <button
                        type="button"
                        key={p.slug}
                        onClick={() => setPlan(p.slug)}
                        aria-pressed={selected}
                        className={`relative flex w-full flex-col rounded-[22px] border p-6 text-left transition ${
                          selected
                            ? "border-white/45 bg-white/[0.08] ring-1 ring-site-primary"
                            : "border-white/15 bg-white/[0.04] hover:border-white/25"
                        }`}
                      >
                        {p.slug === "basic" ? (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90">
                            Popular
                          </span>
                        ) : null}

                        {/* Shared card body, identical to the billing plan cards. */}
                        <PlanCardBody plan={p} />

                        <span
                          className={`mt-5 inline-flex items-center gap-2 text-xs font-semibold ${
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
            )}
            <input type="hidden" name="plan" value={plan} />
            <p className="mt-3 text-xs text-site-muted">
              {isFreePlan
                ? "Free forever, no card required. Upgrade any time from your dashboard."
                : "Billed monthly. You can change plans any time from your dashboard."}{" "}
              The applicable platform fee is deducted from each eligible successful course sale.
            </p>

            {/* Enterprise is contact-sales, unlimited everything, custom terms. Not a
                self-serve checkout plan, so it sits below the selectable grid as an enquiry CTA. */}
            <div className="mt-4 rounded-[20px] border border-white/20 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold uppercase tracking-wide text-white">Enterprise</span>
                    <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
                      Unlimited
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-site-muted">
                    Unlimited courses, students &amp; staff · 0% platform fee · everything in Pro, plus API access,
                    white-label &amp; dedicated support.
                  </p>
                </div>
                <a
                  href="mailto:contact@jorsastech.com?subject=Enterprise%20plan%20enquiry"
                  className="shrink-0 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Contact sales
                </a>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">Online Academy name</label>
            <input name="tenant_name" required placeholder="e.g. Bright Future Academy" className={inputCls} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">What does your academy teach?</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className={inputCls}
              aria-label="What your academy teaches"
            >
              <option value="" disabled>
                Select a category
              </option>
              {ACADEMY_NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value={OTHER_NICHE}>Other (type your own)</option>
            </select>
            {niche === OTHER_NICHE && (
              <input
                type="text"
                value={nicheOther}
                onChange={(e) => setNicheOther(e.target.value)}
                maxLength={80}
                placeholder="e.g. Aviation training"
                className={`${inputCls} mt-3`}
                aria-label="Your academy category"
              />
            )}
            <p className="mt-2 text-xs text-site-muted">
              This is how students find your academy when they browse by category. Pick the closest match, or choose
              Other to enter your own.
            </p>
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
              <p className="text-white/80">This becomes your Online Academy&apos;s own web address.</p>
              <p className="mt-1">
                It&apos;s the link you share with students and staff, so they can browse your courses and sign in,
                instead of the main Jorsas site. Your page will live at{" "}
                <span className="font-semibold text-white">
                  {subdomain || "youracademy"}.{APP_DOMAIN}
                </span>
                .
              </p>
              <p className="mt-1">
                Lowercase letters, numbers, and hyphens only. Leave blank and we&apos;ll create one from your Online Academy name.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#ed180d] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading
                ? isFreePlan
                  ? "Setting up…"
                  : "Redirecting to payment…"
                : isFreePlan
                  ? "Create my Online Academy"
                  : "Continue to payment"}
            </button>
            <p className="text-sm text-site-muted">
              Already have one?{" "}
              <Link href="/lms/admin/login" className="text-white underline">
                Sign in
              </Link>
            </p>
          </div>

          {isFreePlan ? (
            <p className="md:col-span-2 text-xs text-site-muted">
              No payment needed. Your free Online Academy is ready instantly. We&apos;ll email a setup link so you can
              choose your password and sign in. Upgrade any time from your dashboard.
            </p>
          ) : (
            <p className="md:col-span-2 text-xs text-site-muted">
              Payments are processed securely by Paystack. You&apos;ll be redirected to complete your payment, then
              brought back here to finish setup.
            </p>
          )}
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
