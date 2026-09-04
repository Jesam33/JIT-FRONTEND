"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";

// A plan limit; null means unlimited.
type Limits = { courses: number | null; students: number | null; staff: number | null };
// Plan feature flags — keys mirror config/saas.php `features` (all 13).
type Features = {
  live_classes: boolean;
  chat: boolean;
  certificates: boolean;
  pre_recorded_video: boolean;
  admission_marketer: boolean;
  remove_branding: boolean;
  advanced_analytics: boolean;
  advanced_reporting: boolean;
  custom_domain: boolean;
  priority_support: boolean;
  ai_materials: boolean;
  api_access: boolean;
  white_label: boolean;
};
// One plan in the upgrade catalogue (from TenantBillingController::planCatalogue).
// Enterprise is a contact-sales tier: price is null and contact_sales is true.
type Plan = {
  slug: string;
  name: string;
  label?: string | null;
  price: number | null;
  contact_sales?: boolean;
  commission_percent?: number;
  limits?: Limits;
  features?: Features;
};
// The resolved current plan + live usage (from Tenant::planSummaryArray).
type PlanSummary = {
  slug: string;
  name: string;
  commission_percent: number;
  limits: Limits;
  features: Features;
  usage?: { courses: number; students: number; staff: number };
};
type BillingStatus = {
  tenant: { id: number; slug: string; name: string };
  plan: string;
  subscription_status: string;
  current_period_end: string | null;
  plan_summary?: PlanSummary;
  plans: Plan[];
  billing_configured: boolean;
};

// Human labels for the plan feature flags (keys mirror config/saas.php features).
const FEATURE_LABELS: Record<keyof Features, string> = {
  live_classes: "Live classes",
  chat: "Group chat",
  certificates: "Certificates",
  pre_recorded_video: "Pre-recorded video lessons",
  admission_marketer: "Admission-Marketer network",
  remove_branding: "Remove “Powered by Jorsastech” badge",
  advanced_analytics: "Advanced analytics",
  advanced_reporting: "Advanced reporting & exports",
  custom_domain: "Custom domain",
  priority_support: "Priority support",
  ai_materials: "AI material generation",
  api_access: "API access",
  white_label: "Full white-label",
};

// A short, warm one-liner per tier (display-only; the limits + features shown
// below each are the real, enforced values from the backend).
const TAGLINES: Record<string, string> = {
  free: "Launch your academy online at no cost.",
  basic: "Live classes, chat & certificates for growing academies.",
  pro: "Scale with the lowest fees, AI materials & deepest insight.",
  enterprise: "Custom limits, full white-label & API for large organisations.",
};

// The price line: Enterprise is contact-sales (no self-serve price); ₦0 is Free.
function priceText(plan: Plan) {
  if (plan.contact_sales || plan.price == null) return "Contact sales";
  return plan.price <= 0 ? "Free" : `₦${plan.price.toLocaleString()}`;
}

// A plan limit rendered for humans: null (or missing) means unlimited.
function limitText(n: number | null | undefined) {
  return n == null ? "Unlimited" : n.toLocaleString();
}

// The three quota lines for a plan card ("3 courses · 50 students · 1 staff").
function limitSummary(limits?: Limits): string {
  if (!limits) return "";
  return [
    `${limitText(limits.courses)} course${limits.courses === 1 ? "" : "s"}`,
    `${limitText(limits.students)} student${limits.students === 1 ? "" : "s"}`,
    `${limitText(limits.staff)} staff`,
  ].join(" · ");
}

