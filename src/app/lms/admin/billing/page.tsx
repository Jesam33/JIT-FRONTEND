"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken } from "@/lib/owner-client";
import { tenantLoginPath } from "@/lib/tenant-client";

type Plan = { slug: string; name: string; price: number };
type BillingStatus = {
  tenant: { id: number; slug: string; name: string };
  plan: string;
  subscription_status: string;
  current_period_end: string | null;
  plans: Plan[];
  billing_configured: boolean;
};

// Short marketing blurbs per plan. Feature *limits* are deferred (see plan);
// these are display-only so the cards read like a real pricing page. Free is not
// offered here (owners self-serve upgrades only), so the copy is self-contained.
const BLURBS: Record<string, string[]> = {
  basic: [
    "Full LMS — courses, modules & portals",
    "Custom branding (logo, colors, font)",
    "Certificates & priority email support",
  ],
  pro: [
    "Everything in Basic",
    "Dedicated onboarding",
    "Advanced reporting & analytics",
    "Early access to new features",
  ],
};

function naira(n: number) {
  return n <= 0 ? "Free" : `₦${n.toLocaleString()}`;
}

export default function BillingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
      router.replace("/lms/admin/login");
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
        body: JSON.stringify({ plan: plan.slug }),
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

  const currentPlan = status?.plan ?? "free";

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
              <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-6 text-sm text-site-muted">
                Current plan:{" "}
                <span className="font-semibold capitalize text-white">{currentPlan}</span>
                {status.current_period_end && currentPlan !== "free" && (
                  <> · renews {new Date(status.current_period_end).toLocaleDateString()}</>
                )}
                {!status.billing_configured && (
                  <div className="mt-2 text-xs text-amber-200/80">
                    Paid upgrades are not enabled on this environment yet.
                  </div>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {status.plans.filter((plan) => plan.slug !== "free").map((plan) => {
                  const isCurrent = plan.slug === currentPlan;
                  const isPaid = plan.price > 0;
                  const disabled = isCurrent || (isPaid && !status.billing_configured) || busyPlan !== null;
                  return (
                    <div
                      key={plan.slug}
                      className={`flex flex-col rounded-[20px] border p-6 ${
                        isCurrent ? "border-white/40 bg-white/[0.07]" : "border-white/20 bg-white/[0.04]"
                      }`}
                    >
                      <div className="text-sm uppercase tracking-wide text-site-muted">{plan.name}</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{naira(plan.price)}</div>
                      {isPaid && <div className="text-xs text-site-muted">per month</div>}
                      <ul className="mt-6 space-y-2 text-sm text-white/80">
                        {(BLURBS[plan.slug] ?? []).map((b) => (
                          <li key={b} className="flex gap-2">
                            <span className="text-[--color-primary]">✓</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => choose(plan)}
                        disabled={disabled}
                        className={`mt-8 rounded-full px-5 py-2 text-sm font-semibold ${
                          isCurrent
                            ? "border border-white/20 text-white"
                            : "bg-white text-black"
                        } disabled:opacity-60`}
                      >
                        {isCurrent
                          ? "Current plan"
                          : busyPlan === plan.slug
                            ? "Starting…"
                            : isPaid
                              ? `Upgrade to ${plan.name}`
                              : `Switch to ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
    </div>
  );
}
