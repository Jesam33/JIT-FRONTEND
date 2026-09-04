"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OWNER_API } from "@/lib/api";
import { ownerAuthHeaders, getOwnerToken, readOwnerBranding } from "@/lib/owner-client";
import { academyLabel } from "@/lib/owner-branding";
import { pinTenantFromLocation, tenantLoginPath } from "@/lib/tenant-client";

type VerifyState = "verifying" | "active" | "pending" | "error";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<VerifyState>("verifying");
  const [plan, setPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const run = useCallback(async () => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) {
      setState("error");
      setMessage("No payment reference was provided.");
      return;
    }
    try {
      const res = await fetch(OWNER_API.billingVerify(reference), { headers: ownerAuthHeaders() });
      if (res.status === 401 || res.status === 403) {
        router.replace(tenantLoginPath("owner"));
        return;
      }
      const json = await res.json().catch(() => ({}));

      if (res.status === 202) {
        // Payment not yet confirmed by Paystack — offer a retry.
        setState("pending");
        setMessage(json?.message || "Your payment is still being confirmed.");
        return;
      }
      if (!res.ok) {
        setState("error");
        setMessage(json?.message || `Verification failed (HTTP ${res.status}).`);
        return;
      }

      setState("active");
      setPlan(json?.plan ?? null);
      // The owner shell resolved identity (plan tag, paid-feature badges) once on
      // mount; this page lives inside that shell, so tell it to refetch now that
      // the plan changed — otherwise "Back to dashboard" would show the old plan.
      window.dispatchEvent(new CustomEvent("owner-identity-refresh"));
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }, [params, router]);

  useEffect(() => {
    // Re-pin THIS academy from the callback's ?tenant= first — the Paystack
    // round-trip can arrive with the tenant cookie missing (fresh/other origin),
    // and the login fallback below would otherwise show the primary (jorsas) brand.
    pinTenantFromLocation();
    if (!getOwnerToken()) {
      router.replace(tenantLoginPath("owner"));
      return;
    }
    run();
  }, [run, router]);

  // This academy's configurable noun, read synchronously from the shell cookie.
  const label = academyLabel(readOwnerBranding()).singular;

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="rounded-[20px] border border-white/20 bg-white/[0.04] p-8 text-center">
          {state === "verifying" && (
            <>
              <h1 className="mb-2 text-2xl font-semibold text-white">Confirming your payment…</h1>
              <p className="text-sm text-site-muted">This only takes a moment.</p>
            </>
          )}

          {state === "active" && (
            <>
              <div className="mb-4 text-4xl">🎉</div>
              <h1 className="mb-2 text-2xl font-semibold text-white">
                You&apos;re on the <span className="capitalize">{plan ?? "new"}</span> plan
              </h1>
              <p className="mb-6 text-sm text-site-muted">
                Your upgrade is active. Every feature on this plan is now unlocked for your {label}.
              </p>
              <Link
                href="/lms/admin"
                className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
              >
                Back to dashboard
              </Link>
            </>
          )}

          {state === "pending" && (
            <>
              <h1 className="mb-2 text-2xl font-semibold text-white">Almost there</h1>
              <p className="mb-6 text-sm text-site-muted">{message}</p>
              <button
                onClick={() => {
                  setState("verifying");
                  run();
                }}
                className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
              >
                Check again
              </button>
            </>
          )}

          {state === "error" && (
            <>
              <h1 className="mb-2 text-2xl font-semibold text-white">Something went wrong</h1>
              <p className="mb-6 text-sm text-red-200">{message}</p>
              <Link
                href="/lms/admin/billing"
                className="inline-block rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Back to billing
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <VerifyInner />
    </Suspense>
  );
}