// One usage line ("Students  12 / 50") with a progress bar; unlimited plans show
// the count only. The bar turns amber near the cap so owners see it coming.
function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit == null;
  const pct = unlimited || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const near = !unlimited && pct >= 80;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/80">{label}</span>
        <span className="font-semibold text-white">
          {used.toLocaleString()}
          {unlimited ? <span className="font-normal text-site-muted"> · Unlimited</span> : ` / ${limit.toLocaleString()}`}
        </span>
      </div>
      {!unlimited ? (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${near ? "bg-amber-400" : "bg-[--color-primary]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function BillingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // The horizontal plan carousel — used to arrow-scroll on desktop and to
  // auto-centre the owner's current (elevated) plan when the page loads.
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OWNER_API.billingStatus, { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (!res.ok) {
        setError(`Could not load billing (HTTP ${res.status}).`);
        return;
      }
      setStatus(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getOwnerToken()) {
      router.replace(tenantLoginPath("owner"));
      return;
    }
    load();
  }, [load, router]);

  const choose = async (plan: Plan) => {
    setNotice(null);
    setError(null);
    setBusyPlan(plan.slug);
    try {
      const res = await fetch(OWNER_API.billingCheckout, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAuthHeaders() },
        // Tell the backend which origin we're on so Paystack returns us HERE. The
        // owner token (localStorage) and tenant cookie are per-origin, so a return
        // to any other host drops both and lands on a bare "jorsas" login.
        body: JSON.stringify({ plan: plan.slug, return_origin: typeof window !== "undefined" ? window.location.origin : undefined }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      if (res.status === 503) {
        setError(json?.message || "Payments are not enabled yet. Please contact support.");
        return;
      }
      if (!res.ok) {
        setError(json?.message || `Checkout failed (HTTP ${res.status}).`);
        return;
      }

      // Free plan activates server-side with no redirect.
      if (json?.free || json?.status === "active") {
        setNotice(`You're now on the ${json?.plan ?? plan.slug} plan.`);
        await load();
        return;
      }

      if (json?.authorization_url) {
        window.location.href = json.authorization_url;
        return;
      }

      setError("Could not start checkout. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyPlan(null);
    }
  };

  const summary = status?.plan_summary;
  // Resolve current plan from the summary (which maps the primary institute to
  // the top tier), falling back to the raw stored plan.
  const currentPlan = summary?.slug ?? status?.plan ?? "free";

  // Scroll the carousel by one card (+ the gap) — wired to the desktop arrows.
  const scrollByCard = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-plan]");
    const amount = (card ? card.offsetWidth : 300) + 20; // card width + gap-5 (20px)
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  // On load, bring the current plan into view centred — it's the "popped-out"
  // card, so the swiper should open focused on the tier the owner is on.
  useEffect(() => {
    if (!status) return;
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-plan="${currentPlan}"]`);
    if (!card) return;
    const left = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [status, currentPlan]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold display-gradient sm:text-3xl">Billing &amp; plans</h1>
        <Link href="/lms/admin" className="text-sm text-site-muted hover:text-white">
          ← Dashboard
        </Link>
      </div>

      {loading && <div className="text-sm text-site-muted">Loading…</div>}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      )}

      {status && (
        <>
          {/* Current plan + live usage against the plan's caps. */}
          <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-site-muted">Current plan</div>
                <div className="mt-1 text-2xl font-semibold capitalize text-white">{summary?.name ?? currentPlan}</div>
              </div>
              <div className="text-right text-sm text-site-muted">
                {typeof summary?.commission_percent === "number" ? (
                  <div>
                    Platform fee: <span className="font-semibold text-white">{summary.commission_percent}%</span> on course sales
                  </div>
                ) : null}
                {status.current_period_end && currentPlan !== "free" ? (
                  <div>Renews {new Date(status.current_period_end).toLocaleDateString()}</div>
                ) : null}
              </div>
            </div>

            {summary?.usage ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <UsageRow label="Courses" used={summary.usage.courses} limit={summary.limits.courses} />
                <UsageRow label="Students" used={summary.usage.students} limit={summary.limits.students} />
                <UsageRow label="Staff" used={summary.usage.staff} limit={summary.limits.staff} />
              </div>
            ) : null}

            {!status.billing_configured ? (
              <div className="mt-5 text-xs text-amber-200/80">
                Paid upgrades are not enabled on this environment yet.
              </div>
            ) : null}
          </div>

          {/* Full plan comparison — a swipeable carousel. The current plan is
              "popped out" (scaled, ringed, badged) the way pricing sections
              highlight the active tier. Cards are wide and peek at the edges so
              it reads as a swiper: arrows scroll on desktop, touch/trackpad on
              the rest. No carousel library — native scroll-snap. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous plans"
              className="absolute -left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-xl text-white shadow-lg backdrop-blur transition hover:bg-black/90 lg:flex"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Next plans"
              className="absolute -right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-xl text-white shadow-lg backdrop-blur transition hover:bg-black/90 lg:flex"
            >
              ›
            </button>

            <div
              ref={scrollerRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {status.plans.map((plan) => {
                const isCurrent = plan.slug === currentPlan;
                const isContact = !!plan.contact_sales || plan.price == null;
                const isPaid = !isContact && (plan.price ?? 0) > 0;
                const disabled = isCurrent || (isPaid && !status.billing_configured) || busyPlan !== null;
                const features = plan.features;
                return (
                  <div
                    key={plan.slug}
                    data-plan={plan.slug}
                    className={`relative flex w-[280px] shrink-0 snap-center flex-col rounded-[22px] border p-6 transition-all duration-300 sm:w-[304px] ${
                      isCurrent
                        ? "z-10 scale-[1.03] border-[--color-primary]/60 bg-white/[0.08] shadow-2xl shadow-black/50 ring-1 ring-[--color-primary]/50"
                        : "border-white/15 bg-white/[0.04] hover:border-white/25"
                    }`}
                  >
                    {isCurrent ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[--color-primary] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                        Your plan
                      </span>
                    ) : plan.slug === "basic" ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90">
                        Popular
                      </span>
                    ) : null}

                    <div className="text-sm uppercase tracking-wide text-site-muted">{plan.name}</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{priceText(plan)}</div>
                    <div className="text-xs text-site-muted">
                      {isContact ? "tailored to you" : isPaid ? "per month" : "forever"}
                    </div>

                    {TAGLINES[plan.slug] ? <p className="mt-3 text-xs text-site-muted">{TAGLINES[plan.slug]}</p> : null}

                    {typeof plan.commission_percent === "number" ? (
                      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80">
                        <span className="font-semibold text-white">{plan.commission_percent}%</span> platform fee on course sales
                      </div>
                    ) : null}

                    {plan.limits ? <div className="mt-3 text-xs text-site-muted">{limitSummary(plan.limits)}</div> : null}

                    {features ? (
                      <ul className="mt-4 space-y-2 text-sm">
                        {(Object.keys(FEATURE_LABELS) as (keyof Features)[]).map((key) => {
                          const on = features[key];
                          return (
                            <li key={key} className={`flex items-center gap-2 ${on ? "text-white/85" : "text-site-muted"}`}>
                              <span className={on ? "text-emerald-400" : "text-white/30"}>{on ? "✓" : "—"}</span>
                              <span className={on ? "" : "opacity-70"}>{FEATURE_LABELS[key]}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}

                    {isContact ? (
                      <a
                        href="mailto:contact@jorsastech.com?subject=Enterprise%20plan%20enquiry"
                        className={`mt-auto block rounded-full px-5 py-2.5 text-center text-sm font-semibold transition ${
                          isCurrent ? "border border-white/20 text-white" : "bg-white text-black hover:brightness-90"
                        }`}
                      >
                        {isCurrent ? "Current plan" : "Contact sales"}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => choose(plan)}
                        disabled={disabled}
                        className={`mt-auto rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                          isCurrent ? "border border-white/20 text-white" : "bg-white text-black hover:brightness-90"
                        }`}
                      >
                        {isCurrent
                          ? "Current plan"
                          : busyPlan === plan.slug
                            ? "Starting…"
                            : isPaid
                              ? `Upgrade to ${plan.name}`
                              : `Switch to ${plan.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-1 text-center text-[11px] text-site-muted lg:hidden">Swipe to compare plans →</div>
          </div>

          <p className="text-xs text-site-muted">
            The applicable platform fee is deducted from each eligible successful course sale,
            never an upfront charge. Prices are in Naira, billed monthly, and you can change plans any time.
          </p>
        </>
      )}
    </div>
  );
}
